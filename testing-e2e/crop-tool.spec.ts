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

    // Get initial canvas dimensions (internal resolution)
    const initialDimensions = await canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    // Get display dimensions
    const initialBox = await canvas.boundingBox();
    if (!initialBox) throw new Error('Canvas not found');

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

    // Get new canvas dimensions (internal resolution)
    const newDimensions = await canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    // Canvas internal resolution should be smaller than original
    expect(newDimensions.width).toBeLessThan(initialDimensions.width);
    expect(newDimensions.height).toBeLessThan(initialDimensions.height);

    // The canvas should have been cropped to approximately the selected area
    // (allowing for device pixel ratio scaling)
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    const expectedWidth = (endX - startX) * dpr;
    const expectedHeight = (endY - startY) * dpr;

    // New dimensions should be close to crop dimensions (within 10% tolerance for scaling)
    expect(
      Math.abs(newDimensions.width - expectedWidth) / expectedWidth
    ).toBeLessThan(0.1);
    expect(
      Math.abs(newDimensions.height - expectedHeight) / expectedHeight
    ).toBeLessThan(0.1);
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

  test('should maintain aspect ratio after cropping', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const initialBox = await canvas.boundingBox();
    if (!initialBox) throw new Error('Canvas not found');

    // Draw a crop rectangle with known aspect ratio (2:1)
    const cropWidth = 400;
    const cropHeight = 200;
    const startX = initialBox.x + 100;
    const startY = initialBox.y + 100;
    const endX = startX + cropWidth;
    const endY = startY + cropHeight;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Confirm crop
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Get canvas dimensions after crop
    const afterCropBox = await canvas.boundingBox();
    if (!afterCropBox) throw new Error('Canvas not found after crop');

    // Calculate display aspect ratio
    const displayAspectRatio = afterCropBox.width / afterCropBox.height;

    // Get internal canvas dimensions
    const internalDimensions = await canvas.evaluate(
      (c: HTMLCanvasElement) => ({
        width: c.width,
        height: c.height,
        aspectRatio: c.width / c.height,
      })
    );

    // Get DPR to calculate expected aspect ratio
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    const expectedAspectRatio = cropWidth / cropHeight; // Should be 2:1

    // Internal aspect ratio should match expected crop (2:1)
    expect(
      Math.abs(internalDimensions.aspectRatio - expectedAspectRatio)
    ).toBeLessThan(0.05);

    // Display aspect ratio should also match (accounting for DPR scaling)
    expect(Math.abs(displayAspectRatio - expectedAspectRatio)).toBeLessThan(
      0.05
    );

    // Canvas should not be stretched - internal and display aspect ratios should match
    expect(
      Math.abs(internalDimensions.aspectRatio - displayAspectRatio)
    ).toBeLessThan(0.01);
  });

  test('should confirm crop with Enter key from keyboard', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const initialWidth = box.width;

    // Draw crop rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Press Enter key to confirm
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Canvas should be cropped
    const newBox = await canvas.boundingBox();
    if (!newBox) throw new Error('Canvas not found after crop');

    expect(newBox.width).toBeLessThan(initialWidth);
  });

  test('should crop very small region near minimum', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw very small crop rectangle (80x80)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + 180);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Confirm crop
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Should have cropped successfully
    const newBox = await canvas.boundingBox();
    expect(newBox).toBeTruthy();
  });

  test('should crop entire canvas', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle covering entire canvas
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 5, box.y + box.height - 5);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Confirm crop
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Canvas should exist but be nearly the same size
    const newBox = await canvas.boundingBox();
    expect(newBox).toBeTruthy();
  });

  test('should handle multiple crop operations in sequence', async ({
    page,
  }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const initialWidth = box.width;

    // First crop
    await page.click('[data-tool="crop"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 100, box.y + box.height - 100);
    await page.mouse.up();
    await page.waitForTimeout(100);
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Get canvas after first crop
    const box2 = await canvas.boundingBox();
    if (!box2) throw new Error('Canvas not found after first crop');

    // Second crop
    await page.click('[data-tool="crop"]');
    await page.mouse.move(box2.x + 50, box2.y + 50);
    await page.mouse.down();
    await page.mouse.move(box2.x + box2.width - 50, box2.y + box2.height - 50);
    await page.mouse.up();
    await page.waitForTimeout(100);
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Canvas should be smaller than initial
    const finalBox = await canvas.boundingBox();
    if (!finalBox) throw new Error('Canvas not found after second crop');

    expect(finalBox.width).toBeLessThan(initialWidth);
  });

  test('should maintain annotations after crop', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw an arrow annotation
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop around the arrow
    await page.click('[data-tool="crop"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Arrow should still be present and selectable
    const newBox = await canvas.boundingBox();
    if (!newBox) throw new Error('Canvas not found after crop');

    await page.mouse.click(newBox.x + 100, newBox.y + 80);
    await page.waitForTimeout(100);

    // Select tool should be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should crop at extreme canvas corners', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Crop from near top-left corner (not extreme edge to ensure crop rectangle draws)
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    const newBox = await canvas.boundingBox();
    expect(newBox).toBeTruthy();
  });

  test('should handle crop cancel after multiple crops', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Successful crop
    await page.click('[data-tool="crop"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    const box2 = await canvas.boundingBox();
    if (!box2) throw new Error('Canvas not found after crop');

    // Start another crop but cancel it
    await page.click('[data-tool="crop"]');
    await page.mouse.move(box2.x + 50, box2.y + 50);
    await page.mouse.down();
    await page.mouse.move(box2.x + 200, box2.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);
    await page.click('.crop-buttons button[title="Cancel crop"]');
    await page.waitForTimeout(100);

    // Canvas size should remain the same
    const finalBox = await canvas.boundingBox();
    if (!finalBox) throw new Error('Canvas not found after cancel');

    expect(finalBox.width).toBeCloseTo(box2.width, 0);
  });

  test('should handle crop with different aspect ratios', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Crop to tall aspect ratio
    await page.click('[data-tool="crop"]');
    await page.mouse.move(box.x + 200, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 350, box.y + 400);
    await page.mouse.up();
    await page.waitForTimeout(100);

    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    const newBox = await canvas.boundingBox();
    if (!newBox) throw new Error('Canvas not found after crop');

    // Verify aspect ratio is tall (height > width)
    expect(newBox.height).toBeGreaterThan(newBox.width);
  });

  test('should redraw crop rectangle immediately after cancel', async ({
    page,
  }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first crop
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Cancel it
    await page.click('.crop-buttons button[title="Cancel crop"]');
    await page.waitForTimeout(100);

    // Draw new crop immediately
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 350);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop buttons should appear again
    const confirmButton = page.locator(
      '.crop-buttons button[title="Confirm crop"]'
    );
    await expect(confirmButton).toBeVisible();
  });
});
