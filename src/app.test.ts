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
  it('should render hb-popup element', async () => {
    const element = new HoustonWeHaveABug();
    document.body.appendChild(element);
    await element.updateComplete;
    
    const popup = element.shadowRoot?.querySelector('hb-popup');
    expect(popup).toBeTruthy();
    
    document.body.removeChild(element);
  });
});
