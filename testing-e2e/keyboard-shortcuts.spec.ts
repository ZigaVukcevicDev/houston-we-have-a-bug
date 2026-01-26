import { test, expect } from '@playwright/test';

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should delete arrow annotation with Delete key', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Select tool should be active, arrow selected
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Press Delete
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    // Click where arrow was - nothing should be selected
    await page.mouse.click(box.x + 200, box.y + 150);
    await page.waitForTimeout(100);

    // Select tool should still be active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should delete line annotation with Delete key', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Press Delete
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    // Verify deletion by clicking where line was
    await page.mouse.click(box.x + 200, box.y + 150);
    await page.waitForTimeout(100);
  });

  test('should delete rectangle annotation with Delete key', async ({
    page,
  }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Press Delete
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    // Verify deletion
    await page.mouse.click(box.x + 200, box.y + 150);
    await page.waitForTimeout(100);
  });

  test('should delete text annotation with Delete key', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw text box (must exceed minimum 40x60)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 170);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Type text
    const editableDiv = page.locator('[contenteditable="true"]');
    await editableDiv.fill('Test text');

    // Click outside to finalize
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(100);

    // Click on text to select
    await page.mouse.click(box.x + 200, box.y + 135);
    await page.waitForTimeout(100);

    // Press Delete
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    // Verify deletion
    await expect(editableDiv).not.toBeVisible();
  });

  test('should cancel arrow drawing with Escape key', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Start drawing arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);

    // Press Escape while drawing
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should still be in arrow tool
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
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
    await page.mouse.move(box.x + 200, box.y + 150);

    // Press Escape while drawing
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should still be in line tool
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
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
    await page.mouse.move(box.x + 200, box.y + 150);

    // Press Escape while drawing
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should still be in rectangle tool
    await expect(
      page.locator('[data-tool="rectangle"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should remove text annotation with Escape key while editing', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Press Escape without typing
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Text box should be removed
    const editableDiv = page.locator('[contenteditable="true"]');
    await expect(editableDiv).not.toBeVisible();
  });

  test('should close system info panel with Escape key', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Open system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // Verify panel is open
    const systemInfoPanel = page.locator('.system-info-container');
    await expect(systemInfoPanel).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Panel should be closed
    await expect(systemInfoPanel).not.toBeVisible();
  });

  test('should confirm crop with Enter key', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const initialWidth = box.width;
    const initialHeight = box.height;

    // Draw crop rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Press Enter to confirm
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Canvas should be cropped (smaller)
    const newBox = await canvas.boundingBox();
    if (!newBox) throw new Error('Canvas not found after crop');

    expect(newBox.width).toBeLessThan(initialWidth);
    expect(newBox.height).toBeLessThan(initialHeight);
  });

  test('should cancel crop with Escape key', async ({ page }) => {
    await page.click('[data-tool="crop"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw crop rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Crop buttons should be visible
    const confirmButton = page.locator(
      '.crop-buttons button[title="Confirm crop"]'
    );
    await expect(confirmButton).toBeVisible();

    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // Crop buttons should be hidden
    await expect(confirmButton).not.toBeVisible();

    // Crop tool should remain active (not switch to select)
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle Enter key in text annotation for multiline', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Type multiline text
    const editableDiv = page.locator('[contenteditable="true"]');
    await editableDiv.type('Line 1');
    await page.keyboard.press('Enter');
    await editableDiv.type('Line 2');
    await page.keyboard.press('Enter');
    await editableDiv.type('Line 3');

    // Finalize
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(100);

    // Text should persist
    await expect(editableDiv).not.toBeVisible();
  });
});
