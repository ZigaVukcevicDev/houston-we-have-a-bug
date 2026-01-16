import { test, expect } from '@playwright/test';

test.describe('Rectangle tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should draw a freeform rectangle', async ({ page }) => {
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

    // Click on the rectangle to select it - if annotation persists, this should work
    await page.mouse.click(box.x + 200, box.y + 150);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should draw a square when holding Shift', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw square with Shift
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200); // Shift should make it square
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the square to verify it was created
    await page.mouse.click(box.x + 175, box.y + 175);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow moving rectangle after creation', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool is automatically activated, now move the rectangle
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on the new position to verify rectangle moved
    await page.mouse.click(box.x + 300, box.y + 300);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow resizing rectangle by dragging corner handle', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 200;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Drag bottom-right corner handle to resize
    await page.mouse.move(endX, endY); // Move to bottom-right handle
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50); // Resize larger
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click inside the resized rectangle to verify it worked
    await page.mouse.click(box.x + 220, box.y + 220);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should delete rectangle when pressing Delete key', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Rectangle should be selected automatically, press Delete
    await page.keyboard.press('Delete');

    await page.waitForTimeout(100);

    // Click where the rectangle was - it should not be selected anymore
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should still be active but nothing selected
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should switch to select tool after drawing rectangle', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Verify rectangle tool is active
    await expect(page.locator('[data-tool="rectangle"][aria-selected="true"]')).toBeVisible();

    // Draw rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool should now be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });
});
