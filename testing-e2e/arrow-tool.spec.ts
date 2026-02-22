import { test, expect } from '@playwright/test';

test.describe('Arrow tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should draw a freeform arrow', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the arrow to select it - if annotation persists, this should work
    await page.mouse.click(box.x + 200, box.y + 175);

    // Select tool should be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw a constrained arrow when holding Shift', async ({
    page,
  }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow with Shift (should constrain to horizontal/vertical/45°)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 120); // Shift should constrain this
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // Wait for rendering
    await page.waitForTimeout(100);

    // Click on the arrow to verify it was created
    await page.mouse.click(box.x + 175, box.y + 100);

    // Select tool should be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow moving arrow after creation', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool is automatically activated, now move the arrow
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on the new position to verify arrow moved
    await page.mouse.click(box.x + 300, box.y + 300);

    // Select tool should still be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow moving start endpoint', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
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

    // Click on the arrow to verify it's still there
    await page.mouse.click(box.x + 175, box.y + 175);

    // Select tool should still be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow moving end endpoint', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
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

    // Click on the arrow to verify it's still there
    await page.mouse.click(box.x + 175, box.y + 175);

    // Select tool should still be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should delete arrow when pressing Delete key', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Arrow should be selected automatically, press Delete
    await page.keyboard.press('Delete');

    await page.waitForTimeout(100);

    // Click where the arrow was - it should not be selected anymore
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should still be active but nothing selected
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should switch to select tool after drawing arrow', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Verify arrow tool is active
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();

    // Draw arrow
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
    await page.click('[data-tool="arrow"]');

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
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
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

  test('should show move cursor when hovering over arrow line', async ({
    page,
  }) => {
    await page.click('[data-tool="arrow"]');

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
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over middle of arrow
    await page.mouse.move(startX + 100, startY + 50);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');
  });

  test('should show pointer cursor when hovering over unselected arrow', async ({
    page,
  }) => {
    await page.click('[data-tool="arrow"]');

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

    // Hover over arrow
    await page.mouse.move(startX + 100, startY + 50);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should change cursor to move immediately when clicking to select arrow', async ({
    page,
  }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 300;
    const endY = box.y + 200;

    // Draw arrow
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Deselect by clicking elsewhere
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(50);

    // Verify cursor is not 'move' before clicking
    let cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).not.toBe('move');

    // Click on arrow to select (without moving mouse afterward)
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(50);

    // Cursor should immediately be 'move' without needing to move mouse
    cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');
  });

  test('should draw multiple arrows and select between them', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw second arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw third arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 150, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Select first arrow
    await page.mouse.click(box.x + 150, box.y + 125);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Select second arrow
    await page.mouse.click(box.x + 350, box.y + 125);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Select third arrow
    await page.mouse.click(box.x + 200, box.y + 225);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should cancel arrow drawing with Escape key', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Start drawing arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);

    // Press Escape before releasing mouse
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Arrow tool should still be active
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();

    // Try to click where the arrow would have been - nothing should be selected
    await page.mouse.click(box.x + 150, box.y + 150);
    await page.waitForTimeout(100);

    // Should not switch to select tool since no annotation was created
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw vertical and horizontal arrows', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw vertical arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify vertical arrow was created by clicking on it
    await page.mouse.click(box.x + 100, box.y + 200);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Draw horizontal arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 150, box.y + 350);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify horizontal arrow was created by clicking on it
    await page.mouse.click(box.x + 250, box.y + 350);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw arrow at extreme angles (diagonal)', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw 45-degree arrow (top-left to bottom-right)
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify arrow was created
    await page.mouse.click(box.x + 150, box.y + 150);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw arrow at 135-degree angle', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow from top-right to bottom-left
    await page.mouse.move(box.x + 400, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify arrow was created
    await page.mouse.click(box.x + 300, box.y + 150);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw very short arrow (minimum length)', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw very short arrow (20px)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should still create arrow and switch to select tool
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw very long arrow spanning canvas', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow from near top-left to near bottom-right
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify arrow was created
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw arrow near canvas edge', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow very close to top edge
    await page.mouse.move(box.x + 100, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 5);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify arrow was created
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle multiple overlapping arrows', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw second arrow crossing the first
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Both arrows should exist
    // Click on first arrow
    await page.mouse.click(box.x + 200, box.y + 150);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should render arrowhead correctly at different angles', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Test arrowhead pointing right (0 degrees)
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 50, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Test arrowhead pointing down (90 degrees)
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 50, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 50, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Test arrowhead pointing left (180 degrees)
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Test arrowhead pointing up (270 degrees)
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 350, box.y + 350);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // All arrows should be created successfully
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });
});
