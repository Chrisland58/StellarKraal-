import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import HealthGauge, { SkeletonHealthGauge } from '../components/HealthGauge';

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
      (p) => p.getAttribute('class')?.includes('motion-reduce'),
    );
    expect(progressArc).toBeTruthy();

    const needle = container.querySelector('line');
    expect(needle!.getAttribute('class')).toContain('motion-reduce');
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
    // Circles are rendered inside the history SVG
    const circles = container.querySelectorAll('circle[role="button"]');
    expect(circles.length).toBe(2);
  });

  it('allows keyboard navigation between chart points and shows tooltip', () => {
    const { container } = render(
      <HealthGauge
        value={10000}
        history={[
          { date: '2026-01-01', value: 8000 },
          { date: '2026-02-01', value: 11000 },
        ]}
      />,
    );

    const points = Array.from(container.querySelectorAll<HTMLElement>('circle[role="button"]'));
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

describe('HealthGauge skeleton', () => {
  it('renders skeleton when loading prop is true', () => {
    const { getByTestId } = render(<HealthGauge value={0} loading={true} />);
    expect(getByTestId('health-gauge-skeleton')).toBeTruthy();
  });

  it('does not render live gauge content when loading is true', () => {
    render(<HealthGauge value={15_000} loading={true} />);
    // The real gauge shows "Safe" and a numeric ratio; neither should appear
    expect(screen.queryByText('Safe')).toBeNull();
    expect(screen.queryByText('1.50x')).toBeNull();
  });

  it('renders live gauge when loading is false', () => {
    render(<HealthGauge value={15_000} loading={false} />);
    expect(screen.getByText('Safe')).toBeTruthy();
  });

  it('renders live gauge when loading prop is omitted', () => {
    render(<HealthGauge value={15_000} />);
    expect(screen.getByText('Safe')).toBeTruthy();
  });

  it('skeleton has aria-busy and aria-label for screen readers', () => {
    render(<SkeletonHealthGauge />);
    const el = screen.getByLabelText('Loading health gauge');
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('skeleton renders an SVG arc with the same viewBox as the live gauge', () => {
    const { container } = render(<SkeletonHealthGauge />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('viewBox')).toBe('20 20 160 90');
  });

  it('skeleton dimensions do not cause layout shift when replaced by live gauge', () => {
    const { container: skeletonContainer } = render(<SkeletonHealthGauge />);
    const { container: gaugeContainer } = render(<HealthGauge value={12_000} />);
    const skeletonSvg = skeletonContainer.querySelector('svg');
    const gaugeSvg = gaugeContainer.querySelector('svg');
    // Both use the same viewBox and className, so no layout shift
    expect(skeletonSvg!.getAttribute('viewBox')).toBe(gaugeSvg!.getAttribute('viewBox'));
    expect(skeletonSvg!.getAttribute('class')).toBe(gaugeSvg!.getAttribute('class'));
  });
});
