import { buildDefaultDocumentFormatConfig, type FormattedDocumentData } from '@lexigov/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const pdfMocks = vi.hoisted(() => ({ addPage: vi.fn(), save: vi.fn(), text: vi.fn() }));

vi.mock('jspdf', () => ({
  jsPDF: class MockPdf {
    private pageCount = 1;
    internal = {
      pageSize: { getWidth: () => 600, getHeight: () => 800 },
    };
    setFont() {}
    setFontSize() {}
    setLineWidth() {}
    line() {}
    text(value: string | string[]) {
      pdfMocks.text(value);
    }
    splitTextToSize(text: string) {
      return text.match(/.{1,70}(?:\s|$)/g)?.map((line) => line.trim()) ?? [text];
    }
    addPage() {
      this.pageCount += 1;
      pdfMocks.addPage();
    }
    getNumberOfPages() {
      return this.pageCount;
    }
    setPage() {}
    save(filename: string) {
      pdfMocks.save(filename);
    }
  },
}));

import { downloadOfficialPdf } from '@/lib/export/official-document-export';

beforeEach(() => vi.clearAllMocks());

describe('working-draft PDF pagination', () => {
  it('adds pages while rendering a section that is taller than one page', () => {
    const config = buildDefaultDocumentFormatConfig('city', 'Test City');
    const data: FormattedDocumentData = {
      title: 'Long Draft',
      documentType: 'ORDINANCE',
      jurisdiction: 'city',
      jurisdictionName: 'Test City',
      body: `SECTION 1. LONG PROVISION. — ${'This provision contains draft language only. '.repeat(800)}`,
      version: 1,
    };

    downloadOfficialPdf(data, config);

    expect(pdfMocks.addPage).toHaveBeenCalled();
    expect(pdfMocks.save).toHaveBeenCalledWith('long_draft_draft.pdf');
  });

  it('retains unstructured body text when no formal sections are present', () => {
    const config = buildDefaultDocumentFormatConfig('municipal', 'Sample Municipality');
    downloadOfficialPdf(
      {
        title: 'Unstructured Draft',
        documentType: 'RESOLUTION',
        jurisdiction: 'municipal',
        jurisdictionName: 'Sample Municipality',
        body: 'Complete unstructured source text that must remain in the export.',
        version: 1,
      },
      config,
    );

    expect(pdfMocks.text).toHaveBeenCalledWith('Complete unstructured source text that must remain in the export.');
  });
});
