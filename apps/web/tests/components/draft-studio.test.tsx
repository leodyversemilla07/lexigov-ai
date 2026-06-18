import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DraftStudio } from '@/app/(protected)/drafts/[id]/_components/draft-studio';

const defaultProps = {
  content: '',
  wordCount: 0,
  sectionOutline: [],
  selectedSectionId: '',
  onContentChange: vi.fn(),
  onSectionSelect: vi.fn(),
  onAddSection: vi.fn(),
};

afterEach(cleanup);

describe('DraftStudio', () => {
  it('renders the studio title and description', () => {
    render(<DraftStudio {...defaultProps} />);
    expect(screen.getByText('Draft studio')).toBeInTheDocument();
    expect(screen.getByText(/full-text editor/i)).toBeInTheDocument();
  });

  it('renders the textarea and updates content on change', () => {
    const onContentChange = vi.fn();
    render(<DraftStudio {...defaultProps} onContentChange={onContentChange} />);
    const textarea = screen.getByLabelText('Draft content');
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'SECTION 1. Title.' } });
    expect(onContentChange).toHaveBeenCalledWith('SECTION 1. Title.');
  });

  it('displays the word count badge', () => {
    render(<DraftStudio {...defaultProps} wordCount={142} />);
    expect(screen.getByText('142 words')).toBeInTheDocument();
  });

  it('shows empty outline state when no sections', () => {
    render(<DraftStudio {...defaultProps} />);
    expect(screen.getByText(/Add headings like/i)).toBeInTheDocument();
  });

  it('renders the Add button in the outline panel', () => {
    const onAddSection = vi.fn();
    render(<DraftStudio {...defaultProps} onAddSection={onAddSection} />);
    const addButton = screen.getByRole('button', { name: /^Add$/ });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(onAddSection).toHaveBeenCalledOnce();
  });

  it('renders section outline when sections are provided', () => {
    const sectionOutline = [
      { id: '1', heading: 'SECTION 1. Title.', body: 'Content here.', level: 1 },
      { id: '2', heading: 'SECTION 2. Another.', body: 'More content.', level: 1 },
    ];

    render(
      <DraftStudio
        {...defaultProps}
        sectionOutline={sectionOutline}
        selectedSectionId="1"
      />,
    );

    expect(screen.getByText('SECTION 1. Title.')).toBeInTheDocument();
    expect(screen.getByText('SECTION 2. Another.')).toBeInTheDocument();
  });

  it('calls onSectionSelect when a section is clicked', () => {
    const onSectionSelect = vi.fn();
    const sectionOutline = [
      { id: 's1', heading: 'SECTION 1. Title.', body: '', level: 1 },
    ];

    render(
      <DraftStudio
        {...defaultProps}
        sectionOutline={sectionOutline}
        onSectionSelect={onSectionSelect}
      />,
    );

    const sectionButton = screen.getByRole('button', { name: /SECTION 1. Title/ });
    fireEvent.click(sectionButton);
    expect(onSectionSelect).toHaveBeenCalledWith('s1');
  });
});
