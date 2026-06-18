import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionListItem } from '@/app/(protected)/drafts/[id]/_components/section-list-item';

const defaultSection = {
  id: 'sec-1',
  heading: 'SECTION 1. Title.',
  body: 'This is the body content.',
  level: 1,
};

afterEach(cleanup);

describe('SectionListItem', () => {
  it('renders section heading and index', () => {
    render(
      <SectionListItem section={defaultSection} index={0} active={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('SECTION 1. Title.')).toBeInTheDocument();
  });

  it('shows word count badge for non-empty body', () => {
    render(
      <SectionListItem section={defaultSection} index={0} active={false} onSelect={vi.fn()} />,
    );
    // "This is the body content." = 5 words
    expect(screen.getByText('5w')).toBeInTheDocument();
  });

  it('shows Empty badge when body is empty', () => {
    render(
      <SectionListItem
        section={{ ...defaultSection, body: '' }}
        index={0}
        active={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('calls onSelect with section id on click', () => {
    const onSelect = vi.fn();
    render(
      <SectionListItem section={defaultSection} index={0} active={false} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /SECTION 1. Title/ }));
    expect(onSelect).toHaveBeenCalledWith('sec-1');
  });

  it('renders body preview text', () => {
    render(
      <SectionListItem section={defaultSection} index={0} active={false} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('This is the body content.')).toBeInTheDocument();
  });

  it('shows placeholder when body is empty', () => {
    render(
      <SectionListItem
        section={{ ...defaultSection, body: '' }}
        index={0}
        active={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText('No supporting body text yet.')).toBeInTheDocument();
  });

  it('has the active styling when active is true', () => {
    const { container } = render(
      <SectionListItem section={defaultSection} index={0} active={true} onSelect={vi.fn()} />,
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-primary');
  });
});
