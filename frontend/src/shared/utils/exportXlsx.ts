"use client";

export async function exportXlsx(
  rows: Array<Record<string, unknown>>,
  fileName: string,
  sheetName = "Reporte"
) {
  const mod = await import("exceljs");
  const ExcelJS = ("default" in mod ? mod.default : mod) as typeof import("exceljs");

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  const firstRow = rows[0];
  if (!firstRow) return;

  const keys = Object.keys(firstRow);
  worksheet.columns = keys.map((key) => ({
    header: key,
    key,
    width: Math.min(Math.max(key.length + 4, 16), 40),
  }));

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDC2626" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { horizontal: "center" };
  });

  rows.forEach((row) => {
    worksheet.addRow(row);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}
