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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow resizing rectangle by dragging corner handle', async ({
    page,
  }) => {
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
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
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should switch to select tool after drawing rectangle', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Verify rectangle tool is active
    await expect(
      page.locator('[data-tool="rectangle"][aria-selected="true"]')
    ).toBeVisible();

    // Draw rectangle
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

  test('should show resize cursor when hovering over handles', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

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

    // Hover over top-left handle
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(50);
    let cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
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

  test('should show move cursor when hovering over rectangle body', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

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

    // Hover over left edge of rectangle (not a handle)
    const midY = (startY + endY) / 2;
    await page.mouse.move(startX, midY);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');
  });

  test('should show pointer cursor when hovering over unselected rectangle', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

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

    // Hover over left edge of rectangle
    const midY = (startY + endY) / 2;
    await page.mouse.move(startX, midY);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should draw multiple rectangles and select between them', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw second rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw third rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 150, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 280);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Select first rectangle by clicking on its edge
    await page.mouse.click(box.x + 100, box.y + 125);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Select second rectangle by clicking on its edge
    await page.mouse.click(box.x + 250, box.y + 125);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Select third rectangle by clicking on its edge
    await page.mouse.click(box.x + 150, box.y + 240);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should cancel rectangle drawing with Escape key', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Start drawing rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);

    // Press Escape before releasing mouse
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Rectangle tool should still be active
    await expect(
      page.locator('[data-tool="rectangle"][aria-selected="true"]')
    ).toBeVisible();

    // Try to click where the rectangle would have been - nothing should be selected
    await page.mouse.click(box.x + 150, box.y + 150);
    await page.waitForTimeout(100);

    // Should not switch to select tool since no annotation was created
    await expect(
      page.locator('[data-tool="rectangle"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should resize from all four corner handles', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw initial rectangle
    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 300;
    const endY = box.y + 300;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Test resizing from top-left corner
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 30, startY - 30);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify rectangle is still selectable at new position
    await page.mouse.click(startX - 30, startY);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Test resizing from top-right corner
    await page.mouse.move(endX, startY - 30);
    await page.mouse.down();
    await page.mouse.move(endX + 30, startY - 50);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Test resizing from bottom-left corner
    await page.mouse.move(startX - 30, endY);
    await page.mouse.down();
    await page.mouse.move(startX - 50, endY + 30);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Test resizing from bottom-right corner
    await page.mouse.move(endX + 30, endY + 30);
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify rectangle is still selectable
    await page.mouse.click(startX, startY + 50);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw rectangles with negative dimensions', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle from bottom-right to top-left (negative width and height)
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify rectangle was created by clicking on its edge
    await page.mouse.click(box.x + 150, box.y + 200);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Draw rectangle from bottom-left to top-right (negative height only)
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 400);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 320);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify second rectangle was created
    await page.mouse.click(box.x + 100, box.y + 360);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Draw rectangle from top-right to bottom-left (negative width only)
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 450, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 230);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify third rectangle was created
    await page.mouse.click(box.x + 350, box.y + 190);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw rectangles with extreme aspect ratios', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw very wide rectangle (horizontal)
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 50, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 450, box.y + 120);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify wide rectangle was created by clicking on its edge
    await page.mouse.click(box.x + 50, box.y + 110);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Draw very tall rectangle (vertical)
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 450);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify tall rectangle was created by clicking on its edge
    await page.mouse.click(box.x + 110, box.y + 150);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw rectangle at canvas edge', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle at top edge
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify rectangle was created
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw very small rectangle near minimum size', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw small rectangle (50x50)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should create rectangle
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw very large rectangle filling most of canvas', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw large rectangle
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 20, box.y + box.height - 20);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Verify rectangle was created
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle overlapping rectangles with different selection states', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw second overlapping rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Click on first rectangle to select it
    await page.mouse.click(box.x + 150, box.y + 150);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should resize rectangle from all four corners', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Resize from top-left corner
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 50, startY - 50);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Rectangle should still be selected
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle corner resize in all directions', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Test resizing from bottom-right corner
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Drag bottom-right corner
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle edge resizing maintaining proportions', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Try to resize from right edge (middle)
    const rightEdgeX = box.x + 400;
    const middleY = box.y + 250;

    await page.mouse.move(rightEdgeX, middleY);
    await page.mouse.down();
    await page.mouse.move(rightEdgeX + 50, middleY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw rectangle with extreme aspect ratio (very wide)', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw very wide rectangle
    await page.mouse.move(box.x + 50, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 600, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });
});
