import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Pagination from './Pagination';
import { PAGE_SIZE_OPTIONS, PageSize } from '@/hooks/usePagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/** Interactive story — the page size selector resets to page 1 on change. */
export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState<PageSize>(10);
    const totalPages = 5;

    function handleLimitChange(next: PageSize) {
      setLimit(next);
      setPage(1); // reset to page 1
    }

    return (
      <Pagination
        page={page}
        totalPages={totalPages}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={handleLimitChange}
      />
    );
  },
};

/** Shows available page-size options: 10 / 20 / 50. */
export const PageSizeOptions: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-brown-600">
        Available page sizes: {PAGE_SIZE_OPTIONS.join(', ')} — changing size resets to page 1.
      </p>
      {PAGE_SIZE_OPTIONS.map((size) => (
        <Pagination
          key={size}
          page={1}
          totalPages={10}
          limit={size}
          onPageChange={() => {}}
          onLimitChange={() => {}}
        />
      ))}
    </div>
  ),
};

/** First page — Previous button is disabled. */
export const FirstPage: Story = {
  args: {
    page: 1,
    totalPages: 5,
    limit: 10,
    onPageChange: () => {},
    onLimitChange: () => {},
  },
};

/** Last page — Next button is disabled. */
export const LastPage: Story = {
  args: {
    page: 5,
    totalPages: 5,
    limit: 10,
    onPageChange: () => {},
    onLimitChange: () => {},
  },
};

/** Middle page — both navigation buttons are active. */
export const MiddlePage: Story = {
  args: {
    page: 3,
    totalPages: 5,
    limit: 20,
    onPageChange: () => {},
    onLimitChange: () => {},
  },
};
