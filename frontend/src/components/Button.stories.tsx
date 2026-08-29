/**
 * Button stories — covers all states as required by #783
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './ui/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

/* ── Idle states ── */

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary Button' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary Button' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost Button' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: 'Danger Button' },
};

/* ── Loading state (#783) ── */

export const Loading: Story = {
  args: { isLoading: true, children: 'Saving…' },
  parameters: {
    docs: {
      description: {
        story:
          'When `isLoading` is true, a spinner appears and the button is disabled. ' +
          'The label text is kept in the DOM (aria-hidden) to prevent layout shift.',
      },
    },
  },
};

export const LoadingSecondary: Story = {
  args: { isLoading: true, variant: 'secondary', children: 'Processing…' },
};

export const LoadingFullWidth: Story = {
  args: { isLoading: true, fullWidth: true, children: 'Submitting form…' },
};

/* ── Disabled state (#783) ── */

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled buttons apply opacity-50, cursor-not-allowed, and aria-disabled.',
      },
    },
  },
};

export const DisabledGhost: Story = {
  args: { disabled: true, variant: 'ghost', children: 'Disabled Ghost' },
};

/* ── Other states ── */

export const StateSuccess: Story = {
  args: { state: 'success', children: 'Saved!' },
};

export const StateError: Story = {
  args: { state: 'error', children: 'Failed' },
};

/* ── Size variants ── */

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Full Width' },
};
