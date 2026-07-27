import type { Meta, StoryObj } from '@storybook/react';
import CollateralGrid from './CollateralGrid';

const meta: Meta<typeof CollateralGrid> = {
  title: 'Components/CollateralGrid',
  component: CollateralGrid,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCollateralBase = {
  id: 'col-123',
  animal_type: 'cattle',
  count: 5,
  appraised_value: 50_000_000,
  createdAt: '2026-07-15T00:00:00.000Z',
};

export const Default: Story = {
  args: {
    collaterals: [mockCollateralBase],
    loading: false,
    onCardClick: (id: string) => console.log('Clicked:', id),
  },
};

export const Loading: Story = {
  args: {
    collaterals: [],
    loading: true,
    onCardClick: () => {},
  },
};

export const Empty: Story = {
  args: {
    collaterals: [],
    loading: false,
    onCardClick: () => {},
    onAddCollateral: () => alert('Add collateral clicked'),
  },
};

export const HealthStates: Story = {
  args: {
    collaterals: [
      {
        ...mockCollateralBase,
        id: 'col-healthy',
        animal_type: 'cattle',
        health_factor_bps: 18000, // 1.8x - green (healthy)
      },
      {
        ...mockCollateralBase,
        id: 'col-moderate',
        animal_type: 'goat',
        health_factor_bps: 12000, // 1.2x - yellow (moderate)
      },
      {
        ...mockCollateralBase,
        id: 'col-risk',
        animal_type: 'sheep',
        health_factor_bps: 9500, // 0.95x - red (at risk)
      },
    ],
    loading: false,
    onCardClick: (id: string) => console.log('Clicked:', id),
  },
};

export const NoPledge: Story = {
  args: {
    collaterals: [
      {
        ...mockCollateralBase,
        health_factor_bps: null, // No loan associated
      },
    ],
    loading: false,
    onCardClick: () => {},
  },
};