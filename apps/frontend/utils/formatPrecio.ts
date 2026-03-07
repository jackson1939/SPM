// utils/formatPrecio.ts — formatea números como precios enteros con separador de miles (.)
// Ejemplo: 1234567 → "1.234.567" (sin decimales en todo el sistema)

export function formatPrecio(n: number | null | undefined): string {
  const num = typeof n === "number" && !isNaN(n) ? Math.round(n) : 0;
  const entero = String(num);
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
