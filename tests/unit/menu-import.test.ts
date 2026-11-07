import { describe, expect, it } from "vitest";
import { IMPORT_TEMPLATE, parseCsv, parseMenuCsv } from "@/lib/domain/menu-import";

describe("importar carta", () => {
  it("lee CSV con comillas, comas y saltos de línea", () => {
    expect(parseCsv('a,b\n"x, y","línea 1\nlínea 2"\n')).toEqual([["a", "b"], ["x, y", "línea 1\nlínea 2"]]);
    expect(parseCsv('a,b\n"con ""comillas""",2')).toEqual([["a", "b"], ['con "comillas"', "2"]]);
  });

  it("detecta punto y coma o tabulador (Excel en español)", () => {
    expect(parseCsv("categoria;producto\nA;B")[1]).toEqual(["A", "B"]);
    expect(parseCsv("categoria\tproducto\nA\tB")[1]).toEqual(["A", "B"]);
  });

  it("carga la plantilla completa sin errores", () => {
    const r = parseMenuCsv(IMPORT_TEMPLATE);
    expect(r.errors).toEqual([]);
    expect(r.items).toHaveLength(5);
    expect(r.categories).toEqual(["Botanas", "Mezcales", "Bebidas sin alcohol", "Postres"]);
    const mezcal = r.items[2];
    expect(mezcal.variants).toEqual([{ name: "Copa", priceCents: 9000 }, { name: "Botella", priceCents: 120000 }]);
    expect(mezcal.priceCents).toBe(9000);
    expect(r.items[0].tags).toEqual(["vegetariano"]);
    expect(r.items[4].available).toBe(false);
  });

  it("acepta encabezados con acentos, mayúsculas y sinónimos", () => {
    const r = parseMenuCsv("Categoría,Nombre,Descripción,Precio\nTacos,Pastor,,$22.50");
    expect(r.errors).toEqual([]);
    expect(r.items[0]).toMatchObject({ category: "Tacos", name: "Pastor", priceCents: 2250 });
  });

  it("marca errores por línea sin detener el resto", () => {
    const r = parseMenuCsv("categoria,producto,precio,variantes\nTacos,Pastor,22,\nTacos,Suadero,veintidós,\n,Sin categoría,10,\nMezcal,Tobalá,,Copa\n");
    expect(r.items.map((i) => i.name)).toEqual(["Pastor"]);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4, 5]);
  });

  it("exige las columnas mínimas", () => {
    expect(parseMenuCsv("nombre del platillo,costo\nA,1").errors[0].message).toMatch(/categoria y producto/);
  });

  it("une categorías iguales aunque cambien acentos o mayúsculas", () => {
    expect(parseMenuCsv("categoria,producto,precio\nBebidas,A,1\nbebidas,B,2\nBEBÍDAS,C,3").categories).toEqual(["Bebidas"]);
  });
});
