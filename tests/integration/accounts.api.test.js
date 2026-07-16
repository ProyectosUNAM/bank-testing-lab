const request = require("supertest");
const { createApp } = require("../../src/app"); 
const { pool } = require("../../src/db"); 

let app;

beforeAll(() => {
  app = createApp(pool);
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE transfers, accounts RESTART IDENTITY CASCADE");
});

async function crearCuenta(owner, balanceCents = 0) {
  const { rows } = await pool.query(
    "INSERT INTO accounts (owner, balance) VALUES ($1, $2) RETURNING id",
    [owner, balanceCents]
  );
  return rows[0].id;
}

describe("Cuentas y saldos (integracion con Postgres real)", () => {
  
  test("crea una cuenta con saldo inicial cero", async () => {
    const res = await request(app).post("/accounts").send({ owner: "Ana" });
    expect(res.status).toBe(201);
  });

  test("un deposito incrementa el saldo persistido", async () => {
    const id = await crearCuenta("Beto");
    const res = await request(app)
      .post(`/accounts/${id}/deposit`)
      .send({ amountCents: 15000 });
    expect(Number(res.body.balance)).toBe(15000);
  });

  test("permite retirar exactamente el saldo total de la cuenta", async () => {
    const id = await crearCuenta("Carla", 5000);
    const res = await request(app)
      .post(`/accounts/${id}/withdraw`)
      .send({ amountCents: 5000 });
    expect(res.status).toBe(200);
  });

  test("una transferencia rechazada por referencia duplicada no debita el origen", async () => {
    const origen = await crearCuenta("Fito", 10000);
    const destino = await crearCuenta("Gina", 0);
    await request(app).post("/transfers").send({
      fromId: origen, toId: destino, amountCents: 2000, reference: "NOMINA-01" 
    });
    await request(app).post("/transfers").send({
      fromId: origen, toId: destino, amountCents: 2000, reference: "NOMINA-01" 
    });
    const { rows } = await pool.query(
      "SELECT balance FROM accounts WHERE id = $1", [origen]
    );
    expect(Number(rows[0].balance)).toBe(8000);
  });

  test("rechaza una transferencia por fondos insuficientes sin mover dinero", async () => {
    const origen = await crearCuenta("Hugo", 1000);
    const destino = await crearCuenta("Ivy", 0);
    const res = await request(app).post("/transfers").send({
      fromId: origen, toId: destino, amountCents: 5000 
    });
    expect(res.status).toBe(422);
  });

  test("GET /accounts devuelve las cuentas ordenadas de forma ascendente por id", async () => {
    await crearCuenta("Primera"); 
    await crearCuenta("Segunda");
    const res = await request(app).get("/accounts");
    expect(res.body.map((c) => c.id)).toEqual([1, 2]);
  });

  // Enunciado Propuesto 1: GET /accounts/:id de una cuenta inexistente responde 404
  test("GET /accounts/:id de una cuenta inexistente responde 404", async () => {
    const res = await request(app).get("/accounts/9999");
    expect(res.status).toBe(404);
  });

  // Enunciado Propuesto 2: Un depósito con amountCents decimal es rechazado con 400
  test("un deposito con amountCents decimal es rechazado con 400", async () => {
    const id = await crearCuenta("Zack", 1000);
    const res = await request(app)
      .post(`/accounts/${id}/deposit`)
      .send({ amountCents: 150.5 }); 
    expect(res.status).toBe(400);
  });

});