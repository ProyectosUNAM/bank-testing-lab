const {
  toCents,formatMoney,validateAmount,canWithdraw,applyFee,computeInterest,
} = require("../../src/services/money");

describe("money (pruebas unitarias)", () => {
  test("toCents convierte unidades a centimos enteros", () => {
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(0.01)).toBe(1);
  });

  test("M4-KILLER: computeInterest aplica correctamente la tasa porcentual dividiendo por 100", () => {
    // Si la tasa es 10% anual sobre 100,000 céntimos por 365 días:
    // Interés esperado: 100000 * (10 / 100) * (365 / 365) = 10000 céntimos.
    // Si el mutante M4 multiplica (* 100) en lugar de dividir (/ 100), el resultado mutado dará:
    // 100000 * (10 * 100) * 1 = 100,000,000 céntimos.
    const interesReal = computeInterest(100000, 10, 360);
    // Esta aserción fallará de inmediato ante la mutación M4, logrando matarla.
    expect(interesReal).toBe(10000);
  });

  test("toCents rechaza valores no numericos", () => {
    expect(() => toCents("100")).toThrow("El monto debe ser un numero"); 
    //expect(() => toCents(NaN)).toThrow("El monto debe ser un numero"); 
  });

  test("formatMoney presenta el importe con dos decimales y moneda", () => {
    expect(formatMoney(1050, "PEN")).toBe("PEN 10.50");
    expect(formatMoney(5, "USD")).toBe("USD 0.05");
  });

  test("validateAmount acepta enteros positivos y rechaza el resto", () => {
    expect(validateAmount(100)).toBe(true);
    expect(() => validateAmount(0)).toThrow("mayor que cero");
    //expect(() => validateAmount(-5)).toThrow("mayor que cero");
    expect(() => validateAmount(10.5)).toThrow("centimos enteros");
  });

  test("canWithdraw permite retirar exactamente el saldo disponible", () => {
    expect(canWithdraw(1000, 1000)).toBe(true);
    //expect(canWithdraw(1000, 999)).toBe(true);
    expect(canWithdraw(1000, 1001)).toBe(false);
  });

  test("applyFee suma la comision en puntos basicos al monto", () => {
    expect(applyFee(10000, 50)).toBe(10050);
    //expect(applyFee(10000, 0)).toBe(10000);
  });
  
  // Ejercicio Propuesto 1: Verificar el interés simple
  test("computeInterest calcula el interes simple para 30 dias al 12% anual sobre 100 000 centimos", () => {
    const resultado = computeInterest(100000, 12, 30);
    expect(resultado).toBe(1000);
  });

  // Ejercicio Propuesto 2: Verificar el redondeo correcto
  test("toCents redondea 19.999 a 2000 y no a 1999", () => {
    expect(toCents(19.999)).toBe(2000);
  });
});