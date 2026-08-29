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

    expect(screen.getByText('Sanggunian Legislative Tracker')).toBeInTheDocument();
    expect(screen.getByText('RA 7160 § 54')).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 7/)).toBeInTheDocument();
  });

  it('renders active statutory role badge', () => {
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
});
