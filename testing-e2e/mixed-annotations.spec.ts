import { test, expect } from '@playwright/test';

test.describe('Mixed annotations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should create all annotation types in sequence', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Create line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 50, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Create rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 200, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Create text
    await page.click('[data-tool="text"]');
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 260);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const editableDiv = page.locator('[contenteditable="true"]');
    await editableDiv.fill('Test text');
    await page.mouse.click(box.x + 500, box.y + 500);
    await page.waitForTimeout(100);

    // All should be created - select tool should be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should select between different annotation types', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Create rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Click on arrow to select it
    await page.mouse.click(box.x + 150, box.y + 125);
    await page.waitForTimeout(100);

    // Select tool should be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Click on rectangle to select it
    await page.mouse.click(box.x + 325, box.y + 150);
    await page.waitForTimeout(100);

    // Still in select tool
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should delete mixed annotations individually', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create multiple annotations
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Delete arrow
    await page.mouse.click(box.x + 150, box.y + 125);
    await page.waitForTimeout(100);
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    // Line should still exist
    await page.mouse.click(box.x + 300, box.y + 125);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle overlapping annotations of different types', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Create arrow through rectangle
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Both should exist and be selectable
    await page.mouse.click(box.x + 200, box.y + 175);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should move overlapping annotations independently', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create two overlapping rectangles
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Select first rectangle and move it
    await page.mouse.click(box.x + 120, box.y + 120);
    await page.waitForTimeout(100);

    await page.mouse.move(box.x + 175, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 125, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Both rectangles should still exist
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should resize overlapping annotations', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create overlapping rectangle and text
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="text"]');
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 220);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const editableDiv = page.locator('[contenteditable="true"]');
    await editableDiv.fill('Overlapping text');
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(100);

    // Select and resize rectangle
    await page.mouse.click(box.x + 200, box.y + 175);
    await page.waitForTimeout(100);

    // Try to resize from corner
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Both should still exist
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle z-order of mixed annotations', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create annotations in specific order
    // First: Rectangle (bottom layer)
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Second: Arrow (middle layer)
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Third: Text (top layer)
    await page.click('[data-tool="text"]');
    await page.mouse.move(box.x + 200, box.y + 180);
    await page.mouse.down();
    await page.mouse.move(box.x + 380, box.y + 240);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const editableDiv = page.locator('[contenteditable="true"]');
    await editableDiv.fill('Top layer');
    await page.mouse.click(box.x + 500, box.y + 500);
    await page.waitForTimeout(100);

    // All annotations should be created
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle many annotations (performance test)', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create 12 annotations (3 of each type)
    for (let i = 0; i < 3; i++) {
      // Arrow
      await page.click('[data-tool="arrow"]');
      await page.mouse.move(box.x + 50 + i * 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 80 + i * 50, box.y + 100);
      await page.mouse.up();
      await page.waitForTimeout(50);

      // Line
      await page.click('[data-tool="line"]');
      await page.mouse.move(box.x + 50 + i * 50, box.y + 150);
      await page.mouse.down();
      await page.mouse.move(box.x + 80 + i * 50, box.y + 200);
      await page.mouse.up();
      await page.waitForTimeout(50);

      // Rectangle
      await page.click('[data-tool="rectangle"]');
      await page.mouse.move(box.x + 50 + i * 100, box.y + 250);
      await page.mouse.down();
      await page.mouse.move(box.x + 120 + i * 100, box.y + 320);
      await page.mouse.up();
      await page.waitForTimeout(50);

      // Text (must exceed minimum 40x60)
      await page.click('[data-tool="text"]');
      await page.mouse.move(box.x + 50 + i * 120, box.y + 350);
      await page.mouse.down();
      await page.mouse.move(box.x + 140 + i * 120, box.y + 420);
      await page.mouse.up();
      await page.waitForTimeout(50);

      const editableDiv = page.locator('[contenteditable="true"]');
      await editableDiv.fill(`Text ${i + 1}`);
      await page.mouse.click(box.x + 500, box.y + 500);
      await page.waitForTimeout(50);
    }

    // All annotations should be created
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should deselect all when clicking empty space with mixed annotations', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create mixed annotations
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Click on arrow to select
    await page.mouse.click(box.x + 150, box.y + 125);
    await page.waitForTimeout(100);

    // Click empty space to deselect
    await page.mouse.click(box.x + 500, box.y + 300);
    await page.waitForTimeout(100);

    // Should still be in select tool
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle tool switching with mixed active states', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Switch to rectangle
    await page.click('[data-tool="rectangle"]');
    await page.waitForTimeout(100);

    // Create rectangle
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Switch to text
    await page.click('[data-tool="text"]');
    await page.waitForTimeout(100);

    // Text tool should be active
    await expect(
      page.locator('[data-tool="text"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should maintain annotation visibility during rapid selection changes', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create multiple annotations
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 400, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 500, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Rapidly click between annotations
    await page.mouse.click(box.x + 150, box.y + 125);
    await page.waitForTimeout(50);
    await page.mouse.click(box.x + 300, box.y + 125);
    await page.waitForTimeout(50);
    await page.mouse.click(box.x + 450, box.y + 150);
    await page.waitForTimeout(50);

    // Should still be in select tool
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle download with mixed annotations', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Create all types of annotations
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 100, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Download
    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });
});
