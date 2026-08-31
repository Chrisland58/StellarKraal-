/**
 * Tests for Issue 1 – SearchFilterBar 300 ms debounce
 *
 * Verifies:
 *  - Text input changes update filters.query immediately (controlled input)
 *  - debouncedQuery only reflects input value after 300 ms
 *  - Chip filters apply immediately (no debounce)
 *  - clearAll resets debouncedQuery immediately without waiting for the timer
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSearchFilter } from '@/hooks/useSearchFilter';
import SearchFilterBar from '@/components/SearchFilterBar';

// ── Next.js navigation mocks ───────────────────────────────────────────────────
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/loans',
  useSearchParams: () => mockSearchParams,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

describe('useSearchFilter – debouncedQuery', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('exposes debouncedQuery initialized to empty string', () => {
    const { result } = renderHook(() => useSearchFilter());
    expect(result.current.debouncedQuery).toBe('');
  });

  it('debouncedQuery does NOT update immediately when setQuery is called', () => {
    const { result } = renderHook(() => useSearchFilter());

    act(() => {
      result.current.setQuery('cattle');
    });

    // filters.query updates immediately (controlled input)
    expect(result.current.filters.query).toBe('cattle');
    // debouncedQuery has NOT updated yet
    expect(result.current.debouncedQuery).toBe('');
  });

  it('debouncedQuery updates after 300 ms', () => {
    const { result } = renderHook(() => useSearchFilter());

    act(() => {
      result.current.setQuery('cattle');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.debouncedQuery).toBe('cattle');
  });

  it('debouncedQuery uses the latest value when typing fast (debounce resets)', () => {
    const { result } = renderHook(() => useSearchFilter());

    act(() => {
      result.current.setQuery('c');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setQuery('ca');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    act(() => {
      result.current.setQuery('cattle');
    });

    // Still not updated yet (300 ms not elapsed since last keystroke)
    expect(result.current.debouncedQuery).toBe('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Only reflects the final value
    expect(result.current.debouncedQuery).toBe('cattle');
  });

  it('clearAll resets debouncedQuery immediately (no timer needed)', () => {
    const { result } = renderHook(() => useSearchFilter());

    act(() => {
      result.current.setQuery('cattle');
    });

    // debouncedQuery not yet updated
    expect(result.current.debouncedQuery).toBe('');

    act(() => {
      result.current.clearAll();
    });

    // clearAll resets immediately
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.filters.query).toBe('');
  });

  it('chip filters (toggleStatus) apply immediately without debounce', () => {
    const { result } = renderHook(() => useSearchFilter());

    act(() => {
      result.current.toggleStatus('active');
    });

    // URL updated immediately
    expect(mockReplace).toHaveBeenCalledWith('/loans?status=active', { scroll: false });
    // No timer advance needed
    expect(result.current.filters.statuses).toEqual(['active']);
  });

  it('initialises debouncedQuery from URL on mount', () => {
    mockSearchParams = new URLSearchParams('q=goat');
    const { result } = renderHook(() => useSearchFilter());
    expect(result.current.debouncedQuery).toBe('goat');
    expect(result.current.filters.query).toBe('goat');
  });
});

describe('SearchFilterBar – debounced text input', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockSearchParams = new URLSearchParams();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the search input', () => {
    render(
      <SearchFilterBar statusOptions={[]} typeOptions={[]} searchPlaceholder="Search animals" />
    );
    expect(screen.getByPlaceholderText('Search animals')).toBeInTheDocument();
  });

  it('input value reflects raw typed text immediately (controlled)', () => {
    render(<SearchFilterBar statusOptions={[]} typeOptions={[]} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'cattle' } });
    expect((input as HTMLInputElement).value).toBe('cattle');
  });

  it('query chip does NOT appear immediately after typing', () => {
    render(<SearchFilterBar statusOptions={[]} typeOptions={[]} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'cattle' } });

    // No chip yet because debouncedQuery hasn't fired
    expect(screen.queryByText(/"cattle"/)).not.toBeInTheDocument();
  });

  it('query chip appears after 300 ms debounce', () => {
    render(<SearchFilterBar statusOptions={[]} typeOptions={[]} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'cattle' } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.getByText(/"cattle"/)).toBeInTheDocument();
  });

  it('URL is updated via router.replace after debounce', () => {
    render(<SearchFilterBar statusOptions={[]} typeOptions={[]} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'goat' } });

    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockReplace).toHaveBeenCalledWith('/loans?q=goat', { scroll: false });
  });
});
