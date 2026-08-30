'use client';

import {
  type DocumentFormatConfig,
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
            text: `EXCERPT FROM THE MINUTES OF THE ${config.sessionDetails.sessionType} SESSION OF THE ${legislativeBody} HELD AT ${config.sessionDetails.sessionVenue.toUpperCase()} ON ${config.sessionDetails.sessionDate}.`,
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
            : `${data.documentType.toUpperCase()} NO. 2026-___`,
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
            text: 'I HEREBY CERTIFY to the correctness of the foregoing Ordinance.',
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
            text: 'ATTESTED AND CERTIFIED TO BE DULY ADOPTED:',
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
            text: `APPROVED: ${config.signatories.approvalDate || '_______________________'}`,
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

  // 8. Security Stamp
  if (config.includeQrVerification && data.verificationHash) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 240, after: 60 },
        children: [
          new TextRun({
            text: `Document Verification Hash: ${data.verificationHash}`,
            font: config.fontFamily,
            size: 16,
            italics: true,
          }),
        ],
      }),
    );
  }

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
  const filename = `${sanitizeFilename(data.title)}_official.docx`;
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

  // Title
  doc.setFontSize(13);
  const enactmentTitle = data.enactmentNumber
    ? `${data.documentType.toUpperCase()} NO. ${data.enactmentNumber}`
    : `${data.documentType.toUpperCase()} NO. 2026-___`;
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

  for (const clause of parsed.whereAsClauses) {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 60;
    }
    const lines = doc.splitTextToSize(clause, contentWidth);
    doc.text(lines, marginLeft, y);
    y += lines.length * (config.fontSizePt * config.lineSpacing) + 8;
  }

  // Enacting clause
  if (y > pageHeight - 100) {
    doc.addPage();
    y = 60;
  }
  doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
  const { enactingClauseBody } = inferSanggunianBodyName(data.jurisdiction, data.jurisdictionName);
  const enactingLines = doc.splitTextToSize(parsed.enactingClause || enactingClauseBody, contentWidth);
  doc.text(enactingLines, marginLeft, y);
  y += enactingLines.length * (config.fontSizePt * config.lineSpacing) + 12;

  // Sections
  doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
  for (const sec of parsed.sections) {
    if (y > pageHeight - 100) {
      doc.addPage();
      y = 60;
    }
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text(`${sec.heading}. — `, marginLeft, y);
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');

    const lines = doc.splitTextToSize(sec.body, contentWidth);
    doc.text(lines, marginLeft, y + 14);
    y += lines.length * (config.fontSizePt * config.lineSpacing) + 16;
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
    doc.text('I HEREBY CERTIFY to the correctness of the foregoing Ordinance.', marginLeft, y);
    y += 30;

    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text(config.signatories.secretaryName.toUpperCase(), pageWidth - marginRight, y, { align: 'right' });
    y += 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
    doc.text(config.signatories.secretaryTitle, pageWidth - marginRight, y, { align: 'right' });
    y += 24;

    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text('ATTESTED AND CERTIFIED TO BE DULY ADOPTED:', marginLeft, y);
    y += 24;
    doc.text(config.signatories.presidingOfficerName.toUpperCase(), pageWidth - marginRight, y, { align: 'right' });
    y += 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
    doc.text(config.signatories.presidingOfficerTitle, pageWidth - marginRight, y, { align: 'right' });
    y += 24;

    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    doc.text(`APPROVED: ${config.signatories.approvalDate || '__________________'}`, marginLeft, y);
    y += 24;
    doc.text(config.signatories.chiefExecutiveName.toUpperCase(), pageWidth - marginRight, y, { align: 'right' });
    y += 12;
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'normal');
    doc.text(config.signatories.chiefExecutiveTitle, pageWidth - marginRight, y, { align: 'right' });
  }

  // Security Stamp
  if (config.includeQrVerification && data.verificationHash) {
    doc.setFontSize(8);
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'italic');
    doc.text(`Document Verification Hash: ${data.verificationHash}`, marginLeft, pageHeight - 30);
  }

  doc.save(`${sanitizeFilename(data.title)}_official.pdf`);
}

export function printOfficialDocument(data: FormattedDocumentData, config: DocumentFormatConfig): void {
  const { officeName, legislativeBody, enactingClauseBody } = inferSanggunianBodyName(
    data.jurisdiction,
    data.jurisdictionName,
  );
  const parsed = extractWhereAsClausesAndBody(data.body);

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

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
        <title>${data.title}</title>
        <style>
          @page {
            size: ${config.paperSize === 'LEGAL' ? '8.5in 13in' : config.paperSize === 'LETTER' ? 'letter' : 'A4'};
            margin: 1in 1in 1in 1.25in;
          }
          body {
            font-family: ${fontCss};
            font-size: ${config.fontSizePt}pt;
            line-height: ${config.lineSpacing};
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
        <div class="header-seal">
          <h3>REPUBLIC OF THE PHILIPPINES</h3>
          <h2>${data.jurisdictionName.toUpperCase()}</h2>
          <p>${officeName}</p>
        </div>

        ${
          config.includeSessionExcerpt && config.sessionDetails
            ? `
          <div class="session-excerpt">
            <p>EXCERPT FROM THE MINUTES OF THE ${config.sessionDetails.sessionType} SESSION OF THE ${legislativeBody} HELD AT ${config.sessionDetails.sessionVenue.toUpperCase()} ON ${config.sessionDetails.sessionDate}.</p>
            <p><strong>PRESENT:</strong> ${config.sessionDetails.presentMembers.join(', ')}</p>
            ${config.sessionDetails.absentMembers.length > 0 ? `<p><strong>ABSENT:</strong> ${config.sessionDetails.absentMembers.join(', ')}</p>` : ''}
          </div>
        `
            : ''
        }

        <div class="title-block">
          <h3>${data.enactmentNumber ? `${data.documentType.toUpperCase()} NO. ${data.enactmentNumber}` : `${data.documentType.toUpperCase()} NO. 2026-___`}</h3>
          <h1>${data.title.toUpperCase()}</h1>
        </div>

        ${parsed.whereAsClauses.map((clause) => `<div class="whereas">${clause}</div>`).join('')}

        <div class="enacting-clause">${parsed.enactingClause || enactingClauseBody}</div>

        ${
          parsed.sections.length > 0
            ? parsed.sections
                .map(
                  (sec) => `
                <div class="section">
                  <span class="section-heading">${sec.heading}. — </span>
                  <span>${sec.body}</span>
                </div>
              `,
                )
                .join('')
            : `<div class="section">${data.body}</div>`
        }

        ${
          config.includeSignatures
            ? `
          <div class="signature-block">
            <p><em>I HEREBY CERTIFY to the correctness of the foregoing Ordinance.</em></p>
            <div class="sig-line">
              <div class="sig-name">${config.signatories.secretaryName.toUpperCase()}</div>
              <div>${config.signatories.secretaryTitle}</div>
            </div>

            <p style="margin-top: 20px;"><strong>ATTESTED AND CERTIFIED TO BE DULY ADOPTED:</strong></p>
            <div class="sig-line">
              <div class="sig-name">${config.signatories.presidingOfficerName.toUpperCase()}</div>
              <div>${config.signatories.presidingOfficerTitle}</div>
            </div>

            <p style="margin-top: 20px;"><strong>APPROVED: ${config.signatories.approvalDate || '____________________'}</strong></p>
            <div class="sig-line">
              <div class="sig-name">${config.signatories.chiefExecutiveName.toUpperCase()}</div>
              <div>${config.signatories.chiefExecutiveTitle}</div>
            </div>
          </div>
        `
            : ''
        }

        ${
          config.includeQrVerification && data.verificationHash
            ? `
          <div class="security-footer">
            Document Verification Hash: <strong>${data.verificationHash}</strong> | Verified via LexiGov AI Platform
          </div>
        `
            : ''
        }
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
