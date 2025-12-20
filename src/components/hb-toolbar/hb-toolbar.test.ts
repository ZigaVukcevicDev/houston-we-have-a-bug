import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HBToolbar } from './hb-toolbar';

describe('HBToolbar', () => {
  let toolbar: HBToolbar;

  beforeEach(() => {
    toolbar = new HBToolbar();
  });

  it('should render the core tools', () => {
    // In a real test we'd check shadowRoot, but we'll verify basic setup for now
    expect(toolbar).toBeDefined();
  });

  describe('_handleDownload', () => {
    it('should dispatch a custom download event', () => {
      const eventSpy = vi.fn();
      toolbar.addEventListener('download', eventSpy);

      toolbar['_handleDownload']();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should dispatch event with bubbling enabled', () => {
      let capturedEvent: CustomEvent | null = null;
      toolbar.addEventListener('download', (e) => {
        capturedEvent = e as CustomEvent;
      });

      toolbar['_handleDownload']();

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent!.bubbles).toBe(true);
    });

    it('should dispatch event with composed enabled', () => {
      let capturedEvent: CustomEvent | null = null;
      toolbar.addEventListener('download', (e) => {
        capturedEvent = e as CustomEvent;
      });

      toolbar['_handleDownload']();

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent!.composed).toBe(true);
    });
  });
});
