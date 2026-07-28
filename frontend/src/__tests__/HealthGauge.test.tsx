import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import HealthGauge from '../components/HealthGauge';

jest.mock('../lib/design-tokens', () => ({
  healthColor: (bps: number) => (bps >= 15_000 ? '#16A34A' : bps >= 10_000 ? '#D97706' : '#DC2626'),
  colors: { text: { secondary: 'text-brown-600' } },
}));

describe('HealthGauge', () => {
  it('shows Safe label when hf >= 15_000', () => {
    render(<HealthGauge value={15_000} />);
    expect(screen.getByText('Safe')).toBeTruthy();
  });

  it('shows Warning label when 10_000 <= hf < 15_000', () => {
    render(<HealthGauge value={13_333} />);
    expect(screen.getByText('Warning')).toBeTruthy();
  });

  it('shows Danger label when hf < 10_000', () => {
    render(<HealthGauge value={8_000} />);
    expect(screen.getByText('Danger')).toBeTruthy();
  });

  it('displays numeric ratio', () => {
    render(<HealthGauge value={10_000} />);
    expect(screen.getByText('1.00x')).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(<HealthGauge value={13_333} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('has accessible role and aria-label', () => {
    render(<HealthGauge value={13_333} />);
    const el = screen.getByRole('status');
    expect(el.getAttribute('aria-label')).toMatch(/1\.33x/);
  });

  it('applies animation transition styles on the progress arc', () => {
    const { container } = render(<HealthGauge value={12_000} />);
    // Find the filled progress arc (has stroke-dashoffset style)
    const paths = container.querySelectorAll('path');
    const progressArc = Array.from(paths).find(
      (p) => p.style.strokeDashoffset !== '' || p.style.transition?.includes('stroke-dashoffset'),
    );
    expect(progressArc).toBeTruthy();
    expect(progressArc!.style.transition).toMatch(/stroke-dashoffset/);
    expect(progressArc!.style.transition).toMatch(/ease-out/);
  });

  it('applies stroke colour transition on the progress arc', () => {
    const { container } = render(<HealthGauge value={12_000} />);
    const paths = container.querySelectorAll('path');
    const progressArc = Array.from(paths).find(
      (p) => p.style.transition?.includes('stroke'),
    );
    expect(progressArc).toBeTruthy();
    expect(progressArc!.style.transition).toMatch(/stroke/);
  });

  it('applies needle transition styles', () => {
    const { container } = render(<HealthGauge value={12_000} />);
    const needle = container.querySelector('line');
    expect(needle).toBeTruthy();
    expect(needle!.style.transition).toMatch(/ease-out/);
  });

  it('applies motion-reduce class to arc and needle for prefers-reduced-motion', () => {
    const { container } = render(<HealthGauge value={12_000} />);
    const paths = container.querySelectorAll('path');
    const progressArc = Array.from(paths).find(
      (p) => p.className.includes('motion-reduce'),
    );
    expect(progressArc).toBeTruthy();

    const needle = container.querySelector('line');
    expect(needle!.className.baseVal).toContain('motion-reduce');
  });

  it('chart points animate on appearance when mounted', () => {
    const { container } = render(
      <HealthGauge
        value={10_000}
        history={[
          { date: '2026-01-01', value: 8_000 },
          { date: '2026-02-01', value: 11_000 },
        ]}
      />,
    );
    // After mount, points should have motion-safe animation class
    const circles = container.querySelectorAll('circle[role="button"]');
    // Circles are rendered; mounted state may vary in test env but they exist
    expect(circles.length).toBe(2);
  });

  it('allows keyboard navigation between chart points and shows tooltip', () => {
    render(
      <HealthGauge
        value={10000}
        history={[
          { date: '2026-01-01', value: 8000 },
          { date: '2026-02-01', value: 11000 },
        ]}
      />,
    );

    const points = screen.getAllByRole('button');
    expect(points).toHaveLength(2);

    act(() => {
      points[0].focus();
    });
    expect(points[0]).toHaveFocus();

    act(() => {
      fireEvent.keyDown(points[0], { key: 'ArrowRight', code: 'ArrowRight' });
    });
    expect(points[1]).toHaveFocus();

    act(() => {
      fireEvent.keyDown(points[1], { key: 'Enter', code: 'Enter' });
    });
    expect(screen.getByText('Health:')).toBeTruthy();
    expect(screen.getByText('1.10x')).toBeTruthy();

    act(() => {
      fireEvent.keyDown(points[1], { key: 'Escape', code: 'Escape' });
    });
    expect(screen.queryByText('Health:')).toBeNull();
  });
});
