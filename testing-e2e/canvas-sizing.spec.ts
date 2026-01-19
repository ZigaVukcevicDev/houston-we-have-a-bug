import { test, expect } from '@playwright/test';

test.describe('Canvas sizing and scrolling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should scale canvas to fit container width on initial load', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');

    // Get canvas internal resolution
    const canvasDimensions = await canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    // Get canvas display size
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Get device pixel ratio
    const dpr = await page.evaluate(() => window.devicePixelRatio);

    // Expected display size based on internal resolution / DPR
    const expectedDisplayWidth = canvasDimensions.width / dpr;

    // Get container width
    const containerWidth = await page.evaluate(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return 0;
      const container =
        hbAnnotation.shadowRoot.querySelector('.canvas-container');
      return container ? container.clientWidth : 0;
    });

    // Canvas should fit within container (accounting for padding)
    expect(box.width).toBeLessThanOrEqual(containerWidth);

    // If canvas would be larger than container, it should be scaled down
    if (expectedDisplayWidth > containerWidth - 32) {
      // Canvas display width should be less than expected (scaled down)
      expect(box.width).toBeLessThan(expectedDisplayWidth);
    }
  });

  test('should show horizontal scrollbar when window is resized smaller than canvas', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');

    // Get initial canvas display size
    const initialBox = await canvas.boundingBox();
    if (!initialBox) throw new Error('Canvas not found');

    // Get canvas min-width
    const minWidth = await canvas.evaluate(
      (c: HTMLCanvasElement) => c.style.minWidth
    );

    // Verify min-width is set
    expect(minWidth).toBeTruthy();

    // Resize viewport to be smaller than canvas min-width
    const targetWidth = Math.floor(initialBox.width) - 100;
    await page.setViewportSize({ width: targetWidth, height: 800 });
    await page.waitForTimeout(100);

    // Check if container has horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const container =
        hbAnnotation.shadowRoot.querySelector('.canvas-container');
      if (!container) return false;
      return container.scrollWidth > container.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(true);
  });

  test('should maintain canvas aspect ratio when scaling', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Get canvas internal resolution
    const canvasDimensions = await canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    // Get canvas display size
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Calculate aspect ratios
    const internalAspectRatio =
      canvasDimensions.width / canvasDimensions.height;
    const displayAspectRatio = box.width / box.height;

    // Aspect ratios should match (within small tolerance for rounding)
    expect(Math.abs(internalAspectRatio - displayAspectRatio)).toBeLessThan(
      0.01
    );
  });

  test('should set min-width and min-height styles on canvas', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');

    // Get canvas styles
    const styles = await canvas.evaluate((c: HTMLCanvasElement) => ({
      minWidth: c.style.minWidth,
      minHeight: c.style.minHeight,
      width: c.style.width,
      height: c.style.height,
    }));

    // All dimension styles should be set
    expect(styles.minWidth).toBeTruthy();
    expect(styles.minHeight).toBeTruthy();
    expect(styles.width).toBeTruthy();
    expect(styles.height).toBeTruthy();

    // min-width should match width (to prevent shrinking below this size)
    expect(styles.minWidth).toBe(styles.width);
    expect(styles.minHeight).toBe(styles.height);
  });

  test('should not be horizontally scrollable on initial load with normal viewport', async ({
    page,
  }) => {
    // Set a reasonable viewport size
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:8080/test-page.html');

    // Check if container has horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const container =
        hbAnnotation.shadowRoot.querySelector('.canvas-container');
      if (!container) return false;
      return container.scrollWidth > container.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
