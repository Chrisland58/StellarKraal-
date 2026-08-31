import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Modal from './ui/Modal';
import { Button } from './ui/Button';

/**
 * `Modal` renders a fully accessible dialog overlay.
 *
 * **Accessibility features**
 * - `role="dialog"` with `aria-labelledby` pointing to the title
 * - Focus is trapped inside while open; returns to the trigger on close
 * - Escape key and backdrop click both dismiss the modal
 * - Body scroll is locked while open
 *
 * **Sizes** — `sm`, `md` (default), `lg`
 *
 * Pass action buttons via the `footer` prop so they receive the correct
 * border/spacing treatment.
 */
const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Controls the max-width of the dialog panel.',
    },
    open: {
      control: 'boolean',
      description: 'Whether the modal is visible.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The default modal with a title, body, and footer action buttons. */
export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  args: {
    title: 'Confirm Loan Request',
    children: (
      <p className="text-brown-700">
        You are about to request a loan of <strong>500 XLM</strong> against your registered
        collateral. Please review the terms before proceeding.
      </p>
    ),
    footer: (
      <>
        <Button variant="ghost" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => {}}>
          Confirm
        </Button>
      </>
    ),
  },
};

/**
 * Closed state — the modal is not rendered when `open` is false.
 * Only the trigger button is shown.
 */
export const Closed: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  args: {
    title: 'Confirm Loan Request',
    children: <p className="text-brown-700">Modal content here.</p>,
  },
};

/** Small modal — for short confirmations or alerts. */
export const Small: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Small Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  args: {
    title: 'Delete Collateral',
    size: 'sm',
    children: <p className="text-brown-700">Are you sure you want to remove this collateral?</p>,
    footer: (
      <>
        <Button variant="ghost" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => {}}>
          Delete
        </Button>
      </>
    ),
  },
};

/** Large modal — for forms or multi-step content that needs more space. */
export const Large: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Large Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  args: {
    title: 'Register Collateral',
    size: 'lg',
    children: (
      <div className="space-y-4">
        <p className="text-brown-700">
          Fill in the details below to register your livestock as collateral.
        </p>
        <div className="h-48 rounded-xl bg-brown-50 flex items-center justify-center text-brown-400 text-sm">
          Form fields would appear here
        </div>
      </div>
    ),
    footer: (
      <>
        <Button variant="ghost" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => {}}>
          Register
        </Button>
      </>
    ),
  },
};

/** Modal without a footer — for read-only information dialogs. */
export const NoFooter: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Info Modal</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
  args: {
    title: 'About Health Factor',
    children: (
      <p className="text-brown-700 text-sm leading-relaxed">
        The health factor represents the ratio of your collateral value to your outstanding loan
        value. A factor above 1.5× is considered safe. Below 1.0× your position may be liquidated.
      </p>
    ),
  },
};
