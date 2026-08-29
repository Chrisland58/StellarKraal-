/**
 * ConfirmDialog stories — #810
 *
 * Shows both the `default` and `destructive` variants side by side
 * so reviewers can verify styling before merging.
 */
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "radio",
      options: ["default", "destructive"],
      description:
        '`default` uses the secondary (gold) confirm button. `destructive` uses the danger (red) token.',
    },
    open: { control: "boolean" },
    title: { control: "text" },
    message: { control: "text" },
    confirmLabel: { control: "text" },
    cancelLabel: { control: "text" },
    destructiveAriaLabel: { control: "text" },
  },
};
export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

/* ── Default variant ── */
export const Default: Story = {
  args: {
    open: true,
    title: "Confirm action",
    message: "Are you sure you want to proceed with this action?",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
    onConfirm: () => alert("Confirmed!"),
    onCancel: () => alert("Cancelled"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Standard confirmation dialog. The confirm button uses the secondary (gold) style.",
      },
    },
  },
};

/* ── Destructive variant ── */
export const Destructive: Story = {
  args: {
    open: true,
    title: "Delete loan",
    message:
      "This will permanently delete the loan and cannot be undone. All associated collateral records will be released.",
    confirmLabel: "Delete loan",
    cancelLabel: "Cancel",
    variant: "destructive",
    destructiveAriaLabel: "Delete this loan permanently",
    onConfirm: () => alert("Deleted!"),
    onCancel: () => alert("Cancelled"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Destructive variant for irreversible actions (delete, disconnect). " +
          "The confirm button uses `var(--token-danger)` (red) to signal risk. " +
          "The `destructiveAriaLabel` prop describes the consequence for screen readers.",
      },
    },
  },
};

/* ── Disconnect variant ── */
export const DisconnectWallet: Story = {
  args: {
    open: true,
    title: "Disconnect wallet",
    message: "You will need to reconnect your Freighter wallet to perform transactions.",
    confirmLabel: "Disconnect",
    cancelLabel: "Keep connected",
    variant: "destructive",
    destructiveAriaLabel: "Disconnect Freighter wallet",
    onConfirm: () => alert("Disconnected!"),
    onCancel: () => alert("Cancelled"),
  },
};

/* ── Interactive (controlled) ── */
export const Interactive: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl bg-brown-600 px-4 py-2 text-sm text-white font-semibold"
        >
          Open dialog
        </button>
        <ConfirmDialog
          {...args}
          open={open}
          onConfirm={() => { alert("Confirmed!"); setOpen(false); }}
          onCancel={() => setOpen(false)}
        />
      </>
    );
  },
  args: {
    title: "Confirm action",
    message: "Are you sure you want to proceed?",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "default",
  },
  parameters: {
    docs: {
      description: {
        story: "Open the dialog by clicking the trigger button. Use the `variant` control to switch between default and destructive.",
      },
    },
  },
};
