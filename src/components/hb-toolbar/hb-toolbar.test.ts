import { describe, it, expect, beforeEach } from 'vitest';
import { HBToolbar } from './hb-toolbar';

describe('HBToolbar', () => {
  let toolbar: HBToolbar;

  beforeEach(() => {
    toolbar = new HBToolbar();
  });

  it('should have default color property', () => {
    expect(toolbar.color).toBe('#ff0000');
  });

  it('should have default fontSize property', () => {
    expect(toolbar.fontSize).toBe(24);
  });

  it('should have predefined font sizes', () => {
    expect(toolbar['fontSizes']).toEqual([14, 18, 24, 32, 48]);
  });

  it('should dispatch color-change event with new color', () => {
    let dispatchedColor: string | undefined;

    toolbar.addEventListener('color-change', ((e: CustomEvent<string>) => {
      dispatchedColor = e.detail;
    }) as EventListener);

    const mockInput = document.createElement('input');
    mockInput.value = '#00ff00';

    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: mockInput });

    toolbar['_handleColorChange'](event);

    expect(dispatchedColor).toBe('#00ff00');
  });

  it('should dispatch font-size-change event with new size', () => {
    let dispatchedSize: number | undefined;

    toolbar.addEventListener('font-size-change', ((e: CustomEvent<number>) => {
      dispatchedSize = e.detail;
    }) as EventListener);

    const mockSelect = document.createElement('select');
    const option = document.createElement('option');
    option.value = '32';
    mockSelect.appendChild(option);
    mockSelect.value = '32';

    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: mockSelect });

    toolbar['_handleFontSizeChange'](event);

    expect(dispatchedSize).toBe(32);
  });
});
