// utils/formatPrecio.ts — formatea números como precios con separador de miles (.) y decimales (,)
// Ejemplo: 1234567.89 → "1.234.567,89"  |  0.5 → "0,50"

export function formatPrecio(n: number | null | undefined): string {
  const num = typeof n === "number" && !isNaN(n) ? n : 0;
  const [entero, decimal] = num.toFixed(2).split(".");
  const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return enteroFormateado + "," + decimal;
}
