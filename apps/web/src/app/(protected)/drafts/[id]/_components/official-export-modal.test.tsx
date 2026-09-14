import { createMockDraft, createMockMilestones } from '@lexigov/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OfficialExportModal } from './official-export-modal';

describe('OfficialExportModal (Colocated Unit Test)', () => {
  it('renders the working-document exporter with letterhead and action buttons', () => {
    const mockDraft = createMockDraft({
      id: 'draft_pasig_001',
      title: 'Comprehensive Citizen Charter Ordinance',
      jurisdiction: 'city',
      jurisdictionName: 'City of Pasig',
      documentType: 'ORDINANCE',
    });

    const mockMilestones = createMockMilestones({
      enactmentNo: '2026-042',
    });

    render(
      <OfficialExportModal
        isOpen={true}
        onClose={vi.fn()}
        draft={mockDraft as never}
        content={'WHEREAS, public service is a public trust.\n\nSECTION 1. SHORT TITLE. — Citizen Charter.'}
        milestones={mockMilestones}
      />,
    );

    expect(screen.getByText('Government Document Draft Exporter')).toBeInTheDocument();
    expect(screen.getByText('REPUBLIC OF THE PHILIPPINES')).toBeInTheDocument();
    expect(screen.getAllByText(/CITY OF PASIG/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ORDINANCE NO. 2026-042/i)).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
    expect(screen.getByText('Export Word (.docx)')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  }, 15_000);
});
