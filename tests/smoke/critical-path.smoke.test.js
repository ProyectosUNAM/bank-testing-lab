const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body =
    res.status !== 204 ? await res.json().catch(() => null) : null;
  return { status: res.status, body };
}

describe("Smoke test (verificacion critica post-despliegue)", () => {
  test("el servicio esta arriba", async () => {
    const { status } = await api("/health");
    expect(status).toBe(200);
  });

  test("se puede crear una cuenta", async () => {
    const { status, body } = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeUser" }),
    });
    expect(status).toBe(201);
    expect(body.id).toBeDefined();
  });

  test("se puede depositar en una cuenta recien creada", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeDeposito" }),
    });
    const { status, body } = await api(
      `/accounts/${cuenta.body.id}/deposit`,
      { method: "POST", body: JSON.stringify({ amountCents: 1000 }) }
    );
    expect(status).toBe(200);
    expect(Number(body.balance)).toBe(1000);
  });

  test("se puede consultar el listado de cuentas", async () => {
    const { status, body } = await api("/accounts");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  test("se puede ejecutar una transferencia basica entre dos cuentas", async () => {
    const origen = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeOrigen" }),
    });
    await api(`/accounts/${origen.body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 5000 }),
    });
    const destino = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeDestino" }),
    });

    const { status } = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: origen.body.id,
        toId: destino.body.id,
        amountCents: 5000,
      }),
    });
    expect(status).toBe(201);
  });

  test("se puede retirar la totalidad del saldo depositado", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeRetiro" }),
    });
    await api(`/accounts/${cuenta.body.id}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 2000 }),
    });

    const { status } = await api(`/accounts/${cuenta.body.id}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 2000 }),
    });
    expect(status).toBe(200);
  });

  //Ejercicio Propuesto 1: GET /accounts/:id responde en menos de 300 ms
  test("el endpoint GET /accounts/:id responde en menos de 300 ms para una cuenta existente", async () => {
    const cuenta = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SmokeTimeTest" }),
    });
    const id = cuenta.body.id;

    const inicio = performance.now();
    const { status } = await api(`/accounts/${id}`);
    const fin = performance.now();
    
    const tiempoRespuesta = fin - inicio;

    expect(status).toBe(200);
    expect(tiempoRespuesta).toBeLessThan(300); 
  });

  //Ejercicio Propuesto 2: Las cinco rutas principales responden sin error 500 en un recorrido secuencial
  test("las cinco rutas principales (health, accounts, deposit, withdraw, transfers) responden todas dentro de un mismo recorrido secuencial sin error 500", async () => {
    
    // Ruta 1: health
    const rHealth = await api("/health");
    expect(rHealth.status).not.toBe(500);
    // Ruta 2: accounts
    const rOrigen = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SecuencialOrigen" }),
    });
    expect(rOrigen.status).not.toBe(500);
    const rDestino = await api("/accounts", {
      method: "POST",
      body: JSON.stringify({ owner: "SecuencialDestino" }),
    });
    expect(rDestino.status).not.toBe(500);
    const idOrigen = rOrigen.body.id;
    const idDestino = rDestino.body.id;
    // Ruta 3: deposit (Depositar al origen)
    const rDeposit = await api(`/accounts/${idOrigen}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 3000 }),
    });
    expect(rDeposit.status).not.toBe(500);
    // Ruta 4: withdraw (Hacer un retiro parcial del origen)
    const rWithdraw = await api(`/accounts/${idOrigen}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amountCents: 1000 }),
    });
    expect(rWithdraw.status).not.toBe(500);
    // Ruta 5: transfers (Transferir el saldo restante al destino)
    const rTransfers = await api("/transfers", {
      method: "POST",
      body: JSON.stringify({
        fromId: idOrigen,
        toId: idDestino,
        amountCents: 2000,
      }),
    });
    expect(rTransfers.status).not.toBe(500);
  });
});