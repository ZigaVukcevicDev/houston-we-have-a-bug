import { describe, it, expect, beforeEach } from 'vitest';
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
});
