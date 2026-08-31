import type { Meta, StoryObj } from "@storybook/react";
import CollateralStatusCard from "./CollateralStatusCard";

const meta: Meta<typeof CollateralStatusCard> = {
  title: "Components/CollateralStatusCard",
  component: CollateralStatusCard,
  parameters: { layout: "padded" },
  argTypes: {
    status: {
      control: "select",
      options: ["available", "pledged", "liquidated"],
    },
    animalType: {
      control: "select",
      options: ["cattle", "goat", "sheep"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── Individual status states ─────────────────────────────────────────────────

export const Available: Story = {
  args: {
    id: "col-001",
    animalType: "cattle",
    count: 5,
    appraisedValue: 50_000_000_000, // 5,000 XLM
    status: "available",
  },
};

export const Pledged: Story = {
  args: {
    id: "col-002",
    animalType: "goat",
    count: 12,
    appraisedValue: 24_000_000_000, // 2,400 XLM
    status: "pledged",
  },
};

export const Liquidated: Story = {
  args: {
    id: "col-003",
    animalType: "sheep",
    count: 8,
    appraisedValue: 16_000_000_000, // 1,600 XLM
    status: "liquidated",
  },
};

// ── With photo ───────────────────────────────────────────────────────────────

export const WithPhoto: Story = {
  args: {
    id: "col-004",
    animalType: "cattle",
    count: 3,
    appraisedValue: 30_000_000_000,
    status: "available",
    photoUrl: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=640&q=80",
  },
};

// ── Responsive grid ──────────────────────────────────────────────────────────

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <CollateralStatusCard
        id="col-g-01"
        animalType="cattle"
        count={5}
        appraisedValue={50_000_000_000}
        status="available"
        onClick={() => alert("Clicked cattle")}
      />
      <CollateralStatusCard
        id="col-g-02"
        animalType="goat"
        count={12}
        appraisedValue={24_000_000_000}
        status="pledged"
      />
      <CollateralStatusCard
        id="col-g-03"
        animalType="sheep"
        count={8}
        appraisedValue={16_000_000_000}
        status="liquidated"
      />
    </div>
  ),
};

// ── Clickable card ───────────────────────────────────────────────────────────

export const Clickable: Story = {
  args: {
    id: "col-005",
    animalType: "cattle",
    count: 2,
    appraisedValue: 20_000_000_000,
    status: "available",
    onClick: () => alert("Navigate to collateral detail"),
  },
};
