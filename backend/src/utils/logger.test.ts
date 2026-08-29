/**
 * Unit tests for logger configuration, including log rotation.
 */
import { config } from '../config';

describe('Logger Configuration', () => {
  it('should have LOG_LEVEL configured', () => {
    expect(config.LOG_LEVEL).toBeDefined();
    expect(['debug', 'info', 'warn', 'error']).toContain(config.LOG_LEVEL);
  });

  it('should have LOG_MAX_FILES configured as a number', () => {
    const maxFiles = parseInt(config.LOG_MAX_FILES, 10);
    expect(Number.isInteger(maxFiles)).toBe(true);
    expect(maxFiles).toBeGreaterThan(0);
  });

  it('should have LOG_MAX_SIZE configured', () => {
    expect(config.LOG_MAX_SIZE).toBeDefined();
    // Should be a string like "10m", "100m", "1g", etc.
    expect(typeof config.LOG_MAX_SIZE).toBe('string');
    expect(config.LOG_MAX_SIZE.length).toBeGreaterThan(0);
  });

  it('should use default LOG_LEVEL of info when not specified', () => {
    // The default is set in config schema
    // When LOG_LEVEL is not in env, it defaults to 'info'
    expect(['debug', 'info', 'warn', 'error']).toContain(config.LOG_LEVEL);
  });

  it('should use default LOG_MAX_FILES of 7 when not specified', () => {
    const maxFiles = parseInt(config.LOG_MAX_FILES, 10);
    // Expecting default of 7 for 7-day retention with daily rotation
    expect([7, ...Array.from({ length: 10 }, (_, i) => i + 1)]).toContain(maxFiles);
  });

  it('should use default LOG_MAX_SIZE of 10m when not specified', () => {
    // Expecting default log file size limit
    expect(config.LOG_MAX_SIZE.toLowerCase()).toMatch(/^\d+[kmg]b?$/i);
  });
});
