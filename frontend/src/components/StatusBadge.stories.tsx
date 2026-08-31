import type { Meta, StoryObj } from '@storybook/react';
import StatusBadge from './StatusBadge';
import type { BadgeStatus } from './StatusBadge';

/**
 * StatusBadge — #539
 *
 * Displays a coloured badge for loan and collateral statuses. All colours
 * are sourced from the design-token CSS custom properties so they flip
 * automatically between light and dark modes.
 */
const meta: Meta<typeof StatusBadge> = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'repaid', 'defaulted', 'liquidated', 'available', 'pledged'],
      description: 'The loan or collateral status to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

// ── Individual status stories ──────────────────────────────────────────────

export const Active: Story = {
  args: { status: 'active' },
};

export const Repaid: Story = {
  args: { status: 'repaid' },
};

export const Defaulted: Story = {
  args: { status: 'defaulted' },
};

export const Liquidated: Story = {
  args: { status: 'liquidated' },
};

export const Available: Story = {
  args: { status: 'available' },
};

export const Pledged: Story = {
  args: { status: 'pledged' },
};

export const Unknown: Story = {
  args: { status: 'unknown-state' },
  name: 'Unknown / fallback',
};

// ── All states at once ─────────────────────────────────────────────────────

const ALL_STATUSES: BadgeStatus[] = [
  'active',
  'repaid',
  'defaulted',
  'liquidated',
  'available',
  'pledged',
];

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-4">
      {ALL_STATUSES.map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  ),
  name: 'All states',
};
