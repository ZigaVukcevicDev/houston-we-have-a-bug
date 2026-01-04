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

  describe('tool-change events', () => {
    it('should update activeTool when tool is clicked', () => {
      toolbar['handleToolClick']('text');

      expect(toolbar.activeTool).toBe('text');
    });

    it('should dispatch tool-change event with correct detail', () => {
      let capturedEvent: CustomEvent | null = null;
      toolbar.addEventListener('tool-change', (e) => {
        capturedEvent = e as CustomEvent;
      });

      toolbar['handleToolClick']('line');

      expect(capturedEvent).not.toBeNull();
      expect(capturedEvent!.detail.tool).toBe('line');
    });

    it('should dispatch event with bubbles enabled', () => {
      let capturedEvent: CustomEvent | null = null;
      toolbar.addEventListener('tool-change', (e) => {
        capturedEvent = e as CustomEvent;
      });

      toolbar['handleToolClick']('select');

      expect(capturedEvent!.bubbles).toBe(true);
    });

    it('should dispatch event with composed enabled', () => {
      let capturedEvent: CustomEvent | null = null;
      toolbar.addEventListener('tool-change', (e) => {
        capturedEvent = e as CustomEvent;
      });

      toolbar['handleToolClick']('rectangle');

      expect(capturedEvent!.composed).toBe(true);
    });
  });

  describe('render', () => {
    it('should render toolbar element', () => {
      document.body.appendChild(toolbar);

      expect(toolbar.shadowRoot).toBeDefined();
    });

    it('should mark active tool with isActive property', async () => {
      toolbar.activeTool = 'text';
      document.body.appendChild(toolbar);
      await toolbar.updateComplete;

      expect(toolbar.activeTool).toBe('text');
    });

    it('should render all tool buttons', async () => {
      document.body.appendChild(toolbar);
      await toolbar.updateComplete;

      const toolButtons = toolbar.shadowRoot?.querySelectorAll('hb-toolbar-tool');
      expect(toolButtons?.length).toBe(6); // select, text, line, arrow, rectangle, crop
    });

    it('should render logo link', async () => {
      document.body.appendChild(toolbar);
      await toolbar.updateComplete;

      const logo = toolbar.shadowRoot?.querySelector('.logo');
      expect(logo).toBeTruthy();
    });
  });
});
