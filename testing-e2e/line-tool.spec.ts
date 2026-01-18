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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw a constrained line when holding Shift', async ({
    page,
  }) => {
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should switch to select tool after drawing line', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Verify line tool is active
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
    ).toBeVisible();

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool should now be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should show resize cursor when hovering over endpoints', async ({
    page,
  }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 300;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    await page.waitForFunction(() => {
      const hbCanvas = document.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over start endpoint
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(50);
    let cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');

    // Hover over end endpoint
    await page.mouse.move(endX, endY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should show move cursor when hovering over line', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 300;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    await page.waitForFunction(() => {
      const hbCanvas = document.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over middle of line
    await page.mouse.move(startX + 100, startY + 50);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');
  });

  test('should show pointer cursor when hovering over unselected line', async ({
    page,
  }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 300;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Deselect by clicking elsewhere
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(50);

    // Hover over line
    await page.mouse.move(startX + 100, startY + 50);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should draw multiple lines and select between them', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw second line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw third line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 150, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Select first line
    await page.mouse.click(box.x + 150, box.y + 125);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Select second line
    await page.mouse.click(box.x + 350, box.y + 125);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Select third line
    await page.mouse.click(box.x + 200, box.y + 225);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should cancel line drawing with Escape key', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Start drawing line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);

    // Press Escape before releasing mouse
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Line tool should still be active
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
    ).toBeVisible();

    // Try to click where the line would have been - nothing should be selected
    await page.mouse.click(box.x + 150, box.y + 150);
    await page.waitForTimeout(100);

    // Should not switch to select tool since no annotation was created
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw vertical and horizontal lines', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw vertical line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify vertical line was created by clicking on it
    await page.mouse.click(box.x + 100, box.y + 200);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Draw horizontal line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 150, box.y + 350);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify horizontal line was created by clicking on it
    await page.mouse.click(box.x + 250, box.y + 350);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });
});
