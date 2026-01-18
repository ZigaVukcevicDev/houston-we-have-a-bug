import { test, expect } from '@playwright/test';

/**
 * E2E tests for annotation tools
 * These test actual user flows in a real browser
 */
test.describe('Annotation tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('arrow annotation persists after drawing', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the arrow to select it - if annotation persists, this should work
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('text annotation persists after drawing', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();

    // Type text
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el, text) => el.textContent = text, 'Test');

    // Click outside to finalize
    await page.mouse.click(box.x + 400, box.y + 400);

    // Wait for finalization
    await page.waitForTimeout(200);

    // Click on the text annotation - should select it if it persists
    await page.mouse.click(box.x + 200, box.y + 150);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('rectangle annotation persists after drawing', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the rectangle to select it
    await page.mouse.click(box.x + 200, box.y + 150);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('line annotation persists after drawing', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the line to select it
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });
});
