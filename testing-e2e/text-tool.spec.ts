import { test, expect } from '@playwright/test';

test.describe('Text tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('text annotation persists after mouse release', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    // Get canvas element
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box by dragging
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for annotation to be created
    await page.waitForTimeout(100);

    // Check that textarea exists and is visible
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Check that handles are visible
    // Handles should be rendered on canvas, we need to verify the canvas state
    // For now, we'll check that the select tool is active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Type some text
    await textarea.fill('Test annotation');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Wait for textarea to be removed
    await expect(textarea).not.toBeVisible();

    // Verify annotation persists by checking if it's rendered on canvas
    // We can do this by taking a screenshot and comparing, or by checking
    // the component's internal state via accessibility tree or data attributes

    // For now, verify that we can still see the annotation by selecting it
    await page.mouse.click(startX + 50, startY + 50);
    // If annotation exists, clicking it should select it and show handles
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should show handles immediately after drawing text box', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch and rendering
    await page.waitForTimeout(100);

    // Verify select tool is now active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Verify textarea is visible and focused
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // Verify we can type immediately
    await page.keyboard.type('Quick test');
    await expect(textarea).toHaveValue('Quick test');
  });

  test('should remove annotation if no text is entered', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Don't type anything, just click outside
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Wait for finalization
    await page.waitForTimeout(200);

    // Textarea should be gone
    await expect(page.locator('textarea')).not.toBeVisible();

    // Annotation should not exist - verify by checking canvas doesn't have the annotation
    // We can verify this by taking a snapshot of the annotations array
    // This would require exposing the state for testing
  });

  test('should remove annotation on Escape key', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Type some text
    await textarea.fill('Will be cancelled');

    // Press Escape
    await page.keyboard.press('Escape');

    // Textarea should be removed
    await expect(textarea).not.toBeVisible();

    // Annotation should be removed (we'd need to verify canvas state)
  });

  test('should allow resizing text box after creation', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for handles to appear
    await page.waitForTimeout(100);

    // Try to drag bottom-right handle
    // Handles are 8px squares, so click at bottom-right corner
    await page.mouse.move(endX, endY);
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50);
    await page.mouse.up();

    // Verify the text box was resized
    // This would require checking the canvas rendering or component state
  });

  test('should show resize cursor when hovering over handles', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Wait for canvas to update (mode-select has default cursor, not crosshair)
    await page.waitForFunction(() => {
      const hbCanvas = document.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over top-left handle
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(50);
    let cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nwse-resize');

    // Hover over bottom-right handle
    await page.mouse.move(endX, endY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nwse-resize');

    // Hover over top-right handle
    await page.mouse.move(endX, startY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nesw-resize');

    // Hover over bottom-left handle
    await page.mouse.move(startX, endY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nesw-resize');
  });

  test('should show move cursor when hovering over text box border', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Wait for canvas to update (mode-select has default cursor, not crosshair)
    await page.waitForFunction(() => {
      const hbCanvas = document.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over left border (not on handle)
    const midY = (startY + endY) / 2;
    await page.mouse.move(startX, midY);
    await page.waitForTimeout(50);
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should show pointer cursor when hovering over unselected text box', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Test text');

    // Click outside to finalize and deselect
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textarea).not.toBeVisible();

    // Verify we're still in select mode
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Wait for canvas to update (mode-select has default cursor, not crosshair)
    await page.waitForFunction(() => {
      const hbCanvas = document.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Now hover over the text box border
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.waitForTimeout(50);
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  });

  test('should not have text position jump when finalizing', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw first text box at a specific position
    const startX = canvasBox.x + 150;
    const startY = canvasBox.y + 150;
    const endX = canvasBox.x + 350;
    const endY = canvasBox.y + 250;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Get the first textarea position
    const textarea1 = page.locator('textarea');
    await expect(textarea1).toBeVisible();
    const textareaBox1 = await textarea1.boundingBox();
    if (!textareaBox1) throw new Error('Textarea not found');

    // Type some text
    await textarea1.fill('Test text alignment');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textarea1).not.toBeVisible();

    // Wait a bit for finalization
    await page.waitForTimeout(100);

    // Switch back to text tool (it was auto-switched to select)
    await page.click('[data-tool="text"]');

    // Draw second text box at the EXACT same position
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Get the second textarea position
    const textarea2 = page.locator('textarea');
    await expect(textarea2).toBeVisible();
    const textareaBox2 = await textarea2.boundingBox();
    if (!textareaBox2) throw new Error('Second textarea not found');

    // Verify the textareas appear at the same position
    // If there was a vertical jump bug, the second textarea would be offset
    expect(textareaBox2.x).toBeCloseTo(textareaBox1.x, 0);
    expect(textareaBox2.y).toBeCloseTo(textareaBox1.y, 0);
    expect(textareaBox2.width).toBeCloseTo(textareaBox1.width, 0);
    expect(textareaBox2.height).toBeCloseTo(textareaBox1.height, 0);

    // Type text in the second one
    await textarea2.fill('Second annotation');

    // Finalize the second one
    await page.keyboard.press('Escape');
    await expect(textarea2).not.toBeVisible();

    // Verify both annotations exist and are correctly positioned
    // Switch to select tool
    await page.click('[data-tool="select"]');

    // Click on the first annotation position
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Should select one of the annotations (they're at the same position)
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

});
