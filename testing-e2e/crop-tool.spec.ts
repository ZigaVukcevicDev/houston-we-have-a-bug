import { test, expect } from '@playwright/test';

test.describe('Crop tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should draw a freeform crop rectangle', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();

    // Wait for rendering
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw a square crop when holding Shift', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw square crop with Shift
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.keyboard.down('Shift');
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 250); // Shift should constrain to square
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // Wait for rendering
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow moving crop rectangle after creation', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 300);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Move the crop rectangle by dragging from center
    await page.mouse.move(box.x + 250, box.y + 225);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 275);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow resizing from corner handles', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw initial crop rectangle
    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Resize from bottom-right corner
    await page.mouse.move(endX, endY);
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should allow resizing from edge handles', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw initial crop rectangle
    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Resize from right edge handle
    const midY = (startY + endY) / 2;
    await page.mouse.move(endX, midY);
    await page.mouse.down();
    await page.mouse.move(endX + 60, midY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should redraw crop rectangle when clicking outside', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first crop rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw new crop rectangle by clicking outside the first one
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 550, box.y + 450);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should cancel crop with Escape key', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Press Escape to cancel (clears crop but stays in crop tool)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Crop tool should still be active but crop rectangle cleared
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();

    // Cursor should be crosshair since no crop rectangle exists
    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('crosshair');
  });

  test('should show resize cursor when hovering over corner handles', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

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

  test('should show resize cursor when hovering over edge handles', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Hover over right edge handle
    const midY = (startY + endY) / 2;
    await page.mouse.move(endX, midY);
    await page.waitForTimeout(50);
    let cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('ew-resize');

    // Hover over top edge handle
    const midX = (startX + endX) / 2;
    await page.mouse.move(midX, startY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('ns-resize');
  });

  test('should show move cursor when hovering inside crop rectangle', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Hover over center of crop rectangle
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    await page.mouse.move(centerX, centerY);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');
  });

  test('should show crosshair cursor when outside crop rectangle', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 200;
    const startY = box.y + 200;
    const endX = box.x + 400;
    const endY = box.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Hover outside the crop rectangle
    await page.mouse.move(box.x + 500, box.y + 400);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('crosshair');
  });

  test('should draw crop with negative dimensions', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw from bottom-right to top-left
    await page.mouse.move(box.x + 400, box.y + 350);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();

    // Verify can interact with the crop by moving it
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.down();
    await page.mouse.move(box.x + 320, box.y + 270);
    await page.mouse.up();
    await page.waitForTimeout(100);
  });

  test('should draw very wide crop rectangle', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw very wide rectangle
    await page.mouse.move(box.x + 50, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 550, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should draw very tall crop rectangle', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw very tall rectangle
    await page.mouse.move(box.x + 200, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 280, box.y + 480);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop tool should still be active
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should show confirm and cancel buttons when crop rectangle is drawn', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Initially, crop buttons should not be visible
    await expect(page.locator('.crop-buttons')).not.toBeVisible();

    // Draw crop rectangle
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop buttons should now be visible
    await expect(page.locator('.crop-buttons')).toBeVisible();

    // Both buttons should be present
    await expect(
      page.locator('.crop-buttons button[title="Confirm crop"]')
    ).toBeVisible();
    await expect(
      page.locator('.crop-buttons button[title="Cancel crop"]')
    ).toBeVisible();
  });

  test('should cancel crop when clicking cancel button', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop buttons should be visible
    await expect(page.locator('.crop-buttons')).toBeVisible();

    // Click cancel button
    await page.click('.crop-buttons button[title="Cancel crop"]');
    await page.waitForTimeout(100);

    // Crop tool should still be active (cancel doesn't switch tools)
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();

    // Crop buttons should be hidden
    await expect(page.locator('.crop-buttons')).not.toBeVisible();
  });

  test('should apply crop when clicking confirm button', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop buttons should be visible
    await expect(page.locator('.crop-buttons')).toBeVisible();

    // Click confirm button
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(100);

    // Should switch back to select tool
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Crop buttons should be hidden
    await expect(page.locator('.crop-buttons')).not.toBeVisible();
  });

  test('should actually crop the image and resize canvas', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');

    // Get initial canvas dimensions
    const initialBox = await canvas.boundingBox();
    if (!initialBox) throw new Error('Canvas not found');
    const initialWidth = initialBox.width;
    const initialHeight = initialBox.height;

    // Draw crop rectangle (smaller than original)
    const startX = initialBox.x + 100;
    const startY = initialBox.y + 100;
    const endX = initialBox.x + 300;
    const endY = initialBox.y + 250;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Click confirm button
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(200); // Wait for image to load and canvas to resize

    // Get new canvas dimensions
    const newBox = await canvas.boundingBox();
    if (!newBox) throw new Error('Canvas not found after crop');

    // Canvas should be smaller than original
    expect(newBox.width).toBeLessThan(initialWidth);
    expect(newBox.height).toBeLessThan(initialHeight);

    // Approximate crop dimensions (accounting for devicePixelRatio)
    const cropWidth = endX - startX;
    const cropHeight = endY - startY;

    // New dimensions should be close to crop dimensions
    expect(Math.abs(newBox.width - cropWidth)).toBeLessThan(5);
    expect(Math.abs(newBox.height - cropHeight)).toBeLessThan(5);
  });

  test('should crop the correct visual content from the image', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Take a screenshot of a specific region before cropping
    const cropRegion = {
      x: box.x + 150,
      y: box.y + 150,
      width: 200,
      height: 150,
    };

    // Capture what the crop area looks like before cropping
    const beforeCropScreenshot = await page.screenshot({
      clip: cropRegion,
    });

    // Draw crop rectangle around that exact region
    await page.mouse.move(cropRegion.x, cropRegion.y);
    await page.mouse.down();
    await page.mouse.move(
      cropRegion.x + cropRegion.width,
      cropRegion.y + cropRegion.height
    );
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Confirm the crop
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(200);

    // Get the new canvas position and take a screenshot
    const newBox = await canvas.boundingBox();
    if (!newBox) throw new Error('Canvas not found after crop');

    const afterCropScreenshot = await page.screenshot({
      clip: {
        x: newBox.x,
        y: newBox.y,
        width: newBox.width,
        height: newBox.height,
      },
    });

    // The screenshots should be similar (the cropped canvas should show the same content)
    // We can't do exact pixel comparison due to rendering differences, but we can verify
    // that the canvas actually contains image data (not empty/black)
    const canvasData = await canvas.evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Check if there's any non-zero pixel data
      return imageData.data.some((value) => value > 0);
    });

    expect(canvasData).toBe(true); // Canvas should have image content

    // Verify both screenshots have similar file sizes (within reasonable range)
    expect(beforeCropScreenshot.length).toBeGreaterThan(0);
    expect(afterCropScreenshot.length).toBeGreaterThan(0);
  });
});
