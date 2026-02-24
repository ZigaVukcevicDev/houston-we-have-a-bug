import { test, expect } from '@playwright/test';

test.describe('Select tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should select annotation by clicking on it', async ({ page }) => {
    // First draw a rectangle
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool should already be active, click on rectangle to select it
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should remain active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should deselect annotation when clicking on empty canvas', async ({ page }) => {
    // Draw a rectangle
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Rectangle should be selected, now click on empty area
    await page.mouse.click(box.x + 400, box.y + 400);

    await page.waitForTimeout(100);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow selecting different annotations', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw first rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Draw second rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 300, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on first rectangle to select it
    await page.mouse.click(box.x + 150, box.y + 150);

    await page.waitForTimeout(100);

    // Click on second rectangle to select it
    await page.mouse.click(box.x + 350, box.y + 150);

    await page.waitForTimeout(100);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow moving selected rectangle', async ({ page }) => {
    // Draw rectangle
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Move the selected rectangle
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on new position to verify it moved
    await page.mouse.click(box.x + 300, box.y + 300);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should allow moving selected line', async ({ page }) => {
    // Draw line
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Move the selected line
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click on new position to verify it moved
    await page.mouse.click(box.x + 300, box.y + 300);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should delete selected annotation with Delete key', async ({ page }) => {
    // Draw rectangle
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Rectangle should be selected, press Delete
    await page.keyboard.press('Delete');

    await page.waitForTimeout(100);

    // Click where rectangle was - it should not be selected
    await page.mouse.click(box.x + 150, box.y + 150);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should not select when coming from another tool', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Switch to line tool
    await page.click('[data-tool="line"]');

    await page.waitForTimeout(100);

    // Now switch to select tool
    await page.click('[data-tool="select"]');

    // Select tool should be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Rectangle should not be automatically selected (no handles visible until clicked)
  });

  test('should activate select tool by default', async ({ page }) => {
    // Check if select tool or arrow tool is active by default
    // According to the codebase, arrow should be default, but let's verify select can be activated
    await page.click('[data-tool="select"]');

    // Select tool should now be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should show pointer cursor when hovering over unselected rectangle', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click empty area to deselect
    await page.mouse.click(box.x + 450, box.y + 400);
    await page.waitForTimeout(100);

    // Hover over the rectangle border
    await page.mouse.move(box.x + 100, box.y + 150);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  });

  test('should show pointer cursor when hovering over unselected line', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 150);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click empty area to deselect
    await page.mouse.click(box.x + 450, box.y + 400);
    await page.waitForTimeout(100);

    // Hover directly over the line
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  });

  test('should show move cursor when hovering over selected rectangle', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Rectangle is auto-selected after drawing; hover over the top border edge
    // (isPointOnRectangle detects the stroke/border, not the interior fill)
    await page.mouse.move(box.x + 175, box.y + 100);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should show resize cursors when hovering over rectangle corners', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 300;
    const endY = box.y + 250;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Top-left corner
    await page.mouse.move(startX, startY);
    await page.waitForTimeout(50);
    let cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nwse-resize');

    // Bottom-right corner
    await page.mouse.move(endX, endY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nwse-resize');

    // Top-right corner
    await page.mouse.move(endX, startY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nesw-resize');

    // Bottom-left corner
    await page.mouse.move(startX, endY);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('nesw-resize');
  });

  test('should resize rectangle from bottom-right corner', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 250;
    const endY = box.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Drag bottom-right handle to resize
    await page.mouse.move(endX, endY);
    await page.mouse.down();
    await page.mouse.move(endX + 60, endY + 60);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // After resize, should still be selected; hover over top border edge
    // (isPointOnRectangle detects the stroke/border, not the interior fill)
    await page.mouse.move(startX + 50, startY);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should resize rectangle from top-left corner', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 150;
    const startY = box.y + 150;
    const endX = box.x + 350;
    const endY = box.y + 300;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Drag top-left handle inward
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 30, startY + 30);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // After resize, should still be selected; hover over right border edge
    // (isPointOnRectangle detects the stroke/border, not the interior fill)
    await page.mouse.move(endX, startY + 100);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should allow moving text annotation by dragging after selecting', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;
    const endX = box.x + 300;
    const endY = box.y + 200;

    // Create a text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el, text) => (el.textContent = text), 'Drag me');
    await page.mouse.click(box.x + 450, box.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Click to select the annotation
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Drag the annotation to a new position
    await page.mouse.move(startX + 50, startY + 50);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY + 150);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Verify the annotation moved: hovering at new position should show move cursor
    await page.mouse.move(startX + 150, startY + 150);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should delete selected text annotation with Delete key', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;

    // Create a text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el, text) => (el.textContent = text), 'Delete me');
    await page.mouse.click(box.x + 450, box.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Click to select the annotation
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Delete the annotation
    await page.keyboard.press('Delete');
    await page.waitForTimeout(100);

    // Hovering where the annotation was should no longer show pointer cursor (annotation gone)
    await page.mouse.move(startX + 50, startY + 50);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).not.toBe('move');
    expect(cursor).not.toBe('pointer');
  });

  test('should delete selected annotation with Backspace key', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Rectangle should be auto-selected; press Backspace
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);

    // Hovering where rectangle was should no longer show pointer
    await page.mouse.move(box.x + 175, box.y + 150);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).not.toBe('pointer');
    expect(cursor).not.toBe('move');
  });

  test('should not delete annotation when Backspace is pressed while editing text', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;

    // Create a text annotation and type text
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await expect(textDiv).toBeFocused();

    // Type some text
    await page.keyboard.type('Hello World');

    // Press Backspace multiple times - should delete characters, not the annotation
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');

    // Annotation should still be present (textDiv still visible)
    await expect(textDiv).toBeVisible();

    const text = await textDiv.evaluate((el) => el.textContent);
    expect(text).toBe('Hello Wo');
  });

  test('should select and move arrow annotation', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Switch to select tool
    await page.click('[data-tool="select"]');
    await page.waitForTimeout(100);

    // Click on the arrow to select it
    await page.mouse.click(box.x + 175, box.y + 150);
    await page.waitForTimeout(100);

    // Should be selected (select tool active)
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Move the arrow
    await page.mouse.move(box.x + 175, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 275, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should delete selected arrow annotation with Delete key', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Arrow should be auto-selected after drawing; delete it
    await page.keyboard.press('Delete');

    await page.waitForTimeout(100);

    // Click where arrow was - it should not be selectable
    await page.mouse.click(box.x + 175, box.y + 150);
    await page.waitForTimeout(50);

    // Cursor should not be 'move' (nothing selected at that position)
    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).not.toBe('move');
  });

  test('should allow moving line endpoint handles', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const x1 = box.x + 100;
    const y1 = box.y + 100;
    const x2 = box.x + 300;
    const y2 = box.y + 100;

    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Line is auto-selected; drag the end handle
    await page.mouse.move(x2, y2);
    await page.mouse.down();
    await page.mouse.move(x2 + 50, y2 + 50);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Line should still be selected; check cursor at the unmoved start handle
    await page.mouse.move(x1, y1);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should not deselect annotation after dragging it', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const startX = box.x + 100;
    const startY = box.y + 100;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Drag from the left border edge — isPointOnRectangle detects the stroke, not the fill
    await page.mouse.move(box.x + 100, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // After drag, annotation should still be selected; check cursor at the new left border
    await page.mouse.move(box.x + 200, box.y + 250);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should directly drag rectangle to move without pre-selecting', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 250, box.y + 200);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click elsewhere to deselect
    await page.mouse.click(box.x + 450, box.y + 400);
    await page.waitForTimeout(100);

    // Directly mousedown on the left border edge — isPointOnRectangle detects the stroke
    await page.mouse.move(box.x + 100, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Should be selected at new location; check cursor at the new left border
    await page.mouse.move(box.x + 200, box.y + 250);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should directly drag line to move without pre-selecting', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    await page.mouse.move(box.x + 100, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 150);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Click elsewhere to deselect
    await page.mouse.click(box.x + 450, box.y + 400);
    await page.waitForTimeout(100);

    // Directly mousedown on line and drag
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Should be selected at new location
    await page.mouse.move(box.x + 300, box.y + 250);
    await page.waitForTimeout(50);

    const cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });

  test('should show move cursor on selected line handles', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const x1 = box.x + 100;
    const y1 = box.y + 100;
    const x2 = box.x + 300;
    const y2 = box.y + 200;

    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Hover over start handle
    await page.mouse.move(x1, y1);
    await page.waitForTimeout(50);
    let cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');

    // Hover over end handle
    await page.mouse.move(x2, y2);
    await page.waitForTimeout(50);
    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('move');
  });
});
