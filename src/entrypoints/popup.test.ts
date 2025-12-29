import { describe, it, expect, beforeEach } from 'vitest';

describe('popup entrypoint', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
  });

  it('should import app component', async () => {
    // Import the entrypoint
    const module = await import('../entrypoints/popup');

    // Should successfully import
    expect(module).toBeDefined();
  });

  it('should register hb-app custom element', async () => {
    // Import the entrypoint (which imports the app)
    await import('../entrypoints/popup');

    // Check if custom element is registered
    const element = document.createElement('hb-app');
    expect(element).toBeInstanceOf(HTMLElement);
  });
});
