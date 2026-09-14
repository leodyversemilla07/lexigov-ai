import { createMockMilestones } from '@lexigov/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LegislativeTrackerPanel } from './legislative-tracker-panel';

describe('LegislativeTrackerPanel (Colocated Unit Test)', () => {
  it('renders step indicator and current stage badge', () => {
    const milestones = createMockMilestones({
      currentStage: 'FIRST_READING',
    });

    render(<LegislativeTrackerPanel jurisdiction='city' milestones={milestones} onUpdateMilestones={vi.fn()} />);

    expect(screen.getByText('Sanggunian Milestone Tracker')).toBeInTheDocument();
    expect(screen.getByText('Advisory record')).toBeInTheDocument();
    expect(screen.getByText(/Milestone 2/)).toBeInTheDocument();
  });

  it('disables workflow controls for read-only access and omits unsupported lapse actions', () => {
    const milestones = createMockMilestones({
      currentStage: 'TRANSMITTED_TO_LCE',
      transmittedDate: '2026-01-01',
    });

    render(
      <LegislativeTrackerPanel
        jurisdiction='city'
        milestones={milestones}
        onUpdateMilestones={vi.fn()}
        readOnly
      />,
    );

    expect(screen.getByTestId('legislative.tracker.stage-select')).toBeDisabled();
    expect(screen.queryByText(/Lapsed into Law/i)).not.toBeInTheDocument();
  });

  it('synchronizes its stage when refreshed milestone props arrive', () => {
    const { rerender } = render(
      <LegislativeTrackerPanel
        jurisdiction='city'
        milestones={createMockMilestones({ currentStage: 'DRAFTING' })}
        onUpdateMilestones={vi.fn()}
      />,
    );

    rerender(
      <LegislativeTrackerPanel
        jurisdiction='city'
        milestones={createMockMilestones({ currentStage: 'FIRST_READING' })}
        onUpdateMilestones={vi.fn()}
      />,
    );

    expect(screen.getByText(/Milestone 2/)).toBeInTheDocument();
  });

  it('renders active workspace role badge', () => {
    const milestones = createMockMilestones();

    render(
      <LegislativeTrackerPanel
        jurisdiction='city'
        milestones={milestones}
        currentUserRole='PRESIDING_OFFICER'
        onUpdateMilestones={vi.fn()}
      />,
    );

    const roleBadge = screen.getByTestId('legislative.tracker.active-role');
    expect(roleBadge).toHaveTextContent(/Presiding Officer/i);
  });

  it('uses the barangay signature path without displaying a mayor/governor deadline', () => {
    render(
      <LegislativeTrackerPanel
        jurisdiction='barangay'
        documentType='ORDINANCE'
        milestones={createMockMilestones({ currentStage: 'AWAITING_PUNONG_BARANGAY_SIGNATURE' })}
        onUpdateMilestones={vi.fn()}
      />,
    );

    expect(screen.getByText('Punong Barangay signature record')).toBeInTheDocument();
    expect(screen.queryByText(/Indicative 10\/15-day date/i)).not.toBeInTheDocument();
  });

  it('shows the veto outcome and separately recorded override evidence', () => {
    render(
      <LegislativeTrackerPanel
        jurisdiction='city'
        documentType='ORDINANCE'
        milestones={createMockMilestones({
          currentStage: 'VETOED',
          lceAction: 'VETOED',
          lceActionDate: '2026-08-05',
          vetoMessageReference: 'VETO-2026-01',
        })}
        onUpdateMilestones={vi.fn()}
      />,
    );

    expect(screen.getByTestId('legislative.tracker.stage-badge')).toHaveTextContent('VETOED');
    expect(screen.getByText('Recorded veto-override vote')).toBeInTheDocument();
  });
});
