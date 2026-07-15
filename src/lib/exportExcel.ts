"use client";

// Génère un vrai classeur .xlsx (format binaire OOXML), contrairement à
// l'ancienne astuce qui servait du HTML avec une extension .xls : Excel
// détectait le décalage entre le contenu réel et l'extension déclarée et
// affichait "le fichier est peut-être corrompu" (strict sur Excel mobile /
// Excel Online, plus tolérant sur Excel Desktop).
//
// Import dynamique : exceljs pèse ~250 Ko, on ne le télécharge donc que
// lorsque l'utilisateur clique réellement sur "Exporter Excel", pas au
// chargement de la page.
export async function buildExcelBlob(
  headers: string[],
  rows: string[][],
  sheetName = "Export"
): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(headers);
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5B4FCF" } };
  });

  for (const row of rows) sheet.addRow(row);

  sheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
