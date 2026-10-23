'use client';

import {
  type DocumentFormatConfig,
  escapeHtml,
  extractWhereAsClausesAndBody,
  type FormattedDocumentData,
  inferSanggunianBodyName,
} from '@lexigov/shared';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';

function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function downloadOfficialDocx(data: FormattedDocumentData, config: DocumentFormatConfig): Promise<void> {
  const { legislativeBody, officeName, enactingClauseBody } = inferSanggunianBodyName(
    data.jurisdiction,
    data.jurisdictionName,
  );
  const parsed = extractWhereAsClausesAndBody(data.body);

  const paragraphs: Paragraph[] = [];

  // 1. Official Header
  if (config.includeSeals) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'REPUBLIC OF THE PHILIPPINES',
            font: config.fontFamily,
            bold: true,
            size: 22,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: data.jurisdictionName.toUpperCase(),
            font: config.fontFamily,
            bold: true,
            size: 24,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: officeName,
            font: config.fontFamily,
            bold: true,
            size: 20,
          }),
        ],
      }),
    );
  }

  // 2. Session Minutes Excerpt
  if (config.includeSessionExcerpt && config.sessionDetails) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 120, after: 120 },
        children: [
          new TextRun({
            text: `DRAFT SESSION DETAILS — NOT VERIFIED AGAINST OFFICIAL MINUTES. ${config.sessionDetails.sessionType} SESSION OF THE ${legislativeBody}; VENUE: ${config.sessionDetails.sessionVenue.toUpperCase() || 'NOT PROVIDED'}; DATE: ${config.sessionDetails.sessionDate || 'NOT PROVIDED'}.`,
            font: config.fontFamily,
            italics: true,
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'PRESENT:',
            font: config.fontFamily,
            bold: true,
            size: 18,
          }),
        ],
      }),
    );

    for (const member of config.sessionDetails.presentMembers) {
      paragraphs.push(
        new Paragraph({
          indent: { left: 400 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `• ${member}`,
              font: config.fontFamily,
              size: 18,
            }),
          ],
        }),
      );
    }

    if (config.sessionDetails.absentMembers.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [
            new TextRun({
              text: 'ABSENT:',
              font: config.fontFamily,
              bold: true,
              size: 18,
            }),
          ],
        }),
      );
      for (const member of config.sessionDetails.absentMembers) {
        paragraphs.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `• ${member}`,
                font: config.fontFamily,
                size: 18,
              }),
            ],
          }),
        );
      }
    }
  }

  // 3. Document Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: data.enactmentNumber
            ? `${data.documentType.toUpperCase()} NO. ${data.enactmentNumber}`
            : `${data.documentType.toUpperCase()} NO. ____-___`,
          font: config.fontFamily,
          bold: true,
          size: 26,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: data.title.toUpperCase(),
          font: config.fontFamily,
          bold: true,
          size: 24,
        }),
      ],
    }),
  );

  // 4. WHEREAS Preamble
  for (const clause of parsed.whereAsClauses) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120 },
        indent: { firstLine: 400 },
        children: [
          new TextRun({
            text: clause,
            font: config.fontFamily,
            size: 22,
          }),
        ],
      }),
    );
  }

  // 5. Enacting Clause
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 160, after: 160 },
      children: [
        new TextRun({
          text: parsed.enactingClause || enactingClauseBody,
          font: config.fontFamily,
          bold: true,
          size: 22,
        }),
      ],
    }),
  );

  // 6. Substantive Sections
  if (parsed.sections.length > 0) {
    for (const sec of parsed.sections) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: `${sec.heading}. — `,
              font: config.fontFamily,
              bold: true,
              size: 22,
            }),
            new TextRun({
              text: sec.body,
              font: config.fontFamily,
              size: 22,
            }),
          ],
        }),
      );
    }
  } else {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.body,
            font: config.fontFamily,
            size: 22,
          }),
        ],
      }),
    );
  }

  // 7. Signature Blocks
  if (config.includeSignatures) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 300, after: 120 },
        children: [
          new TextRun({
            text: 'DRAFT SIGNATORY PLACEHOLDERS — NO SIGNATURE OR APPROVAL IS RECORDED',
            font: config.fontFamily,
            italics: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200, after: 40 },
        children: [
          new TextRun({
            text: config.signatories.secretaryName.toUpperCase(),
            font: config.fontFamily,
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: config.signatories.secretaryTitle,
            font: config.fontFamily,
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: 'PROPOSED PRESIDING OFFICER:',
            font: config.fontFamily,
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200, after: 40 },
        children: [
          new TextRun({
            text: config.signatories.presidingOfficerName.toUpperCase(),
            font: config.fontFamily,
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: config.signatories.presidingOfficerTitle,
            font: config.fontFamily,
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: 'PROPOSED LOCAL CHIEF EXECUTIVE:',
            font: config.fontFamily,
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200, after: 40 },
        children: [
          new TextRun({
            text: config.signatories.chiefExecutiveName.toUpperCase(),
            font: config.fontFamily,
            bold: true,
            size: 20,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: config.signatories.chiefExecutiveTitle,
            font: config.fontFamily,
            size: 18,
          }),
        ],
      }),
    );
  }

  paragraphs.unshift(
    new Paragraph({
      children: [new TextRun({ text: 'WORKING DRAFT — NOT AN OFFICIAL RECORD', bold: true })],
    }),
  );
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'This export has not been authenticated or legally certified by LexiGov.', size: 16 }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1800,
              right: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(data.title)}_draft.docx`;
  triggerBlobDownload(blob, filename);
}

export function downloadOfficialPdf(data: FormattedDocumentData, config: DocumentFormatConfig): void {
  const doc = new jsPDF({
    unit: 'pt',
    format: config.paperSize === 'LEGAL' ? 'legal' : config.paperSize === 'LETTER' ? 'letter' : 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 60;
  const marginRight = 60;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 60;

  doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');

  // Header
  if (config.includeSeals) {
    doc.setFontSize(11);
    doc.text('REPUBLIC OF THE PHILIPPINES', pageWidth / 2, y, { align: 'center' });
    y += 16;
    doc.setFontSize(13);
    doc.text(data.jurisdictionName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 16;
    doc.setFontSize(10);
    const { officeName } = inferSanggunianBodyName(data.jurisdiction, data.jurisdictionName);
    doc.text(officeName, pageWidth / 2, y, { align: 'center' });
    y += 24;
    doc.setLineWidth(0.75);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 20;
  }

  // Optional draft session metadata. This is never represented as an official minutes excerpt.
  if (config.includeSessionExcerpt && config.sessionDetails) {
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'italic');
    doc.setFontSize(9);
    const sessionText = `DRAFT SESSION DETAILS — NOT VERIFIED AGAINST OFFICIAL MINUTES. ${config.sessionDetails.sessionType} SESSION; VENUE: ${config.sessionDetails.sessionVenue.toUpperCase() || 'NOT PROVIDED'}; DATE: ${config.sessionDetails.sessionDate || 'NOT PROVIDED'}.`;
    const sessionLines = doc.splitTextToSize(sessionText, contentWidth);
    doc.text(sessionLines, marginLeft, y);
    y += sessionLines.length * 12 + 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
  }

  // Title
  doc.setFontSize(13);
  const enactmentTitle = data.enactmentNumber
    ? `${data.documentType.toUpperCase()} NO. ${data.enactmentNumber}`
    : `${data.documentType.toUpperCase()} NO. ____-___`;
  doc.text(enactmentTitle, pageWidth / 2, y, { align: 'center' });
  y += 18;

  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize(data.title.toUpperCase(), contentWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 14 + 16;

  // Body content
  doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
  doc.setFontSize(config.fontSizePt);

  const parsed = extractWhereAsClausesAndBody(data.body);

  const bodyLineHeight = config.fontSizePt * config.lineSpacing;
  const ensureBodySpace = (height = bodyLineHeight) => {
    if (y + height > pageHeight - 50) {
      doc.addPage();
      y = 60;
    }
  };
  const drawBodyBlock = (text: string, bold = false, spacingAfter = 8) => {
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    for (const line of lines) {
      ensureBodySpace();
      doc.text(line, marginLeft, y);
      y += bodyLineHeight;
    }
    y += spacingAfter;
  };

  for (const clause of parsed.whereAsClauses) {
    drawBodyBlock(clause);
  }

  // Enacting clause
  const { enactingClauseBody } = inferSanggunianBodyName(data.jurisdiction, data.jurisdictionName);
  drawBodyBlock(parsed.enactingClause || enactingClauseBody, true, 12);

  // Sections, or the complete source body when no formal sections can be parsed.
  if (parsed.sections.length > 0) {
    for (const sec of parsed.sections) {
      drawBodyBlock(`${sec.heading}. —`, true, 4);
      drawBodyBlock(sec.body, false, 10);
    }
  } else {
    drawBodyBlock(data.body, false, 10);
  }

  // Signatures
  if (config.includeSignatures) {
    if (y > pageHeight - 180) {
      doc.addPage();
      y = 60;
    }
    y += 20;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'italic');
    doc.setFontSize(10);
    doc.text('DRAFT SIGNATORY PLACEHOLDERS — NO SIGNATURE OR APPROVAL IS RECORDED', marginLeft, y);
    y += 30;

    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text(config.signatories.secretaryName.toUpperCase(), pageWidth - marginRight, y, { align: 'right' });
    y += 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
    doc.text(config.signatories.secretaryTitle, pageWidth - marginRight, y, { align: 'right' });
    y += 24;

    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text('PROPOSED PRESIDING OFFICER:', marginLeft, y);
    y += 24;
    doc.text(config.signatories.presidingOfficerName.toUpperCase(), pageWidth - marginRight, y, { align: 'right' });
    y += 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
    doc.text(config.signatories.presidingOfficerTitle, pageWidth - marginRight, y, { align: 'right' });
    y += 24;

    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text('PROPOSED LOCAL CHIEF EXECUTIVE:', marginLeft, y);
    y += 24;
    doc.text(config.signatories.chiefExecutiveName.toUpperCase(), pageWidth - marginRight, y, { align: 'right' });
    y += 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
    doc.text(config.signatories.chiefExecutiveTitle, pageWidth - marginRight, y, { align: 'right' });
  }

  for (let page = 1; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text('WORKING DRAFT — NOT AN OFFICIAL RECORD', marginLeft, pageHeight - 30);
  }

  doc.save(`${sanitizeFilename(data.title)}_draft.pdf`);
}

export function buildPrintDocumentHtml(data: FormattedDocumentData, config: DocumentFormatConfig): string {
  const { officeName, legislativeBody, enactingClauseBody } = inferSanggunianBodyName(
    data.jurisdiction,
    data.jurisdictionName,
  );
  const parsed = extractWhereAsClausesAndBody(data.body);

  const fontCss =
    config.fontFamily === 'Book Antiqua'
      ? '"Book Antiqua", "Palatino Linotype", Palatino, serif'
      : config.fontFamily === 'Times New Roman'
        ? '"Times New Roman", Times, serif'
        : 'Arial, sans-serif';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
        <title>${escapeHtml(data.title)}</title>
        <style>
          @page {
            size: ${config.paperSize === 'LEGAL' ? '8.5in 13in' : config.paperSize === 'LETTER' ? 'letter' : 'A4'};
            margin: 1in 1in 1in 1.25in;
          }
          body {
            font-family: ${fontCss};
            font-size: ${Number.isFinite(config.fontSizePt) ? Math.min(14, Math.max(9, config.fontSizePt)) : 11}pt;
            line-height: ${[1.15, 1.5, 2].includes(config.lineSpacing) ? config.lineSpacing : 1.15};
            color: #000;
            background: #fff;
            margin: 0;
            padding: 20px;
          }
          .header-seal {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
          }
          .header-seal h3 { margin: 0; font-size: 11pt; letter-spacing: 1px; }
          .header-seal h2 { margin: 4px 0; font-size: 13pt; }
          .header-seal p { margin: 0; font-size: 10pt; font-weight: bold; }
          .session-excerpt {
            margin: 16px 0;
            font-size: 9.5pt;
            font-style: italic;
            border-bottom: 1px dashed #666;
            padding-bottom: 12px;
          }
          .title-block {
            text-align: center;
            margin: 20px 0;
          }
          .title-block h1 {
            font-size: 13pt;
            margin: 8px 0;
          }
          .whereas {
            text-align: justify;
            text-indent: 0.5in;
            margin-bottom: 12px;
          }
          .enacting-clause {
            font-weight: bold;
            margin: 18px 0;
            text-align: justify;
          }
          .section {
            text-align: justify;
            margin-bottom: 14px;
          }
          .section-heading {
            font-weight: bold;
          }
          .signature-block {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .sig-line {
            text-align: right;
            margin-top: 24px;
          }
          .sig-name {
            font-weight: bold;
            text-decoration: underline;
          }
          .security-footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            font-size: 8pt;
            color: #555;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <p><strong>WORKING DRAFT — NOT AN OFFICIAL RECORD</strong></p>
        ${
          config.includeSeals
            ? `<div class="header-seal">
          <h3>REPUBLIC OF THE PHILIPPINES</h3>
          <h2>${escapeHtml(data.jurisdictionName.toUpperCase())}</h2>
          <p>${escapeHtml(officeName)}</p>
        </div>`
            : ''
        }

        ${
          config.includeSessionExcerpt && config.sessionDetails
            ? `
          <div class="session-excerpt">
            <p><strong>DRAFT SESSION DETAILS — NOT VERIFIED AGAINST OFFICIAL MINUTES</strong></p>
            <p>${escapeHtml(config.sessionDetails.sessionType)} SESSION OF THE ${escapeHtml(legislativeBody)}; VENUE: ${escapeHtml(config.sessionDetails.sessionVenue.toUpperCase() || 'NOT PROVIDED')}; DATE: ${escapeHtml(config.sessionDetails.sessionDate || 'NOT PROVIDED')}.</p>
            <p><strong>PRESENT:</strong> ${escapeHtml(config.sessionDetails.presentMembers.join(', '))}</p>
            ${config.sessionDetails.absentMembers.length > 0 ? `<p><strong>ABSENT:</strong> ${escapeHtml(config.sessionDetails.absentMembers.join(', '))}</p>` : ''}
          </div>
        `
            : ''
        }

        <div class="title-block">
          <h3>${escapeHtml(`${data.documentType.toUpperCase()} NO. ${data.enactmentNumber || '____-___'}`)}</h3>
          <h1>${escapeHtml(data.title.toUpperCase())}</h1>
        </div>

        ${parsed.whereAsClauses.map((clause) => `<div class="whereas">${escapeHtml(clause)}</div>`).join('')}

        <div class="enacting-clause">${escapeHtml(parsed.enactingClause || enactingClauseBody)}</div>

        ${
          parsed.sections.length > 0
            ? parsed.sections
                .map(
                  (sec) => `
                <div class="section">
                  <span class="section-heading">${escapeHtml(sec.heading)}. — </span>
                  <span>${escapeHtml(sec.body)}</span>
                </div>
              `,
                )
                .join('')
            : `<div class="section">${escapeHtml(data.body)}</div>`
        }

        ${
          config.includeSignatures
            ? `
          <div class="signature-block">
            <p><strong>DRAFT SIGNATORY PLACEHOLDERS — NO SIGNATURE OR APPROVAL IS RECORDED</strong></p>
            <p>Proposed Sanggunian Secretary:</p>
            <div class="sig-line">
              <div class="sig-name">${escapeHtml(config.signatories.secretaryName.toUpperCase())}</div>
              <div>${escapeHtml(config.signatories.secretaryTitle)}</div>
            </div>

            <p style="margin-top: 20px;"><strong>PROPOSED PRESIDING OFFICER:</strong></p>
            <div class="sig-line">
              <div class="sig-name">${escapeHtml(config.signatories.presidingOfficerName.toUpperCase())}</div>
              <div>${escapeHtml(config.signatories.presidingOfficerTitle)}</div>
            </div>

            <p style="margin-top: 20px;"><strong>PROPOSED LOCAL CHIEF EXECUTIVE:</strong></p>
            <div class="sig-line">
              <div class="sig-name">${escapeHtml(config.signatories.chiefExecutiveName.toUpperCase())}</div>
              <div>${escapeHtml(config.signatories.chiefExecutiveTitle)}</div>
            </div>
          </div>
        `
            : ''
        }

        <div class="security-footer">This export has not been authenticated or legally certified by LexiGov.</div>
      </body>
    </html>
  `;

  return html;
}

export function printOfficialDocument(data: FormattedDocumentData, config: DocumentFormatConfig): void {
  const html = buildPrintDocumentHtml(data, config);
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.opener = null;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
