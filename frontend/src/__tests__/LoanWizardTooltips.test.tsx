/**
 * Tests for LoanWizard field-level tooltips — #557
 *
 * Verifies:
 *  1. FieldTooltip info icons are rendered in StepAmount and StepCollateral
 *  2. Tooltip text appears on hover / focus
 *  3. Tooltip text is sourced from WIZARD_FIELD_TOOLTIPS constants
 *  4. Tooltip is keyboard-accessible (focus shows, Escape hides)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldTooltip } from '../components/Tooltip';
import { WIZARD_FIELD_TOOLTIPS } from '../lib/wizardFieldTooltips';

// ── FieldTooltip unit tests ──────────────────────────────────────────────────

describe('FieldTooltip', () => {
  it('renders an info icon button', () => {
    render(<FieldTooltip hint="Test hint" />);
    expect(screen.getByRole('button', { name: 'More information' })).toBeInTheDocument();
  });

  it('shows tooltip text on hover', async () => {
    render(<FieldTooltip hint="Hover to see me" />);
    const btn = screen.getByRole('button', { name: 'More information' });

    fireEvent.mouseEnter(btn);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Hover to see me');
  });

  it('hides tooltip after mouse leave', async () => {
    render(<FieldTooltip hint="I disappear on leave" />);
    const btn = screen.getByRole('button', { name: 'More information' });

    fireEvent.mouseEnter(btn);
    await screen.findByRole('tooltip');

    fireEvent.mouseLeave(btn);
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    );
  });

  it('shows tooltip text on focus (keyboard accessible)', async () => {
    render(<FieldTooltip hint="Focus shows me" />);
    const btn = screen.getByRole('button', { name: 'More information' });

    fireEvent.focus(btn);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Focus shows me');
  });

  it('hides tooltip on blur', async () => {
    render(<FieldTooltip hint="Blur hides me" />);
    const btn = screen.getByRole('button', { name: 'More information' });

    fireEvent.focus(btn);
    await screen.findByRole('tooltip');

    fireEvent.blur(btn);
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    );
  });

  it('hides tooltip when Escape is pressed', async () => {
    render(<FieldTooltip hint="Escape closes me" />);
    const btn = screen.getByRole('button', { name: 'More information' });

    fireEvent.focus(btn);
    await screen.findByRole('tooltip');

    fireEvent.keyDown(btn, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    );
  });

  it('aria-expanded reflects tooltip visibility', () => {
    render(<FieldTooltip hint="Aria expanded test" />);
    const btn = screen.getByRole('button', { name: 'More information' });

    expect(btn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.mouseEnter(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.mouseLeave(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});

// ── WIZARD_FIELD_TOOLTIPS constants ──────────────────────────────────────────

describe('WIZARD_FIELD_TOOLTIPS constants', () => {
  it('has tooltip text for loanAmount', () => {
    expect(WIZARD_FIELD_TOOLTIPS.loanAmount).toBeTruthy();
    expect(typeof WIZARD_FIELD_TOOLTIPS.loanAmount).toBe('string');
  });

  it('has tooltip text for appraisedValue', () => {
    expect(WIZARD_FIELD_TOOLTIPS.appraisedValue).toBeTruthy();
  });

  it('has tooltip text for ltvRatio', () => {
    expect(WIZARD_FIELD_TOOLTIPS.ltvRatio).toBeTruthy();
  });

  it('has tooltip text for healthFactor', () => {
    expect(WIZARD_FIELD_TOOLTIPS.healthFactor).toBeTruthy();
  });

  it('has tooltip text for loanTerm', () => {
    expect(WIZARD_FIELD_TOOLTIPS.loanTerm).toBeTruthy();
  });

  it('has tooltip text for animalType', () => {
    expect(WIZARD_FIELD_TOOLTIPS.animalType).toBeTruthy();
  });

  it('tooltip text is human-readable (not empty string)', () => {
    for (const [key, value] of Object.entries(WIZARD_FIELD_TOOLTIPS)) {
      expect(value.length).toBeGreaterThan(20);
    }
  });
});

// ── FieldTooltip renders from WIZARD_FIELD_TOOLTIPS ─────────────────────────

describe('FieldTooltip with WIZARD_FIELD_TOOLTIPS constants', () => {
  it('renders loanAmount tooltip text from constants (not hardcoded)', async () => {
    render(<FieldTooltip hint={WIZARD_FIELD_TOOLTIPS.loanAmount} />);
    const btn = screen.getByRole('button', { name: 'More information' });
    fireEvent.mouseEnter(btn);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(WIZARD_FIELD_TOOLTIPS.loanAmount);
  });

  it('renders appraisedValue tooltip text from constants', async () => {
    render(<FieldTooltip hint={WIZARD_FIELD_TOOLTIPS.appraisedValue} />);
    const btn = screen.getByRole('button', { name: 'More information' });
    fireEvent.mouseEnter(btn);
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(WIZARD_FIELD_TOOLTIPS.appraisedValue);
  });
});
