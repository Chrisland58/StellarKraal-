import type { Meta, StoryObj } from '@storybook/react';
import { Input, Textarea, Select, Checkbox, RadioGroup } from './ui/FormField';

/**
 * `FormField` exports a family of accessible, consistently styled form controls:
 *
 * - **Input** — single-line text input
 * - **Textarea** — multi-line text input
 * - **Select** — dropdown selector
 * - **Checkbox** — single boolean toggle
 * - **RadioGroup** — mutually-exclusive option set
 *
 * All controls:
 * - Auto-generate IDs via `useId()` for reliable label association
 * - Render `role="alert"` error messages linked via `aria-describedby`
 * - Set `aria-invalid` when an error is present
 * - Apply consistent Tailwind tokens matching the StellarKraal design system
 */

// ── Input ────────────────────────────────────────────────────────────────────

const inputMeta: Meta<typeof Input> = {
  title: 'UI/FormField/Input',
  component: Input,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};
export default inputMeta;
type InputStory = StoryObj<typeof Input>;

/** Default text input with a label. */
export const Default: InputStory = {
  args: {
    label: 'Loan Amount (XLM)',
    placeholder: '0.00',
  },
};

/** Required field — displays a `*` indicator next to the label. */
export const Required: InputStory = {
  args: {
    label: 'Borrower Address',
    placeholder: 'G…',
    required: true,
  },
};

/** Disabled state — visually dimmed with `cursor-not-allowed`. */
export const Disabled: InputStory = {
  args: {
    label: 'Wallet Address',
    value: 'GBMOCKWALLETADDRESS',
    disabled: true,
  },
};

/** Error state — red border, `aria-invalid`, and an `aria-describedby` error message. */
export const WithError: InputStory = {
  args: {
    label: 'Loan Amount (XLM)',
    placeholder: '0.00',
    value: '-50',
    error: 'Amount must be a positive number.',
  },
};

// ── Textarea ─────────────────────────────────────────────────────────────────

import type { StoryObj as SO } from '@storybook/react';

export const TextareaDefault: SO<typeof Textarea> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Textarea label="Notes" placeholder="Add any additional notes about this loan…" />
    </div>
  ),
};
TextareaDefault.storyName = 'Textarea — Default';

export const TextareaDisabled: SO<typeof Textarea> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Textarea label="Notes" value="Read-only note." disabled />
    </div>
  ),
};
TextareaDisabled.storyName = 'Textarea — Disabled';

export const TextareaWithError: SO<typeof Textarea> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Textarea label="Notes" value="x" error="Note must be at least 10 characters." />
    </div>
  ),
};
TextareaWithError.storyName = 'Textarea — Error';

// ── Select ───────────────────────────────────────────────────────────────────

export const SelectDefault: SO<typeof Select> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Select label="Loan Status">
        <option value="">Select a status…</option>
        <option value="active">Active</option>
        <option value="repaid">Repaid</option>
        <option value="liquidated">Liquidated</option>
      </Select>
    </div>
  ),
};
SelectDefault.storyName = 'Select — Default';

export const SelectDisabled: SO<typeof Select> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Select label="Loan Status" disabled>
        <option value="active">Active</option>
      </Select>
    </div>
  ),
};
SelectDisabled.storyName = 'Select — Disabled';

export const SelectWithError: SO<typeof Select> = {
  render: () => (
    <div style={{ maxWidth: 400 }}>
      <Select label="Loan Status" error="Please select a status.">
        <option value="">Select a status…</option>
        <option value="active">Active</option>
      </Select>
    </div>
  ),
};
SelectWithError.storyName = 'Select — Error';

// ── Checkbox ─────────────────────────────────────────────────────────────────

export const CheckboxDefault: SO<typeof Checkbox> = {
  render: () => <Checkbox label="I agree to the loan terms and conditions" />,
};
CheckboxDefault.storyName = 'Checkbox — Default';

export const CheckboxChecked: SO<typeof Checkbox> = {
  render: () => <Checkbox label="I agree to the loan terms and conditions" defaultChecked />,
};
CheckboxChecked.storyName = 'Checkbox — Checked';

export const CheckboxDisabled: SO<typeof Checkbox> = {
  render: () => <Checkbox label="I agree to the loan terms and conditions" disabled />,
};
CheckboxDisabled.storyName = 'Checkbox — Disabled';

export const CheckboxWithError: SO<typeof Checkbox> = {
  render: () => (
    <Checkbox label="I agree to the loan terms" error="You must accept the terms to continue." />
  ),
};
CheckboxWithError.storyName = 'Checkbox — Error';

// ── RadioGroup ───────────────────────────────────────────────────────────────

const COLLATERAL_OPTIONS = [
  { value: 'cattle', label: 'Cattle' },
  { value: 'goats', label: 'Goats' },
  { value: 'sheep', label: 'Sheep' },
];

export const RadioGroupDefault: SO<typeof RadioGroup> = {
  render: () => (
    <RadioGroup
      name="collateral-type"
      label="Collateral Type"
      options={COLLATERAL_OPTIONS}
      value="cattle"
    />
  ),
};
RadioGroupDefault.storyName = 'RadioGroup — Default';

export const RadioGroupDisabled: SO<typeof RadioGroup> = {
  render: () => (
    <RadioGroup
      name="collateral-type-disabled"
      label="Collateral Type"
      options={COLLATERAL_OPTIONS}
      value="goats"
      disabled
    />
  ),
};
RadioGroupDisabled.storyName = 'RadioGroup — Disabled';

export const RadioGroupWithError: SO<typeof RadioGroup> = {
  render: () => (
    <RadioGroup
      name="collateral-type-error"
      label="Collateral Type"
      options={COLLATERAL_OPTIONS}
      error="Please select a collateral type."
    />
  ),
};
RadioGroupWithError.storyName = 'RadioGroup — Error';
