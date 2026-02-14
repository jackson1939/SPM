import * as XLSX from "xlsx";

export function exportToExcel(data: any[], fileName: string) {
  // Crear hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

  // Exportar archivo
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}