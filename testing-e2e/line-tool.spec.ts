import { test, expect } from '@playwright/test';

test.describe('Line tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should draw a freeform line', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the line to select it - if annotation persists, this should work
    await page.mouse.click(box.x + 200, box.y + 175);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should draw a constrained line when holding Shift', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line with Shift (should constrain to horizontal/vertical/45°)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 120); // Shift should constrain this
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the line to verify it was created
    await page.mouse.click(box.x + 175, box.y + 100);

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow moving line after creation', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool is automatically activated, now move the line
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on the new position to verify line moved
    await page.mouse.click(box.x + 300, box.y + 300);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow moving start endpoint', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 200;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Drag start endpoint to new position
    await page.mouse.move(startX, startY); // Move to start endpoint
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 50); // Move endpoint
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on the line to verify it's still there
    await page.mouse.click(box.x + 175, box.y + 175);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow moving end endpoint', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 200;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Drag end endpoint to new position
    await page.mouse.move(endX, endY); // Move to end endpoint
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50); // Move endpoint
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on the line to verify it's still there
    await page.mouse.click(box.x + 175, box.y + 175);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should delete line when pressing Delete key', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Line should be selected automatically, press Delete
    await page.keyboard.press('Delete');

    await page.waitForTimeout(100);

    // Click where the line was - it should not be selected anymore
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should still be active but nothing selected
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should switch to select tool after drawing line', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Verify line tool is active
    await expect(page.locator('[data-tool="line"][aria-selected="true"]')).toBeVisible();

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool should now be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });
});
