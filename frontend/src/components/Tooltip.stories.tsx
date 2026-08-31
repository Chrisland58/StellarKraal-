import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from './Tooltip';
import { Button } from './ui/Button';

/**
 * `Tooltip` wraps any child element and reveals a concise hint on hover.
 *
 * It is primarily used to surface keyboard-shortcut labels (e.g. `B` for
 * the Borrow page link in the Navbar), but can carry any short string.
 *
 * **Accessibility**
 * - The hint element carries `role="tooltip"` so assistive technologies can
 *   associate it with the trigger.
 * - The tooltip itself is `pointer-events-none` and purely visual; it should
 *   always supplement — not replace — a descriptive accessible name on the
 *   wrapped element.
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  argTypes: {
    hint: {
      control: 'text',
      description: 'The short text shown in the tooltip on hover.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Default tooltip wrapping a button — hover to reveal the hint. */
export const Default: Story = {
  args: {
    hint: 'B',
    children: <Button>Borrow</Button>,
  },
};

/** Tooltip with a longer hint text — e.g. a keyboard shortcut description. */
export const LongHint: Story = {
  args: {
    hint: 'Press B to navigate to Borrow',
    children: <Button variant="secondary">Borrow</Button>,
  },
};

/** Tooltip wrapping a ghost button — verifies contrast on lighter backgrounds. */
export const OnGhostButton: Story = {
  args: {
    hint: 'R',
    children: <Button variant="ghost">Repay</Button>,
  },
};

/** Tooltip wrapping a navigation-style link element. */
export const OnLink: Story = {
  render: () => (
    <Tooltip hint="Go to Dashboard">
      <a href="#" className="text-brown-600 underline hover:text-brown-800">
        Dashboard
      </a>
    </Tooltip>
  ),
};

/** Multiple tooltips in context — as they appear in the Navbar. */
export const NavigationRow: Story = {
  render: () => (
    <nav className="flex gap-4 items-center">
      <Tooltip hint="D">
        <Button variant="ghost" size="sm">
          Dashboard
        </Button>
      </Tooltip>
      <Tooltip hint="L">
        <Button variant="ghost" size="sm">
          Loans
        </Button>
      </Tooltip>
      <Tooltip hint="B">
        <Button variant="ghost" size="sm">
          Borrow
        </Button>
      </Tooltip>
      <Tooltip hint="C">
        <Button variant="ghost" size="sm">
          Collateral
        </Button>
      </Tooltip>
    </nav>
  ),
};
