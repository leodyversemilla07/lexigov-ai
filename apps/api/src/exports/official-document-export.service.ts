import {
  type DocumentFormatConfig,
  extractWhereAsClausesAndBody,
  type FormattedDocumentData,
  inferSanggunianBodyName,
} from '@lexigov/shared';
import { Injectable } from '@nestjs/common';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { jsPDF } from 'jspdf';

@Injectable()
export class OfficialDocumentExportService {
  async generateOfficialDocx(data: FormattedDocumentData, config: DocumentFormatConfig): Promise<Buffer> {
    const { legislativeBody, officeName, enactingClauseBody } = inferSanggunianBodyName(
      data.jurisdiction,
      data.jurisdictionName,
    );
    const parsed = extractWhereAsClausesAndBody(data.body);
    const paragraphs: Paragraph[] = [];

    if (config.includeSeals) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: 'REPUBLIC OF THE PHILIPPINES', font: config.fontFamily, bold: true, size: 22 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({ text: data.jurisdictionName.toUpperCase(), font: config.fontFamily, bold: true, size: 24 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: officeName, font: config.fontFamily, bold: true, size: 20 })],
        }),
      );
    }

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
          children: [new TextRun({ text: 'PRESENT:', font: config.fontFamily, bold: true, size: 18 })],
        }),
      );

      for (const member of config.sessionDetails.presentMembers) {
        paragraphs.push(
          new Paragraph({
            indent: { left: 400 },
            spacing: { after: 40 },
            children: [new TextRun({ text: `• ${member}`, font: config.fontFamily, size: 18 })],
          }),
        );
      }

      if (config.sessionDetails.absentMembers.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [new TextRun({ text: 'ABSENT:', font: config.fontFamily, bold: true, size: 18 })],
          }),
        );
        for (const member of config.sessionDetails.absentMembers) {
          paragraphs.push(
            new Paragraph({
              indent: { left: 400 },
              spacing: { after: 40 },
              children: [new TextRun({ text: `• ${member}`, font: config.fontFamily, size: 18 })],
            }),
          );
        }
      }
    }

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
        children: [new TextRun({ text: data.title.toUpperCase(), font: config.fontFamily, bold: true, size: 24 })],
      }),
    );

    for (const clause of parsed.whereAsClauses) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          indent: { firstLine: 400 },
          children: [new TextRun({ text: clause, font: config.fontFamily, size: 22 })],
        }),
      );
    }

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

    if (parsed.sections.length > 0) {
      for (const sec of parsed.sections) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 120, after: 120 },
            children: [
              new TextRun({ text: `${sec.heading}. — `, font: config.fontFamily, bold: true, size: 22 }),
              new TextRun({ text: sec.body, font: config.fontFamily, size: 22 }),
            ],
          }),
        );
      }
    } else {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: [new TextRun({ text: data.body, font: config.fontFamily, size: 22 })],
        }),
      );
    }

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
          children: [new TextRun({ text: config.signatories.secretaryTitle, font: config.fontFamily, size: 18 })],
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
            new TextRun({ text: config.signatories.presidingOfficerTitle, font: config.fontFamily, size: 18 }),
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
          children: [new TextRun({ text: config.signatories.chiefExecutiveTitle, font: config.fontFamily, size: 18 })],
        }),
      );
    }

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

    return Packer.toBuffer(doc);
  }

  async generateOfficialPdf(data: FormattedDocumentData, config: DocumentFormatConfig): Promise<Buffer> {
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

    if (y > pageHeight - 100) {
      doc.addPage();
      y = 60;
    }
    doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'bold');
    const { enactingClauseBody } = inferSanggunianBodyName(data.jurisdiction, data.jurisdictionName);
    const enactingLines = doc.splitTextToSize(parsed.enactingClause || enactingClauseBody, contentWidth);
    doc.text(enactingLines, marginLeft, y);
    y += enactingLines.length * (config.fontSizePt * config.lineSpacing) + 12;

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

    if (config.includeQrVerification && data.verificationHash) {
      doc.setFontSize(8);
      doc.setFont(config.fontFamily === 'Arial' ? 'helvetica' : 'times', 'italic');
      doc.text(`Document Verification Hash: ${data.verificationHash}`, marginLeft, pageHeight - 30);
    }

    const buffer = doc.output('arraybuffer');
    return Buffer.from(new Uint8Array(buffer));
  }
}
