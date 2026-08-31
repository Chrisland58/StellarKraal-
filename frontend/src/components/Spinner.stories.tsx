import type { Meta, StoryObj } from '@storybook/react';
import Spinner from './Spinner';

/**
 * `Spinner` is the inline loading indicator for actions already in progress —
 * button clicks, filter changes, inline lookups, etc.
 *
 * For an **initial page or data load**, use a `Skeleton` component instead.
 * See `LoadingStates.stories.tsx` for the full loading-state decision tree.
 *
 * **Colour** is inherited from the parent element via `currentColor`, so the
 * spinner automatically adapts to any button or text colour in light and dark
 * modes without extra classes.
 *
 * **Accessibility** — the SVG renders `role="status"` and `aria-label` so
 * screen readers announce the loading state without relying on visual output.
 */
const meta: Meta<typeof Spinner> = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  argTypes: {
    className: {
      control: 'text',
      description: 'Tailwind sizing classes (e.g. `h-4 w-4`, `h-8 w-8`). Defaults to `h-4 w-4`.',
    },
    label: {
      control: 'text',
      description: 'Accessible label announced by screen readers. Defaults to "Loading".',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Default spinner — 1 rem, inherits the parent colour. */
export const Default: Story = {
  args: {
    className: 'h-4 w-4',
    label: 'Loading',
  },
};

/** Medium spinner — 1.5 rem, suitable for card-level loading. */
export const Medium: Story = {
  args: {
    className: 'h-6 w-6',
    label: 'Loading',
  },
};

/** Large spinner — 2 rem, for full-section inline loading states. */
export const Large: Story = {
  args: {
    className: 'h-8 w-8',
    label: 'Loading transactions',
  },
};

/**
 * Custom accessible label — demonstrates screen-reader copy when the
 * loading context is specific (e.g. "Fetching health factor").
 */
export const CustomLabel: Story = {
  args: {
    className: 'h-6 w-6',
    label: 'Fetching health factor',
  },
};

/** Spinner inside a button — shows how it integrates with `Button` state. */
export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-brown-700">
      <Spinner className="h-4 w-4" label="Submitting" />
      <span>Submitting…</span>
    </div>
  ),
};

/** Colour inheritance — spinner adapts to the parent text colour. */
export const ColourInheritance: Story = {
  render: () => (
    <div className="flex gap-6 items-center">
      <div className="text-brown-600 flex items-center gap-1">
        <Spinner className="h-5 w-5" />
        <span className="text-sm">Brown</span>
      </div>
      <div className="text-gold-600 flex items-center gap-1">
        <Spinner className="h-5 w-5" />
        <span className="text-sm">Gold</span>
      </div>
      <div className="text-error flex items-center gap-1">
        <Spinner className="h-5 w-5" />
        <span className="text-sm">Error</span>
      </div>
      <div className="text-green-600 flex items-center gap-1">
        <Spinner className="h-5 w-5" />
        <span className="text-sm">Success</span>
      </div>
    </div>
  ),
};

/**
 * Dark mode — spinner on a dark background. Colour is still inherited from
 * the parent, so no additional configuration is needed.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-brown-900 p-6 rounded-2xl flex items-center gap-2 text-cream-50">
      <Spinner className="h-5 w-5" label="Loading" />
      <span className="text-sm">Loading…</span>
    </div>
  ),
};
