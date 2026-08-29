/**
 * Tests for the collateral detail page (/collateral/[id]).
 * Uses fetch mocking to simulate API responses.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CollateralDetailPage from '@/app/collateral/[id]/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'col-1' }),
}));

// Mock next/link
jest.mock('next/link', () => {
  const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});

// Mock next/image — renders a plain <img> so tests can assert on src/alt
jest.mock('next/image', () => {
  const MockImage = ({
    src,
    alt,
    loading,
    sizes,
    className,
    placeholder,
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    sizes?: string;
    placeholder?: string;
    blurDataURL?: string;
  }) => (
    <img
      src={src as string}
      alt={alt}
      loading={loading}
      data-sizes={sizes}
      data-placeholder={placeholder}
      className={className}
    />
  );
  MockImage.displayName = 'Image';
  return MockImage;
});

// Mock PriceChart to prevent fetch conflicts in tests
jest.mock('@/components/PriceChart', () => ({
  PriceChart: () => <div data-testid="price-chart-mock" />,
}));

// Mock Sparkline
jest.mock("@/components/Sparkline", () => ({
  default: () => <div data-testid="sparkline-mock" />,
}));

const mockRecord = {
  id: 'col-1',
  owner: 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN',
  animal_type: 'cattle',
  breed: 'Nguni',
  age_years: 3,
  weight_kg: 450,
  count: 2,
  appraised_value: 50_000_000,
  appraisal_history: [
    { date: '2026-01-01T00:00:00.000Z', value: 45_000_000 },
    { date: '2026-06-01T00:00:00.000Z', value: 50_000_000 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('CollateralDetailPage', () => {
  it('renders animal profile and current appraised value', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockRecord,
    } as Response);

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/cattle/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Nguni/i)).toBeInTheDocument();
    expect(screen.getByText(/3 yr/i)).toBeInTheDocument();
    expect(screen.getByText(/450 kg/i)).toBeInTheDocument();
    // Current appraised value: 50_000_000 stroops = 5 XLM — may appear multiple times
    const valueMatches = screen.getAllByText(/5(\.00)? XLM|5 XLM/);
    expect(valueMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders appraisal history table with newest entry first', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockRecord,
    } as Response);

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Appraisal History/i)).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    // rows[0] = header, rows[1] = newest (Jun 2026), rows[2] = oldest (Jan 2026)
    expect(rows.length).toBe(3); // header + 2 data rows
    // Newest first: 50_000_000 stroops = 5 XLM
    expect(rows[1].textContent).toMatch(/5(\.00)?/);
    // Oldest: 45_000_000 stroops = 4.5 XLM
    expect(rows[2].textContent).toMatch(/4\.5/);
  });

  it('renders back link to dashboard', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockRecord,
    } as Response);

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/cattle/i)).toBeInTheDocument();
    });

    const link = screen.getByText(/Back to Dashboard/i).closest('a');
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('shows 404 error state when collateral is not found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 404,
      ok: false,
    } as Response);

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Collateral Not Found/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/col-1/)).toBeInTheDocument();
    // Page has two "Back to Collateral List" links — use getAllByText
    const backLinks = screen.getAllByText(/Back to Collateral List/i);
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    expect(backLinks[0].closest('a')).toHaveAttribute('href', '/collateral');
  });

  it('shows network error state with retry button when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not load collateral – check your connection/i)
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('retries fetch when retry button is clicked', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockRecord,
      } as Response);

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not load collateral – check your connection/i)
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/cattle/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows error state when response status is not ok and not 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    render(<CollateralDetailPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not load collateral – check your connection/i)
      ).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  describe('responsive collateral image (#815)', () => {
    const recordWithPhoto = {
      ...mockRecord,
      photo_url: 'https://example.com/cattle-photo.jpg',
    };

    it('renders Next.js Image component when photo_url is present', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => recordWithPhoto,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: /cattle collateral photo/i })).toBeInTheDocument();
      });
    });

    it('image has descriptive alt text from collateral metadata', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => recordWithPhoto,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { name: /cattle collateral photo/i });
        expect(img).toHaveAttribute('alt', 'cattle collateral photo');
      });
    });

    it('image uses lazy loading', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => recordWithPhoto,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { name: /cattle collateral photo/i });
        expect(img).toHaveAttribute('loading', 'lazy');
      });
    });

    it('image has sizes attribute for responsive srcset', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => recordWithPhoto,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { name: /cattle collateral photo/i });
        expect(img).toHaveAttribute('data-sizes');
      });
    });

    it('image has blur placeholder for smooth loading', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => recordWithPhoto,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        const img = screen.getByRole('img', { name: /cattle collateral photo/i });
        expect(img).toHaveAttribute('data-placeholder', 'blur');
      });
    });

    it('renders emoji fallback when photo_url is absent', async () => {
      const recordWithoutPhoto = { ...mockRecord, photo_url: undefined };
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => recordWithoutPhoto,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        expect(screen.getByText('🐄')).toBeInTheDocument();
      });
      // No collateral photo img element should be rendered
      expect(screen.queryByRole('img', { name: /collateral photo/i })).toBeNull();
    });
  });

  describe("copy collateral ID (#864)", () => {
    it("renders a copy button next to the collateral ID", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => mockRecord,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/col-1/)).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole("button", { name: /copy collateral id/i });
      expect(copyBtn).toBeInTheDocument();
    });

    it("copies the collateral ID to clipboard and shows Copied feedback", async () => {
      const clipboardMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: clipboardMock },
        writable: true,
        configurable: true,
      });

      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => mockRecord,
      } as Response);

      render(<CollateralDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/col-1/)).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole("button", { name: /copy collateral id/i });
      fireEvent.click(copyBtn);

      expect(clipboardMock).toHaveBeenCalledWith("col-1");
      expect(screen.getByRole("button", { name: /collateral id copied/i })).toBeInTheDocument();
    });
  });
});
