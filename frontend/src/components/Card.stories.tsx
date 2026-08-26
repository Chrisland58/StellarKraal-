import type { Meta, StoryObj } from "@storybook/react";
import Card from "./Card";

/**
 * `Card` is the unified container for all list items across the StellarKraal
 * dashboard. It standardises padding, border radius, shadow, and slot styling
 * so every data surface looks consistent in both light and dark mode.
 *
 * ---
 *
 * **Named slots**
 * | Prop       | Type        | Description                                    |
 * |------------|-------------|------------------------------------------------|
 * | `header`   | `ReactNode` | Legacy top row, rendered above a divider       |
 * | `title`    | `string`    | Primary label; first line of the body row      |
 * | `subtitle` | `string`    | Secondary label below `title`                  |
 * | `badge`    | `ReactNode` | Inline chip/tag next to `title`                |
 * | `action`   | `ReactNode` | Controls pinned right of the title row         |
 * | `children` | `ReactNode` | Body content (always rendered)                 |
 * | `footer`   | `ReactNode` | Bottom row below a divider, slightly tinted    |
 *
 * **Variants**
 * - `default`     — standard surface for most data
 * - `highlighted` — gold-tinted, for featured/primary metrics
 * - `warning`     — amber-tinted, for risk indicators
 *
 * **Interaction states**
 * - `selected`  — ring + subtle fill
 * - `disabled`  — muted, non-interactive
 * - `onSelect`  — makes the card keyboard-navigable (`role="button"`)
 */
const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "highlighted", "warning"],
    },
    selected: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── Body only ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    children: "Standard card body — used for most data surfaces.",
  },
};

export const Highlighted: Story = {
  args: {
    variant: "highlighted",
    children: "Highlighted card — for featured or primary metrics.",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning card — for risk indicators like liquidation risk.",
  },
};

// ── Title + subtitle ──────────────────────────────────────────────────────────

export const WithTitleAndSubtitle: Story = {
  args: {
    title: "Loan #42",
    subtitle: "GDKK…W3RJ (borrower)",
    children: "Body content below the title row.",
  },
};

// ── Badge slot ────────────────────────────────────────────────────────────────

export const WithBadge: Story = {
  args: {
    title: "Loan #42",
    subtitle: "GDKK…W3RJ",
    badge: (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success-light text-success-dark">
        active
      </span>
    ),
    children: "Loan amount: 1,250 XLM",
  },
};

// ── Action slot ───────────────────────────────────────────────────────────────

export const WithAction: Story = {
  args: {
    title: "Loan #42",
    subtitle: "GDKK…W3RJ",
    action: (
      <button className="text-xs font-medium text-gold-600 hover:underline">
        Repay
      </button>
    ),
    children: "Loan amount: 1,250 XLM",
  },
};

// ── Full slot combination ─────────────────────────────────────────────────────

export const AllSlots: Story = {
  args: {
    title: "Loan #42",
    subtitle: "Borrowed against 3 cattle • GDKK…W3RJ",
    badge: (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success-light text-success-dark">
        active
      </span>
    ),
    action: (
      <button className="text-xs font-medium text-gold-600 hover:underline">
        Repay
      </button>
    ),
    children: (
      <div className="space-y-1">
        <p className="text-brown-700 dark:text-cream-100 font-semibold">
          1,250.00 XLM
        </p>
        <p className="text-sm text-brown-500 dark:text-brown-300">
          Health factor: 2.4
        </p>
      </div>
    ),
    footer: (
      <p className="text-xs text-brown-500 dark:text-brown-400 font-mono">
        ID: 8f3a91c2…
      </p>
    ),
  },
};

/** Legacy `header` + `footer` API remains fully supported. */
export const WithHeaderAndFooter: Story = {
  args: {
    header: <h2 className="text-xl font-semibold text-brown-700">Loan #42</h2>,
    children: (
      <div className="space-y-1">
        <p className="text-brown-700 font-semibold">1,250.00 XLM</p>
        <p className="text-sm text-brown-500">Borrowed against 3 cattle</p>
      </div>
    ),
    footer: <p className="text-xs text-brown-500 font-mono">ID: 8f3a91c2…</p>,
  },
};

// ── Interaction states ────────────────────────────────────────────────────────

export const Selected: Story = {
  args: {
    title: "Selected Card",
    subtitle: "Click or press Enter/Space to toggle",
    children: "This card has the selected state applied.",
    selected: true,
    onSelect: () => alert("Card selected!"),
  },
};

export const Disabled: Story = {
  args: {
    title: "Disabled Card",
    subtitle: "This card cannot be interacted with",
    children: "Pointer events and keyboard interaction are suppressed.",
    disabled: true,
    onSelect: () => alert("Should never fire"),
  },
};

export const Interactive: Story = {
  args: {
    title: "Interactive Card",
    subtitle: "Keyboard-navigable via Tab / Enter / Space",
    children:
      "When `onSelect` is provided the card receives role=button and a focus ring.",
    onSelect: () => alert("Card activated!"),
  },
};

// ── All variants side by side ─────────────────────────────────────────────────

/** Quick visual comparison of all three variants. */
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card
        title="Default"
        subtitle="Standard data surface"
        badge={
          <span className="text-xs px-2 py-0.5 rounded-full bg-brown-100 text-brown-600">
            tag
          </span>
        }
      >
        Body content.
      </Card>
      <Card
        variant="highlighted"
        title="Highlighted"
        subtitle="Featured / primary metric"
      >
        Body content.
      </Card>
      <Card
        variant="warning"
        title="Warning"
        subtitle="Risk indicator"
        badge={
          <span className="text-xs px-2 py-0.5 rounded-full bg-error-light text-error-dark">
            at risk
          </span>
        }
      >
        Body content.
      </Card>
    </div>
  ),
};

/**
 * Dark mode — Tailwind uses `darkMode: "class"`, so wrapping in `.dark`
 * activates every dark variant the Card defines.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-brown-900 p-6 rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Default"
          subtitle="Standard data surface"
          badge={
            <span className="text-xs px-2 py-0.5 rounded-full bg-brown-700 text-cream-50">
              tag
            </span>
          }
        >
          <span className="text-cream-50">Body content.</span>
        </Card>
        <Card
          variant="highlighted"
          title="Highlighted"
          subtitle="Featured / primary metric"
        >
          <span className="text-cream-50">Body content.</span>
        </Card>
        <Card
          variant="warning"
          title="Warning"
          subtitle="Risk indicator"
        >
          <span className="text-cream-50">Body content.</span>
        </Card>
      </div>
    </div>
  ),
};

/** All three interaction states side by side. */
export const InteractionStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card
        title="Normal"
        subtitle="Hover to see lift effect"
        onSelect={() => {}}
      >
        Click or press Enter.
      </Card>
      <Card
        title="Selected"
        subtitle="Gold ring applied"
        selected
        onSelect={() => {}}
      >
        Currently selected.
      </Card>
      <Card
        title="Disabled"
        subtitle="Non-interactive"
        disabled
        onSelect={() => {}}
      >
        Pointer events off.
      </Card>
    </div>
  ),
};
