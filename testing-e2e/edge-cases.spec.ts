import { test, expect } from '@playwright/test';

test.describe('Edge cases and boundary conditions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should handle annotation at exact top edge', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow at very top of canvas (but not TOO close)
    await page.mouse.move(box.x + 100, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 10);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create arrow
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle annotation at exact bottom edge', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line at very bottom of canvas
    await page.mouse.move(box.x + 100, box.y + box.height - 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + box.height - 2);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create line
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle annotation at exact left edge', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle at very left of canvas
    await page.mouse.move(box.x + 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create rectangle
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle annotation at exact right edge', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle at very right of canvas
    await page.mouse.move(box.x + box.width - 150, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 2, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create rectangle
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle annotation spanning all four quadrants', async ({
    page,
  }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Draw from top-left quadrant to bottom-right quadrant
    await page.mouse.move(centerX - 100, centerY - 100);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create arrow
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle zero-size click (no drag)', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Click without dragging
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should still be in arrow tool (no annotation created)
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle extremely rapid clicks', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Rapid clicks on canvas
    for (let i = 0; i < 10; i++) {
      await page.mouse.click(box.x + 100 + i * 10, box.y + 100);
    }
    await page.waitForTimeout(100);

    // Should remain stable
    await expect(canvas).toBeVisible();
  });

  test('should handle click during drawing animation', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Start drawing
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);

    // Click another tool while drawing
    await page.click('[data-tool="line"]');
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Line tool should be active
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle double-click on annotation', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create annotation
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Double-click on annotation
    await page.mouse.dblclick(box.x + 200, box.y + 150);
    await page.waitForTimeout(100);

    // Should remain stable
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle right-click on canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Right-click
    await page.mouse.click(box.x + 100, box.y + 100, { button: 'right' });
    await page.waitForTimeout(100);

    // Canvas should remain stable
    await expect(canvas).toBeVisible();
  });

  test('should handle middle-click on canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Middle-click
    await page.mouse.click(box.x + 100, box.y + 100, { button: 'middle' });
    await page.waitForTimeout(100);

    // Canvas should remain stable
    await expect(canvas).toBeVisible();
  });

  test('should handle rapid tool switching', async ({ page }) => {
    // Rapidly switch between tools
    for (let i = 0; i < 20; i++) {
      const tools = ['arrow', 'line', 'rectangle', 'text', 'crop', 'select'];
      const tool = tools[i % tools.length];
      await page.click(`[data-tool="${tool}"]`);
      await page.waitForTimeout(20);
    }

    // Should end up in a stable state
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should handle annotation creation at exact corners', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Top-left corner
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create rectangle
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle very small drag distance (< 5px)', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Very small drag
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 102, box.y + 102);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // May or may not create annotation depending on minimum threshold
    // Just verify canvas remains stable
    await expect(canvas).toBeVisible();
  });

  test('should handle selection of very small annotation', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create very small rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 145, box.y + 145);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Click on it to select
    await page.mouse.click(box.x + 122, box.y + 122);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle triple-click on canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Triple-click
    await page.mouse.click(box.x + 100, box.y + 100);
    await page.mouse.click(box.x + 100, box.y + 100);
    await page.mouse.click(box.x + 100, box.y + 100);
    await page.waitForTimeout(100);

    // Canvas should remain stable
    await expect(canvas).toBeVisible();
  });
});
