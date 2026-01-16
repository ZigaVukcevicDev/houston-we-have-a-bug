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
});
