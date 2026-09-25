function toPdfText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function createTextPdf(title: string, bodyLines: string[]): Blob {
  const lines = [title, "", ...bodyLines];
  let y = 780;
  const streamContent = lines
    .map((line) => {
      const command = `BT /F1 11 Tf 50 ${y} Td (${toPdfText(line || " ")}) Tj ET\n`;
      y -= 14;
      return command;
    })
    .join("");

  const chunks: string[] = ["%PDF-1.4\n"];
  const objectOffsets: number[] = [];

  const addObject = (objectNumber: number, body: string): void => {
    objectOffsets[objectNumber] = byteLength(chunks.join(""));
    chunks.push(`${objectNumber} 0 obj\n${body}\nendobj\n`);
  };

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    3,
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  );
  addObject(
    4,
    `<< /Length ${byteLength(streamContent)} >>\nstream\n${streamContent}endstream`,
  );
  addObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const xrefOffset = byteLength(chunks.join(""));
  const objectCount = objectOffsets.length;

  chunks.push(`xref\n0 ${objectCount}\n`);
  chunks.push("0000000000 65535 f \n");

  for (let index = 1; index < objectCount; index += 1) {
    chunks.push(`${String(objectOffsets[index]).padStart(10, "0")} 00000 n \n`);
  }

  chunks.push("trailer\n");
  chunks.push(`<< /Size ${objectCount} /Root 1 0 R >>\n`);
  chunks.push("startxref\n");
  chunks.push(`${xrefOffset}\n`);
  chunks.push("%%EOF\n");

  return new Blob([chunks.join("")], { type: "application/pdf" });
}

export function formatReportCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatReportDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
