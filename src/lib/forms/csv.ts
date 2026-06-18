// Construcción de CSV segura (pura y testeable).
// Mitiga inyección de fórmulas (CSV/Excel formula injection): una celda que
// empieza con = + - @ o caracteres de control puede ejecutarse al abrirse en
// Excel/Sheets. Se neutraliza anteponiendo una comilla simple.

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: string): string {
  let s = value ?? "";
  if (FORMULA_PREFIX.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

// rows[0] = encabezados. Devuelve CSV con BOM para que Excel detecte UTF-8.
export function buildCsv(rows: string[][]): string {
  return "﻿" + rows.map((r) => r.map((c) => csvCell(String(c))).join(",")).join("\r\n");
}
