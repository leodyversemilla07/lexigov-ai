import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockDraft } from '@lexigov/shared';
import { WorkflowPanel } from './workflow-panel';

describe('WorkflowPanel (Colocated Unit Test)', () => {
  it('renders the draft status badge and jurisdiction information', () => {
    const mockDraft = createMockDraft({
      status: 'FIRST_READING',
      jurisdiction: 'city',
      jurisdictionName: 'City of Pasig',
    });

    render(
      <WorkflowPanel
        draft={mockDraft as unknown as import('./types').Draft}
        status='FIRST_READING'
        onStatusChange={vi.fn()}
      />,
    );

    const badge = screen.getByTestId('workflow.panel.status-badge');
    expect(badge).toHaveTextContent('FIRST_READING');

    const jurisdiction = screen.getByTestId('workflow.panel.jurisdiction');
    expect(jurisdiction).toHaveTextContent('city');

    const office = screen.getByTestId('workflow.panel.office');
    expect(office).toHaveTextContent('City of Pasig');
  });

  it('renders side panel title and description', () => {
    const mockDraft = createMockDraft();

    render(
      <WorkflowPanel draft={mockDraft as unknown as import('./types').Draft} status='DRAFT' onStatusChange={vi.fn()} />,
    );

    expect(screen.getByText('Workflow')).toBeInTheDocument();
    expect(screen.getByText('Keep the draft status and context accurate before review.')).toBeInTheDocument();
  });
});
