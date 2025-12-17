import { describe, it, expect } from 'vitest';
import { HoustonWeHaveABug } from './app';

describe('HoustonWeHaveABug', () => {
  it('should be defined as a custom element', () => {
    expect(customElements.get('houston-we-have-a-bug')).toBeDefined();
  });

  it('should instantiate correctly', () => {
    const element = new HoustonWeHaveABug();
    expect(element).toBeInstanceOf(HoustonWeHaveABug);
  });
});
