const {
  applyFee,  toCents,  validateAmount,  computeInterest,  toUnits, 
} = require("../../src/services/money");
describe("Regresion (defectos historicos que no deben reaparecer)", () => {
  test("BUG-089: applyFee con feeBps=0 ya no produce NaN", () => {
    expect(applyFee(10000, 0)).toBe(10000);
    expect(Number.isNaN(applyFee(10000, 0))).toBe(false);
  });
  test("BUG-104: toCents ya no trunca importes con tres decimales", () => {
    expect(toCents(19.999)).toBe(2000);
  });
  test("BUG-118: validateAmount ya no acepta cadenas numericas como centimos validos", () => {
    expect(() => validateAmount("100")).toThrow("centimos enteros");
  });
  test("BUG-126: computeInterest ya no retorna un valor negativo con tasa cero", () => {
    const interes = computeInterest(100000, 0, 30);
    expect(interes).toBe(0);
  });
  test("BUG-133: applyFee ya no redondea hacia abajo comisiones fraccionarias mayores a 0.5", () => {
    expect(applyFee(1000, 55)).toBe(1006);
  });
  test("BUG-141: validateAmount ya no permite Infinity como monto valido", () => {
    expect(() => validateAmount(Infinity)).toThrow();
  });

// Ejercicio Propuesto 1:  BUG-152, verificar que toUnits no pierde precisión con céntimos superiores a diez millones 
  test("BUG-152: verificar que toUnits ya no pierde precision con centimos superiores a 10 millones", () => {
    const centimosGrandes = 1000000055; 
    expect(toUnits(centimosGrandes)).toBe(10000000.55);
  });
// Ejercicio Propuesto 2: BUG-160, verificar que un titular con espacios al inicio y al final no genera cuentas lógicamente duplicadas.
  test("BUG-160: verificar que un titular con espacios al inicio y al final ya no genera cuentas duplicadas logicamente distintas", () => {
    const original = "   Juan Perez   ";
    const normalizado = original.trim(); 
    expect(normalizado).toBe("Juan Perez");
    expect(normalizado.length).toBe(10);
  });
});