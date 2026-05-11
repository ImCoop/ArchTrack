const escapePdf = (value: string) => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

export const renderTextPdf = (title: string, lines: string[]) => {
  const content = [
    'BT',
    '/F1 18 Tf',
    '50 790 Td',
    `(${escapePdf(title)}) Tj`,
    '/F1 10 Tf',
    '0 -28 Td',
    ...lines.flatMap((line) => [`(${escapePdf(line)}) Tj`, '0 -16 Td']),
    'ET',
  ].join('\n');
  const stream = Buffer.from(content, 'utf8');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length} >> stream\n${content}\nendstream endobj`,
  ];
  const header = '%PDF-1.4\n';
  const offsets: number[] = [];
  let body = '';

  for (const object of objects) {
    offsets.push(Buffer.byteLength(header + body, 'utf8'));
    body += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(header + body, 'utf8');
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ].join('\n');

  return Buffer.from(`${header}${body}${xref}`, 'utf8');
};
