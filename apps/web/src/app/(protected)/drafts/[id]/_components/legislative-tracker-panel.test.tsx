import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockMilestones } from '@lexigov/shared';
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

  it('renders 3rd reading voting section when in THIRD_READING stage', () => {
    const milestones = createMockMilestones({
      currentStage: 'THIRD_READING',
      votingRecord: { ayes: 12, nays: 0, abstentions: 1 },
    });

    render(<LegislativeTrackerPanel jurisdiction='city' milestones={milestones} onUpdateMilestones={vi.fn()} />);

    expect(screen.getByText(/3rd Reading Nominal Voting Record/i)).toBeInTheDocument();
    expect(screen.getByText('Ayes')).toBeInTheDocument();
    expect(screen.getByText('Nays')).toBeInTheDocument();
    expect(screen.getByText('Abstain')).toBeInTheDocument();
  });
});
