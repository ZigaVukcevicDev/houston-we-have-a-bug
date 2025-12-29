import { describe, it, expect, beforeEach } from 'vitest';

describe('tab entrypoint', () => {
  beforeEach(() => {
    // Clear any existing custom elements
    document.body.innerHTML = '';
  });

  it('should import hb-annotation component', async () => {
    // Import the entrypoint
    const module = await import('../entrypoints/tab');

    // Should successfully import
    expect(module).toBeDefined();
  });

  it('should register hb-annotation custom element', async () => {
    // Import the entrypoint (which imports the component)
    await import('../entrypoints/tab');

    // Check if custom element is registered
    const element = document.createElement('hb-annotation');
    expect(element).toBeInstanceOf(HTMLElement);

    // Should be able to append to DOM
    document.body.appendChild(element);
    expect(document.querySelector('hb-annotation')).toBeTruthy();
  });
});
