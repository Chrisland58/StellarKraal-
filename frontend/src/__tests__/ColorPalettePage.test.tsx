/**
 * Tests for ColorPalettePage (#784)
 * - All design tokens render
 * - Copy-to-clipboard button is keyboard accessible
 * - Contrast section is present
 * - Screen-reader roles/labels are present
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ColorPalettePage from '@/app/docs/colors/page';

// Mock clipboard API
const writeTextMock = jest.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: { writeText: writeTextMock },
});

describe('ColorPalettePage', () => {
  beforeEach(() => {
    writeTextMock.mockClear();
  });

  it('renders the page heading', () => {
    render(<ColorPalettePage />);
    expect(screen.getByRole('heading', { name: /color palette/i, level: 1 })).toBeInTheDocument();
  });

  it('renders all token group headings', () => {
    render(<ColorPalettePage />);
    const groups = ['Primary', 'Secondary', 'Accent', 'Danger', 'Success', 'Warning', 'Surface', 'Text', 'Border'];
    groups.forEach((group) => {
      expect(screen.getByRole('heading', { name: group, level: 2 })).toBeInTheDocument();
    });
  });

  it('renders token name labels', () => {
    render(<ColorPalettePage />);
    expect(screen.getByText('color-primary')).toBeInTheDocument();
    expect(screen.getByText('color-text')).toBeInTheDocument();
    expect(screen.getByText('color-border')).toBeInTheDocument();
  });

  it('renders contrast ratios section', () => {
    render(<ColorPalettePage />);
    expect(screen.getByRole('heading', { name: /contrast ratios/i, level: 2 })).toBeInTheDocument();
  });

  it('renders copy buttons for each CSS variable', () => {
    render(<ColorPalettePage />);
    const copyButtons = screen.getAllByRole('button', { name: /^copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('copy button is keyboard accessible (Enter key triggers copy)', async () => {
    render(<ColorPalettePage />);
    const [firstCopyButton] = screen.getAllByRole('button', { name: /^copy/i });
    fireEvent.keyDown(firstCopyButton, { key: 'Enter' });
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it('copy button calls clipboard.writeText with the CSS variable', async () => {
    render(<ColorPalettePage />);
    const primaryCopyButton = screen.getByRole('button', { name: /copy color-primary$/i });
    fireEvent.click(primaryCopyButton);
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('--token-primary');
    });
  });

  it('copy button shows "Copied" feedback after click', async () => {
    render(<ColorPalettePage />);
    const [firstCopyButton] = screen.getAllByRole('button', { name: /^copy/i });
    fireEvent.click(firstCopyButton);
    await waitFor(() => {
      expect(screen.getAllByText('Copied').length).toBeGreaterThan(0);
    });
  });

  it('has accessible aria-label on main landmark', () => {
    render(<ColorPalettePage />);
    expect(screen.getByRole('main', { name: /color palette/i })).toBeInTheDocument();
  });

  it('token lists have accessible role and label', () => {
    render(<ColorPalettePage />);
    const lists = screen.getAllByRole('list', { name: /colour tokens/i });
    expect(lists.length).toBeGreaterThan(0);
  });

  it('usage examples are present for each token group', () => {
    render(<ColorPalettePage />);
    // spot-check a couple of usage examples
    expect(screen.getByText(/bg-color-primary/i)).toBeInTheDocument();
    expect(screen.getByText(/text-color-text/i)).toBeInTheDocument();
  });
});
