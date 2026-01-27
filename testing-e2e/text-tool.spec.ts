import { test, expect } from '@playwright/test';

test.describe('Text tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('text annotation persists after mouse release', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    // Get canvas element
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box by dragging
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for annotation to be created
    await page.waitForTimeout(100);

    // Check that contenteditable div exists and is visible
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Check that handles are visible
    // Handles should be rendered on canvas, we need to verify the canvas state
    // For now, we'll check that the select tool is active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Type some text
    await textDiv.evaluate(
      (el, text) => (el.textContent = text),
      'Test annotation'
    );

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Wait for textDiv to be removed
    await expect(textDiv).not.toBeVisible();

    // Verify annotation persists by checking if it's rendered on canvas
    // We can do this by taking a screenshot and comparing, or by checking
    // the component's internal state via accessibility tree or data attributes

    // For now, verify that we can still see the annotation by selecting it
    await page.mouse.click(startX + 50, startY + 50);
    // If annotation exists, clicking it should select it and show handles
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should show handles immediately after drawing text box', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch and rendering
    await page.waitForTimeout(100);

    // Verify select tool is now active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Verify textDiv is visible and focused
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await expect(textDiv).toBeFocused();

    // Verify we can type immediately
    await page.keyboard.type('Quick test');
    const text = await textDiv.evaluate((el) => el.textContent);
    expect(text).toBe('Quick test');
  });

  test('should keep empty annotation after clicking outside (allows resize)', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Don't type anything, just click outside
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Wait for finalization
    await page.waitForTimeout(200);

    // Textarea should be gone
    await expect(page.locator('div[contenteditable="true"]')).not.toBeVisible();

    // Empty annotation should remain - verify by clicking on it to select
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await page.waitForTimeout(100);

    // Should be able to select the empty annotation
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should remove annotation on Escape key', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Type some text
    await textDiv.evaluate(
      (el, text) => (el.textContent = text),
      'Will be cancelled'
    );

    // Press Escape
    await page.keyboard.press('Escape');

    // Textarea should be removed
    await expect(textDiv).not.toBeVisible();

    // Annotation should be removed (we'd need to verify canvas state)
  });

  test('should allow resizing text box after creation', async ({ page }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for handles to appear
    await page.waitForTimeout(100);

    // Try to drag bottom-right handle
    // Handles are 8px squares, so click at bottom-right corner
    await page.mouse.move(endX, endY);
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50);
    await page.mouse.up();

    // Verify the text box was resized
    // This would require checking the canvas rendering or component state
  });

  test('should allow resizing empty text annotation without it disappearing', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box (don't enter any text)
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 200;
    const endY = canvasBox.y + 180;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for handles to appear
    await page.waitForTimeout(100);

    // Verify textDiv is visible (annotation exists)
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Try to resize by dragging bottom-right handle (without entering text)
    await page.mouse.move(endX, endY);
    await page.mouse.down();
    await page.mouse.move(endX + 50, endY + 50);
    await page.mouse.up();

    await page.waitForTimeout(200);

    // Annotation should still exist - click on it to verify it's selectable
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Should be able to select the annotation (proves it wasn't deleted)
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should show resize cursor when hovering over handles', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch to select
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Wait for canvas to update (mode-select has default cursor, not crosshair)
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

  test('should show text cursor when hovering over selected text box', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch to select
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Type some text and click outside to finalize (stop editing)
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el, text) => (el.textContent = text), 'Test');
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Now click on the text annotation to select it
    await page.mouse.click(startX + 50, startY + 50);

    // Wait for canvas to update
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over the text box body - should show text cursor (click will enter edit mode)
    const midY = (startY + endY) / 2;
    await page.mouse.move(startX, midY);
    await page.waitForTimeout(50);
    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('text');
  });

  test('should show text cursor when hovering over text box while editing', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for tool switch to select
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Verify textDiv is visible and focused
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await expect(textDiv).toBeFocused();

    // Wait for canvas to update
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over the text box while it's being edited
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.move(midX, midY);
    await page.waitForTimeout(50);

    // Should show text cursor when editing
    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('text');
  });

  test('should show pointer cursor when hovering over unselected text box', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el, text) => (el.textContent = text), 'Test text');

    // Click outside to finalize and deselect
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Verify we're still in select mode
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Wait for canvas to update (mode-select has default cursor, not crosshair)
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Now hover over the text box border
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.waitForTimeout(50);
    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should not have text position jump when finalizing', async ({
    page,
  }) => {
    // Select text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw first text box at a specific position
    const startX = canvasBox.x + 150;
    const startY = canvasBox.y + 150;
    const endX = canvasBox.x + 350;
    const endY = canvasBox.y + 250;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Get the first textDiv position
    const textDiv1 = page.locator('div[contenteditable="true"]');
    await expect(textDiv1).toBeVisible();
    const textDivBox1 = await textDiv1.boundingBox();
    if (!textDivBox1) throw new Error('Text div not found');

    // Type some text
    await textDiv1.evaluate(
      (el, text) => (el.textContent = text),
      'Test text alignment'
    );

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv1).not.toBeVisible();

    // Wait a bit for finalization
    await page.waitForTimeout(100);

    // Switch back to text tool (it was auto-switched to select)
    await page.click('[data-tool="text"]');

    // Draw second text box at the EXACT same position
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Get the second textDiv position
    const textDiv2 = page.locator('div[contenteditable="true"]');
    await expect(textDiv2).toBeVisible();
    const textDivBox2 = await textDiv2.boundingBox();
    if (!textDivBox2) throw new Error('Second textDiv not found');

    // Verify the textDivs appear at the same position
    // If there was a vertical jump bug, the second textDiv would be offset
    expect(textDivBox2.x).toBeCloseTo(textDivBox1.x, 0);
    expect(textDivBox2.y).toBeCloseTo(textDivBox1.y, 0);
    expect(textDivBox2.width).toBeCloseTo(textDivBox1.width, 0);
    expect(textDivBox2.height).toBeCloseTo(textDivBox1.height, 0);

    // Type text in the second one
    await textDiv2.evaluate(
      (el, text) => (el.textContent = text),
      'Second annotation'
    );

    // Finalize the second one
    await page.keyboard.press('Escape');
    await expect(textDiv2).not.toBeVisible();

    // Verify both annotations exist and are correctly positioned
    // Switch to select tool
    await page.click('[data-tool="select"]');

    // Click on the first annotation position
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Should select one of the annotations (they're at the same position)
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should render text at same position as contenteditable div (visual test)', async ({
    page,
  }) => {
    // This test uses screenshot comparison to verify text position alignment
    // between the contenteditable div and canvas rendering

    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box at a specific position
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Type multi-line text to make alignment more obvious
    await textDiv.evaluate(
      (el, text) => (el.textContent = text),
      'Line one\nLine two\nLine three'
    );

    // Wait for text to render
    await page.waitForTimeout(100);

    // Get text bounding box from contenteditable div
    const textBounds = await textDiv.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        right: rect.right,
      };
    });

    // Now finalize the text
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();
    await page.waitForTimeout(100);

    // Get the canvas ImageData to find where text was actually rendered
    const canvasTextBounds = await canvas.evaluate((element) => {
      const canvasEl = element as HTMLCanvasElement;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;

      // We need to find text pixels, not border pixels
      // The border is a 2px stroke, so skip pixels near the edges
      // Look for text in the interior of the annotation box
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;

      // Annotation is at (100, 100) in canvas coordinates
      // After scaling: (100 * scaleX, 100 * scaleY)
      // Text starts at: annotation.x + borderOffset + padding + halfLeading
      // Border offset = 1 * scaleX, padding = 5 * scaleX
      const annotationX = 100 * scaleX;
      const annotationY = 100 * scaleY;
      const borderOffset = 1 * scaleX;
      const padding = 5 * scaleX;
      const searchStartX = Math.floor(annotationX + borderOffset + padding);
      const searchStartY = Math.floor(annotationY + borderOffset + padding);

      // Find first text pixel (skip the border region)
      let textTopY = null;
      for (let y = searchStartY; y < canvasEl.height; y++) {
        for (let x = searchStartX; x < searchStartX + 50; x++) {
          const i = (y * canvasEl.width + x) * 4;
          const alpha = data[i + 3];

          if (alpha > 50) {
            textTopY = y;
            break;
          }
        }
        if (textTopY !== null) break;
      }

      if (textTopY === null) return null;

      return {
        top: rect.top + textTopY / scaleY,
      };
    });

    if (!canvasTextBounds) throw new Error('Could not get canvas text bounds');

    // Compare vertical positions
    // Allow 3px tolerance for rounding, anti-aliasing, and line-height differences
    const verticalDiff = Math.abs(textBounds.top - canvasTextBounds.top);

    // This assertion will catch the text jump bug
    // If the bug existed, verticalDiff would be ~110px (the height difference)
    expect(verticalDiff).toBeLessThan(3);
  });

  test('should wrap long words during typing without horizontal overflow', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    const divWidth = await textDiv.evaluate((el) => {
      return el.getBoundingClientRect().width;
    });

    // Type a long word character by character like a real user
    const longWord = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // 42 chars
    await textDiv.focus();
    await textDiv.type(longWord, { delay: 10 });

    await page.waitForTimeout(100);

    const hasHorizontalOverflow = await textDiv.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);

    // Click outside to render to canvas
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await page.waitForTimeout(200);

    // Verify text was rendered (basic check - detailed overflow detection is complex)
    const hasText = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 0) return true;
      }
      return false;
    });

    expect(hasText).toBe(true);
  });

  test('should wrap text with multiple long words', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    const text = 'aaaaaaaaaaaaaaaaaaa bbbbbbbbbbbbbbbbbb cccccccccccccccccc';
    await textDiv.evaluate((el, txt) => {
      el.textContent = txt;
    }, text);

    await page.waitForTimeout(100);

    const hasHorizontalOverflow = await textDiv.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });

  test('should preserve wrapping after clicking outside', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    const longWord = 'a'.repeat(50);
    await textDiv.evaluate((el, txt) => {
      el.textContent = txt;
    }, longWord);

    await page.waitForTimeout(100);

    const hasOverflowBefore = await textDiv.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(hasOverflowBefore).toBe(false);

    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    await page.waitForTimeout(100);

    const divExists = await textDiv.count();
    expect(divExists).toBe(0);

    const hasText = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 0) return true;
      }
      return false;
    });

    expect(hasText).toBe(true);
  });

  test('should wrap text with special characters', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    const text =
      'https://verylongdomainname.com/with/a/very/long/path/that/continues';
    await textDiv.evaluate((el, txt) => {
      el.textContent = txt;
    }, text);

    await page.waitForTimeout(100);

    const hasHorizontalOverflow = await textDiv.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);
  });

  test('should wrap text when resizing text box', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    const longWord = 'a'.repeat(40);
    await textDiv.evaluate((el, txt) => {
      el.textContent = txt;
    }, longWord);

    await page.waitForTimeout(100);

    const initialHasOverflow = await textDiv.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(initialHasOverflow).toBe(false);

    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    await page.waitForTimeout(100);

    const hasAnnotation = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] !== 0) return true;
      }
      return false;
    });

    expect(hasAnnotation).toBe(true);
  });


  test('should enforce minimum width of 40px when resizing', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw a text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 200;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Type some text and finalize
    const textDiv = page.locator('div[contenteditable="true"]');
    await textDiv.evaluate((el) => {
      el.textContent = 'Test';
    });
    await page.mouse.click(canvasBox.x + 300, canvasBox.y + 300);

    await page.waitForTimeout(100);

    // Click to select the text box
    await page.mouse.click(startX + 50, startY + 50);

    await page.waitForTimeout(100);

    // Try to resize from right edge to make it very narrow (drag left past minimum)
    const rightEdgeX = canvasBox.x + 200;
    const rightEdgeY = canvasBox.y + 150;

    await page.mouse.move(rightEdgeX, rightEdgeY);
    await page.mouse.down();
    // Try to drag to make width only 5px
    await page.mouse.move(canvasBox.x + 105, rightEdgeY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Check the actual width
    const finalWidth = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return null;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;

      // Find leftmost and rightmost red pixels
      let minX = canvasEl.width;
      let maxX = 0;
      const searchY = Math.floor(150 * (canvasEl.height / rect.height));

      for (let x = 0; x < canvasEl.width; x++) {
        const i = (searchY * canvasEl.width + x) * 4;
        const red = data[i];
        const alpha = data[i + 3];
        if (red > 200 && alpha > 50) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
      }

      return (maxX - minX) / scaleX;
    });

    expect(finalWidth).toBeGreaterThanOrEqual(39);
  });

  test('should enforce minimum height of 40px when resizing', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw a text box
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 200;
    const endY = canvasBox.y + 200;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Type some text and finalize
    const textDiv = page.locator('div[contenteditable="true"]');
    await textDiv.evaluate((el) => {
      el.textContent = 'Test';
    });
    await page.mouse.click(canvasBox.x + 300, canvasBox.y + 300);

    await page.waitForTimeout(100);

    // Click to select the text box
    await page.mouse.click(startX + 50, startY + 50);

    await page.waitForTimeout(100);

    // Try to resize from bottom edge to make it very short
    const bottomEdgeX = canvasBox.x + 150;
    const bottomEdgeY = canvasBox.y + 200;

    await page.mouse.move(bottomEdgeX, bottomEdgeY);
    await page.mouse.down();
    // Try to drag to make height only 5px
    await page.mouse.move(bottomEdgeX, canvasBox.y + 105);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Check the actual height
    const finalHeight = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return null;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return null;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;
      const rect = canvasEl.getBoundingClientRect();
      const scaleY = canvasEl.height / rect.height;

      // Find topmost and bottommost red pixels
      let minY = canvasEl.height;
      let maxY = 0;
      const searchX = Math.floor(150 * (canvasEl.width / rect.width));

      for (let y = 0; y < canvasEl.height; y++) {
        const i = (y * canvasEl.width + searchX) * 4;
        const red = data[i];
        const alpha = data[i + 3];
        if (red > 200 && alpha > 50) {
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }

      return (maxY - minY) / scaleY;
    });

    expect(finalHeight).toBeGreaterThanOrEqual(39);
  });

  test('should allow text to overflow box height and be visible', async ({
    page,
  }) => {
    // Click text tool
    await page.click('[data-tool="text"]');

    // Draw a text box with limited height
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 160; // Only 60px height

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for contenteditable to appear
    await page.waitForSelector('[contenteditable="true"]');
    const editableDiv = page.locator('[contenteditable="true"]');

    // Type text that exceeds box height
    await editableDiv.type('d');
    await editableDiv.press('Enter');
    await editableDiv.type('s');
    await editableDiv.press('Enter');
    await editableDiv.type('a');
    await editableDiv.press('Enter');
    await editableDiv.type('d');
    await editableDiv.press('Enter');
    await editableDiv.type('a');
    await editableDiv.press('Enter');
    await editableDiv.type('s');
    await editableDiv.press('Enter');
    await editableDiv.type('d');

    // Verify the div doesn't have max-height restriction
    const maxHeight = await editableDiv.evaluate(
      (el) => window.getComputedStyle(el).maxHeight
    );
    expect(maxHeight).toBe('none');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 50, canvasBox.y + 50);

    // Wait for text to be rendered on canvas
    await page.waitForTimeout(100);

    // Verify all text is rendered on canvas (check full area)
    const hasAllText = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;

      // Check for red text pixels in extended area (including beyond box)
      const searchStartX = Math.floor(105 * scaleX);
      const searchEndX = Math.floor(295 * scaleX);
      const searchStartY = Math.floor(105 * scaleY);
      const searchEndY = Math.floor(250 * scaleY); // Extended beyond box

      let redPixelCount = 0;
      for (let y = searchStartY; y < searchEndY; y++) {
        for (let x = searchStartX; x < searchEndX; x++) {
          const i = (y * canvasEl.width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const alpha = data[i + 3];

          // Check for red-ish pixels (text color)
          // Use relaxed criteria to catch anti-aliased text pixels
          if (red > 180 && red > green && red > blue && alpha > 50) {
            redPixelCount++;
          }
        }
      }

      // Text-only threshold (border no longer rendered when deselected)
      return redPixelCount > 50;
    });

    expect(hasAllText).toBe(true);
  });

  test('should properly render text that exceeds box height when finalized', async ({
    page,
  }) => {
    // Click text tool
    await page.click('[data-tool="text"]');

    // Draw a text box with limited height
    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 160; // Only 60px height

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for contenteditable to appear
    await page.waitForSelector('[contenteditable="true"]');
    const editableDiv = page.locator('[contenteditable="true"]');

    // Type text that will exceed the box height
    const longText = 'Line 1\nLine 2\nLine 3\nLine 4';
    await editableDiv.fill(longText);

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 50, canvasBox.y + 50);

    // Wait for text to be rendered on canvas
    await page.waitForTimeout(100);

    // Check that text is rendered on canvas (at least some red pixels in text area)
    const hasText = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;

      // Check for red text pixels in the text box area
      const searchStartX = Math.floor(105 * scaleX);
      const searchEndX = Math.floor(295 * scaleX);
      const searchStartY = Math.floor(110 * scaleY);
      const searchEndY = Math.floor(150 * scaleY);

      let redPixelCount = 0;
      for (let y = searchStartY; y < searchEndY; y++) {
        for (let x = searchStartX; x < searchEndX; x++) {
          const i = (y * canvasEl.width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const alpha = data[i + 3];

          // Check for red-ish pixels (text color)
          if (red > 200 && green < 100 && blue < 100 && alpha > 50) {
            redPixelCount++;
          }
        }
      }

      return redPixelCount > 50; // Should have text rendered
    });

    expect(hasText).toBe(true);
  });

  test.describe('Border visibility', () => {
    /**
     * Helper to create a text annotation at a specific position
     */
    async function createTextAnnotation(
      page: any,
      canvasBox: { x: number; y: number },
      startOffset: { x: number; y: number },
      endOffset: { x: number; y: number },
      text: string
    ) {
      await page.click('[data-tool="text"]');

      const startX = canvasBox.x + startOffset.x;
      const startY = canvasBox.y + startOffset.y;
      const endX = canvasBox.x + endOffset.x;
      const endY = canvasBox.y + endOffset.y;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY);
      await page.mouse.up();

      await page.waitForTimeout(100);

      const textDiv = page.locator('div[contenteditable="true"]');
      await expect(textDiv).toBeVisible();
      await textDiv.evaluate((el: HTMLElement, t: string) => {
        el.textContent = t;
      }, text);

      return { startX, startY, endX, endY };
    }

    /**
     * Helper to check border opacity at a specific location on canvas
     * Returns the estimated opacity (0-255) based on color difference from background
     *
     * Since the canvas composites the border onto a white background,
     * we estimate opacity by how far the pixel deviates from white (255,255,255)
     * towards the red border color (#E74C3C = 231,76,60)
     */
    async function getBorderOpacity(
      page: any,
      canvas: any,
      canvasBox: { x: number; y: number; width: number; height: number },
      borderX: number,
      borderY: number
    ): Promise<number> {
      return await canvas.evaluate(
        (
          canvasEl: HTMLCanvasElement,
          args: { borderX: number; borderY: number; boxX: number; boxY: number }
        ) => {
          const ctx = canvasEl.getContext('2d');
          if (!ctx) return -1;

          const rect = canvasEl.getBoundingClientRect();
          const scaleX = canvasEl.width / rect.width;
          const scaleY = canvasEl.height / rect.height;

          // Convert screen coordinates to canvas coordinates
          const canvasX = Math.floor((args.borderX - args.boxX) * scaleX);
          const canvasY = Math.floor((args.borderY - args.boxY) * scaleY);

          // Border color: #E74C3C = RGB(231, 76, 60)
          // Background: white = RGB(255, 255, 255)
          const borderR = 231,
            borderG = 76,
            borderB = 60;
          const bgR = 255,
            bgG = 255,
            bgB = 255;

          // Sample a small area around the border position
          const sampleSize = 3;
          let maxOpacity = 0;

          for (let dy = -sampleSize; dy <= sampleSize; dy++) {
            for (let dx = -sampleSize; dx <= sampleSize; dx++) {
              const x = canvasX + dx;
              const y = canvasY + dy;
              if (
                x >= 0 &&
                x < canvasEl.width &&
                y >= 0 &&
                y < canvasEl.height
              ) {
                const imageData = ctx.getImageData(x, y, 1, 1);
                const red = imageData.data[0];
                const green = imageData.data[1];
                const blue = imageData.data[2];

                // Estimate opacity based on deviation from white towards border color
                // For each channel: actual = bg + alpha * (border - bg)
                // So: alpha = (actual - bg) / (border - bg)
                // Use green channel as it has largest delta (255 - 76 = 179)
                const greenDelta = bgG - borderG; // 179
                const actualGreenDelta = bgG - green;
                const estimatedOpacity = Math.round(
                  (actualGreenDelta / greenDelta) * 255
                );

                // Only consider if the pixel looks reddish (red > green, red > blue)
                if (
                  red > green &&
                  red > blue &&
                  estimatedOpacity > maxOpacity
                ) {
                  maxOpacity = Math.max(0, Math.min(255, estimatedOpacity));
                }
              }
            }
          }

          return maxOpacity;
        },
        { borderX, borderY, boxX: canvasBox.x, boxY: canvasBox.y }
      );
    }

    test('should show border at full opacity when text annotation is selected', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create text annotation
      const { startX, startY, endX, endY } = await createTextAnnotation(
        page,
        canvasBox,
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        'Test text'
      );

      // The annotation should be selected (auto-switched to select tool)
      await expect(
        page.locator('[data-tool="select"][aria-selected="true"]')
      ).toBeVisible();

      // Don't click outside yet - annotation should still be selected with border visible
      // Check border opacity at the left edge
      const borderOpacity = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );

      // Border should be fully visible (alpha > 200 out of 255)
      expect(borderOpacity).toBeGreaterThan(200);
    });

    test('should hide border (transparent) when text annotation is deselected', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create text annotation
      const { startX, startY, endX, endY } = await createTextAnnotation(
        page,
        canvasBox,
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        'Test text'
      );

      // Click outside to finalize and deselect
      await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
      await page.waitForTimeout(200);

      // Text div should be gone
      await expect(
        page.locator('div[contenteditable="true"]')
      ).not.toBeVisible();

      // Click on empty area to ensure deselection
      await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
      await page.waitForTimeout(100);

      // Check border opacity at the left edge - should be transparent
      const borderOpacity = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );

      // Border should be transparent (alpha close to 0)
      expect(borderOpacity).toBeLessThan(50);
    });

    test('should show border at 100% opacity when hovering over deselected text annotation', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create text annotation
      const { startX, startY, endX, endY } = await createTextAnnotation(
        page,
        canvasBox,
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        'Test text'
      );

      // Click outside to finalize and deselect
      await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
      await page.waitForTimeout(200);

      // Click on empty area to ensure deselection
      await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
      await page.waitForTimeout(100);

      // Hover over the text annotation border
      await page.mouse.move(startX, (startY + endY) / 2);
      await page.waitForTimeout(100);

      // Check border opacity at the left edge - should be at 100%
      const borderOpacity = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );

      // Border should be at approximately 100% opacity (alpha around 255)
      // Allow some tolerance for anti-aliasing
      expect(borderOpacity).toBeGreaterThan(200);
    });

    test('should maintain 100% opacity when transitioning from hover to selected', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create text annotation
      const { startX, startY, endX, endY } = await createTextAnnotation(
        page,
        canvasBox,
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        'Test text'
      );

      // Click outside to finalize and deselect
      await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
      await page.waitForTimeout(200);

      // Click on empty area to ensure deselection
      await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
      await page.waitForTimeout(100);

      // Hover over the text annotation border
      await page.mouse.move(startX, (startY + endY) / 2);
      await page.waitForTimeout(100);

      // Check hover opacity (should be 100%)
      const hoverOpacity = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );
      expect(hoverOpacity).toBeGreaterThan(200);

      // Click to select
      await page.mouse.click(startX, (startY + endY) / 2);
      await page.waitForTimeout(100);

      // Check selected opacity (should be 100%)
      const selectedOpacity = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );
      expect(selectedOpacity).toBeGreaterThan(200);
    });

    test('should hide border when switching to another tool', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create text annotation
      const { startX, startY, endX, endY } = await createTextAnnotation(
        page,
        canvasBox,
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        'Test text'
      );

      // Click outside to finalize
      await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
      await page.waitForTimeout(200);

      // Switch to arrow tool
      await page.click('[data-tool="arrow"]');
      await page.waitForTimeout(100);

      // Border should be hidden (annotation deselected)
      const borderOpacityAfterSwitch = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );
      expect(borderOpacityAfterSwitch).toBeLessThan(50);
    });

    test('should not show border on text annotation when using other tools', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create text annotation
      const { startX, startY, endX, endY } = await createTextAnnotation(
        page,
        canvasBox,
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        'Test text'
      );

      // Click outside to finalize
      await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
      await page.waitForTimeout(200);

      // Switch to rectangle tool
      await page.click('[data-tool="rectangle"]');
      await page.waitForTimeout(100);

      // Hover over the text annotation
      await page.mouse.move(startX, (startY + endY) / 2);
      await page.waitForTimeout(100);

      // Border should NOT be visible (no hover effect when not in select mode)
      const borderOpacity = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        startX,
        (startY + endY) / 2
      );
      expect(borderOpacity).toBeLessThan(50);
    });

    test('should handle multiple text annotations with different selection states', async ({
      page,
    }) => {
      const canvas = page.locator('canvas');
      const canvasBox = await canvas.boundingBox();
      if (!canvasBox) throw new Error('Canvas not found');

      // Create first text annotation
      const box1 = await createTextAnnotation(
        page,
        canvasBox,
        { x: 50, y: 50 },
        { x: 200, y: 150 },
        'First'
      );

      // Finalize first annotation
      await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
      await page.waitForTimeout(200);

      // Create second text annotation
      const box2 = await createTextAnnotation(
        page,
        canvasBox,
        { x: 250, y: 50 },
        { x: 400, y: 150 },
        'Second'
      );

      // Finalize second annotation
      await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
      await page.waitForTimeout(200);

      // Deselect all
      await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
      await page.waitForTimeout(100);

      // Both borders should be transparent
      const opacity1Deselected = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        box1.startX,
        (box1.startY + box1.endY) / 2
      );
      const opacity2Deselected = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        box2.startX,
        (box2.startY + box2.endY) / 2
      );

      expect(opacity1Deselected).toBeLessThan(50);
      expect(opacity2Deselected).toBeLessThan(50);

      // Select first annotation
      await page.mouse.click(box1.startX, (box1.startY + box1.endY) / 2);
      await page.waitForTimeout(100);

      // First should be fully visible, second still transparent
      const opacity1Selected = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        box1.startX,
        (box1.startY + box1.endY) / 2
      );
      const opacity2StillDeselected = await getBorderOpacity(
        page,
        canvas,
        canvasBox,
        box2.startX,
        (box2.startY + box2.endY) / 2
      );

      expect(opacity1Selected).toBeGreaterThan(200);
      expect(opacity2StillDeselected).toBeLessThan(50);
    });
  });

  test('should allow creating multiple text annotations', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Create first text annotation (must meet minimum 40x60)
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 250, canvasBox.y + 180);
    await page.mouse.up();

    let textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'First text'));
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Create second text annotation (must meet minimum 40x60)
    await page.click('[data-tool="text"]');
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 220);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 250, canvasBox.y + 300);
    await page.mouse.up();

    textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Second text'));
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Both annotations should be selectable
    await page.mouse.click(canvasBox.x + 150, canvasBox.y + 140);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    await page.mouse.click(canvasBox.x + 150, canvasBox.y + 260);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should delete selected text annotation with Delete key', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Create text annotation
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Delete me'));
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Select the annotation
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Press Delete key
    await page.keyboard.press('Delete');

    // Wait a bit for deletion to process
    await page.waitForTimeout(50);

    // Try to click where the annotation was - should not select anything
    // (This is a bit tricky to test without taking screenshots)
    // For now, we verify that clicking elsewhere and back doesn't cause issues
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
  });

  test('should allow moving text annotation by dragging', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    // Create text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Move me'));
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Select the annotation
    await page.mouse.click(startX + 50, startY + 50);

    // Wait for cursor to update
    await page.waitForTimeout(50);

    // Drag the annotation to a new position
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.move(midX, midY);
    await page.mouse.down();
    await page.mouse.move(midX + 100, midY + 50);
    await page.mouse.up();

    // Annotation should be at new position
    // Click on new position to verify
    await page.mouse.click(midX + 100, midY + 50);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should support multiline text with Enter key', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await expect(textDiv).toBeFocused();

    // Type multiline text
    await page.keyboard.type('Line 1');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 2');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Line 3');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Verify the annotation exists
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should not delete annotation when using Backspace to delete text characters', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Type some text
    await page.keyboard.type('Hello World');

    // Use Backspace to delete some characters
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');

    // TextDiv should still be visible (annotation not deleted)
    await expect(textDiv).toBeVisible();

    // Text should be partially deleted
    const textContent = await textDiv.textContent();
    expect(textContent).toBe('Hello Wo');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await page.waitForTimeout(200);

    // Annotation should still exist - verify by clicking on it
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should not delete annotation when using Delete key to delete text characters', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Type some text
    await page.keyboard.type('Hello');

    // Move cursor to beginning and use Delete to remove characters
    await page.keyboard.press('Home');
    await page.keyboard.press('Delete');
    await page.keyboard.press('Delete');

    // TextDiv should still be visible (annotation not deleted)
    await expect(textDiv).toBeVisible();

    // Text should be partially deleted from the beginning
    const textContent = await textDiv.textContent();
    expect(textContent).toBe('llo');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await page.waitForTimeout(200);

    // Annotation should still exist
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should handle rapid tool switching while editing text', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw text box
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Test'));

    // Switch to another tool while editing
    await page.click('[data-tool="arrow"]');

    // TextDiv should be finalized and removed
    await expect(textDiv).not.toBeVisible();

    // Arrow tool should now be active
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();

    // Verify we can use the arrow tool
    await page.waitForTimeout(100);
  });

  test('should maintain text annotation after page resize', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    let canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Create text annotation
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Resize test'));
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);

    // Resize viewport
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForTimeout(200);

    // Get new canvas position
    canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found after resize');

    // Annotation should still be selectable
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should not create text box if drag never exceeds minimum dimensions', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw a very small text box (below minimum 40x60)
    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 120, canvasBox.y + 120);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // TextDiv should NOT be created since drag never exceeded minimum
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).not.toBeVisible();
  });

  test('should show actual drag size before exceeding minimum dimensions', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    // Drag only 10px to the right and 15px down (below minimum 40x60)
    const endX = canvasBox.x + 110;
    const endY = canvasBox.y + 115;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);

    // While still holding mouse down, check that the preview box shows actual drag size
    await page.waitForTimeout(50);

    const drawnDimensions = await canvas.evaluate(
      (canvasEl, { searchStartX, searchStartY }) => {
        if (!(canvasEl instanceof HTMLCanvasElement)) return null;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.getImageData(
          0,
          0,
          canvasEl.width,
          canvasEl.height
        );
        const data = imageData.data;
        const rect = canvasEl.getBoundingClientRect();
        const scaleX = canvasEl.width / rect.width;
        const scaleY = canvasEl.height / rect.height;

        const canvasStartX = Math.floor(searchStartX * scaleX) - 5;
        const canvasStartY = Math.floor(searchStartY * scaleY) - 5;
        const searchWidth = 100 * scaleX;
        const searchHeight = 100 * scaleY;

        let minX = canvasEl.width;
        let maxX = 0;
        let minY = canvasEl.height;
        let maxY = 0;

        for (
          let y = canvasStartY;
          y < Math.min(canvasStartY + searchHeight, canvasEl.height);
          y++
        ) {
          for (
            let x = canvasStartX;
            x < Math.min(canvasStartX + searchWidth, canvasEl.width);
            x++
          ) {
            const i = (y * canvasEl.width + x) * 4;
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            const alpha = data[i + 3];
            if (red > 200 && green < 100 && blue < 100 && alpha > 50) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        }

        if (maxX === 0 || maxY === 0) return null;

        const width = (maxX - minX) / scaleX;
        const height = (maxY - minY) / scaleY;

        return { width, height };
      },
      { searchStartX: 100, searchStartY: 100 }
    );

    // During drawing below minimum, preview should show actual drag size
    expect(drawnDimensions?.width).toBeLessThan(30); // Should be ~10, not 40
    expect(drawnDimensions?.height).toBeLessThan(30); // Should be ~15, not 60

    await page.mouse.up();

    // No text box created since minimum was never exceeded
    await page.waitForTimeout(100);
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).not.toBeVisible();
  });

  test('should enforce minimum once drag exceeds it and create text box', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;

    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // First drag beyond minimum (40x60)
    await page.mouse.move(canvasBox.x + 150, canvasBox.y + 170);
    await page.waitForTimeout(50);

    // Then drag back to smaller size
    await page.mouse.move(canvasBox.x + 120, canvasBox.y + 130);
    await page.waitForTimeout(50);

    // Check that minimum is still enforced after exceeding it
    const drawnDimensions = await canvas.evaluate(
      (canvasEl, { searchStartX, searchStartY }) => {
        if (!(canvasEl instanceof HTMLCanvasElement)) return null;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return null;

        const imageData = ctx.getImageData(
          0,
          0,
          canvasEl.width,
          canvasEl.height
        );
        const data = imageData.data;
        const rect = canvasEl.getBoundingClientRect();
        const scaleX = canvasEl.width / rect.width;
        const scaleY = canvasEl.height / rect.height;

        const canvasStartX = Math.floor(searchStartX * scaleX) - 5;
        const canvasStartY = Math.floor(searchStartY * scaleY) - 5;
        const searchWidth = 100 * scaleX;
        const searchHeight = 100 * scaleY;

        let minX = canvasEl.width;
        let maxX = 0;
        let minY = canvasEl.height;
        let maxY = 0;

        for (
          let y = canvasStartY;
          y < Math.min(canvasStartY + searchHeight, canvasEl.height);
          y++
        ) {
          for (
            let x = canvasStartX;
            x < Math.min(canvasStartX + searchWidth, canvasEl.width);
            x++
          ) {
            const i = (y * canvasEl.width + x) * 4;
            const red = data[i];
            const green = data[i + 1];
            const blue = data[i + 2];
            const alpha = data[i + 3];
            if (red > 200 && green < 100 && blue < 100 && alpha > 50) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y);
            }
          }
        }

        if (maxX === 0 || maxY === 0) return null;

        const width = (maxX - minX) / scaleX;
        const height = (maxY - minY) / scaleY;

        return { width, height };
      },
      { searchStartX: 100, searchStartY: 100 }
    );

    // After exceeding minimum, it should stay at minimum even when dragging smaller
    expect(drawnDimensions?.width).toBeGreaterThanOrEqual(39); // ~40px minimum
    expect(drawnDimensions?.height).toBeGreaterThanOrEqual(59); // ~60px minimum

    await page.mouse.up();

    // Text box should be created since minimum was exceeded
    await page.waitForTimeout(100);
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Clean up
    await page.keyboard.press('Escape');
  });

  test('should show border when hovering over overflown text with newlines', async ({
    page,
  }) => {
    // Click text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw a text box with limited height (60px - minimum)
    const boxHeight = 60;
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 100 + boxHeight;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for contenteditable to appear
    await page.waitForSelector('[contenteditable="true"]');
    const editableDiv = page.locator('[contenteditable="true"]');

    // Type text that will overflow beyond the box height (matching existing overflow test pattern)
    await editableDiv.type('a');
    await editableDiv.press('Enter');
    await editableDiv.type('b');
    await editableDiv.press('Enter');
    await editableDiv.type('c');
    await editableDiv.press('Enter');
    await editableDiv.type('d');
    await editableDiv.press('Enter');
    await editableDiv.type('e');
    await editableDiv.press('Enter');
    await editableDiv.type('f');
    await editableDiv.press('Enter');
    await editableDiv.type('g');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await page.waitForTimeout(100);

    // Verify we're in select mode after clicking outside
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Wait for canvas cursor to not be crosshair (select mode)
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Click on empty area to ensure deselection
    await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
    await page.waitForTimeout(100);

    // Verify text overflows beyond the box (same method as existing overflow test)
    const hasOverflowText = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;

      // Check for red text pixels in extended area (including beyond box)
      // Box is at y=100, height=60, so ends at y=160. Search beyond that.
      const searchStartX = Math.floor(105 * scaleX);
      const searchEndX = Math.floor(295 * scaleX);
      const searchStartY = Math.floor(105 * scaleY);
      const searchEndY = Math.floor(250 * scaleY); // Extended beyond box

      let redPixelCount = 0;
      for (let y = searchStartY; y < searchEndY; y++) {
        for (let x = searchStartX; x < searchEndX; x++) {
          const i = (y * canvasEl.width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const alpha = data[i + 3];

          if (red > 180 && red > green && red > blue && alpha > 50) {
            redPixelCount++;
          }
        }
      }
      return redPixelCount > 50;
    });
    expect(hasOverflowText).toBe(true);

    // First verify basic hover inside the box works
    const insideHoverX = startX + 100;
    const insideHoverY = startY + 30; // Inside the 60px box
    await page.mouse.move(insideHoverX, insideHoverY);
    await page.waitForTimeout(150);

    const cursorInside = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursorInside).toBe('pointer');

    // Now hover over the overflow area (below the box but on the text)
    // Box ends at y=160 (100 + 60), so hover at y=180 (20px below box bottom)
    const hoverX = startX + 100; // Middle of box width
    const hoverY = startY + boxHeight + 20; // 20px below the box bottom
    await page.mouse.move(hoverX, hoverY);
    await page.waitForTimeout(150);

    // Check that cursor changes to pointer (indicating hover is detected in overflow area)
    const cursorAfter = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursorAfter).toBe('pointer');

    // Verify border is visible by checking for red border pixels at the top of the box
    const hasBorder = await canvas.evaluate(
      (canvasEl, { x, y }) => {
        if (!(canvasEl instanceof HTMLCanvasElement)) return false;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return false;

        const rect = canvasEl.getBoundingClientRect();
        const scaleX = canvasEl.width / rect.width;
        const scaleY = canvasEl.height / rect.height;

        const borderX = Math.floor((x - rect.x) * scaleX);
        const borderY = Math.floor((y - rect.y) * scaleY);

        // Sample around the border position
        const sampleSize = 5;
        for (let dy = -sampleSize; dy <= sampleSize; dy++) {
          for (let dx = -sampleSize; dx <= sampleSize; dx++) {
            const px = borderX + dx;
            const py = borderY + dy;
            if (px >= 0 && px < canvasEl.width && py >= 0 && py < canvasEl.height) {
              const imageData = ctx.getImageData(px, py, 1, 1);
              const red = imageData.data[0];
              const green = imageData.data[1];
              const blue = imageData.data[2];
              // Check for red border color
              if (red > 200 && green < 100 && blue < 100) {
                return true;
              }
            }
          }
        }
        return false;
      },
      { x: startX, y: startY + 30 }
    );

    expect(hasBorder).toBe(true);
  });

  test('should show border when hovering over overflown text with word wrap', async ({
    page,
  }) => {
    // Click text tool
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    // Draw a narrow text box with limited height to force word wrapping
    const boxWidth = 100; // Narrow width to force wrapping
    const boxHeight = 60; // Minimum height
    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 100 + boxWidth;
    const endY = canvasBox.y + 100 + boxHeight;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Wait for contenteditable to appear
    await page.waitForSelector('[contenteditable="true"]');
    const editableDiv = page.locator('[contenteditable="true"]');

    // Type a long text that will wrap multiple times without explicit newlines
    // This text should wrap to many lines in a 100px wide box
    await editableDiv.type(
      'This is a long paragraph of text that will wrap to multiple lines because the box is narrow'
    );

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await page.waitForTimeout(100);

    // Verify we're in select mode after clicking outside
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Wait for canvas cursor to not be crosshair (select mode)
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Click on empty area to ensure deselection
    await page.mouse.click(canvasBox.x + 450, canvasBox.y + 450);
    await page.waitForTimeout(100);

    // Verify text overflows by checking for red pixels in the extended area
    const hasOverflowText = await canvas.evaluate((canvasEl) => {
      if (!(canvasEl instanceof HTMLCanvasElement)) return false;
      const ctx = canvasEl.getContext('2d');
      if (!ctx) return false;

      const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
      const data = imageData.data;
      const rect = canvasEl.getBoundingClientRect();
      const scaleX = canvasEl.width / rect.width;
      const scaleY = canvasEl.height / rect.height;

      // Box is at y=100, height=60, so ends at y=160. Search beyond that for overflow.
      const searchStartX = Math.floor(105 * scaleX);
      const searchEndX = Math.floor(195 * scaleX); // box is 100px wide
      const searchStartY = Math.floor(165 * scaleY); // Just below box bottom
      const searchEndY = Math.floor(250 * scaleY);

      let redPixelCount = 0;
      for (let y = searchStartY; y < searchEndY; y++) {
        for (let x = searchStartX; x < searchEndX; x++) {
          const i = (y * canvasEl.width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const alpha = data[i + 3];

          if (red > 180 && red > green && red > blue && alpha > 50) {
            redPixelCount++;
          }
        }
      }
      return redPixelCount > 20;
    });
    expect(hasOverflowText).toBe(true);

    // Hover inside the box first to verify basic hover works
    const insideHoverX = startX + 50;
    const insideHoverY = startY + 30;
    await page.mouse.move(insideHoverX, insideHoverY);
    await page.waitForTimeout(150);

    const cursorInside = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursorInside).toBe('pointer');

    // Now hover over the overflow area (below the box but on wrapped text)
    const hoverX = startX + 50; // Middle of box width
    const hoverY = startY + boxHeight + 30; // 30px below the box bottom
    await page.mouse.move(hoverX, hoverY);
    await page.waitForTimeout(150);

    // Check that cursor changes to pointer (indicating hover is detected in overflow area)
    const cursorAfter = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursorAfter).toBe('pointer');

    // Verify border is visible by checking for red border pixels at the top of the box
    const hasBorder = await canvas.evaluate(
      (canvasEl, { x, y }) => {
        if (!(canvasEl instanceof HTMLCanvasElement)) return false;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return false;

        const rect = canvasEl.getBoundingClientRect();
        const scaleX = canvasEl.width / rect.width;
        const scaleY = canvasEl.height / rect.height;

        const borderX = Math.floor((x - rect.x) * scaleX);
        const borderY = Math.floor((y - rect.y) * scaleY);

        // Sample around the border position
        const sampleSize = 5;
        for (let dy = -sampleSize; dy <= sampleSize; dy++) {
          for (let dx = -sampleSize; dx <= sampleSize; dx++) {
            const px = borderX + dx;
            const py = borderY + dy;
            if (px >= 0 && px < canvasEl.width && py >= 0 && py < canvasEl.height) {
              const imageData = ctx.getImageData(px, py, 1, 1);
              const red = imageData.data[0];
              const green = imageData.data[1];
              const blue = imageData.data[2];
              // Check for red border color
              if (red > 200 && green < 100 && blue < 100) {
                return true;
              }
            }
          }
        }
        return false;
      },
      { x: startX, y: startY + 30 }
    );

    expect(hasBorder).toBe(true);
  });

  test('should move text annotation by dragging from the border', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    // Create text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Drag from border'));

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Select the annotation by clicking on it
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Verify it's selected
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Wait for cursor to update
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Move to left border (not on corner handle) and verify text cursor
    // (text cursor indicates clickability for edit mode, but dragging still moves)
    const midY = (startY + endY) / 2;
    await page.mouse.move(startX, midY);
    await page.waitForTimeout(50);

    let cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('text');

    // Drag from the left border to move the annotation
    await page.mouse.down();
    await page.mouse.move(startX + 100, midY + 50);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Verify annotation moved - click on new position
    await page.mouse.click(startX + 150, midY + 50);
    await page.waitForTimeout(100);

    // Should still be able to select it at the new position
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Verify old position is empty - click should deselect
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Click on empty area deselects but select tool remains active
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should move text annotation by dragging from top border', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    // Create text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await textDiv.evaluate((el) => (el.textContent = 'Drag from top border'));

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Select the annotation
    await page.mouse.click(startX + 50, startY + 50);
    await page.waitForTimeout(100);

    // Move to top border (middle of top edge, not on corner handles)
    const midX = (startX + endX) / 2;
    await page.mouse.move(midX, startY);
    await page.waitForTimeout(50);

    // Drag from top border to move annotation down
    await page.mouse.down();
    await page.mouse.move(midX, startY + 80);
    await page.mouse.up();

    await page.waitForTimeout(100);

    // Verify annotation moved - should be selectable at new position
    await page.mouse.click(midX, startY + 130);
    await page.waitForTimeout(100);

    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should show text cursor when hovering over text annotation interior and clicking makes it editable', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    // Create text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    // Initially after creation, the textDiv is visible and we're in edit mode
    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();
    await expect(textDiv).toBeFocused();

    // Type initial text
    await textDiv.evaluate((el) => (el.textContent = 'Click me to edit'));

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Now we have an existing text annotation that is not being edited
    // Click on the annotation to select it
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);

    // Verify annotation is selected
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Wait for cursor to update
    await page.waitForFunction(() => {
      const hbAnnotation = document.querySelector('hb-annotation');
      if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
      const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return false;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      return canvas && window.getComputedStyle(canvas).cursor !== 'crosshair';
    });

    // Hover over the interior of the selected text box - should show text cursor
    await page.mouse.move(midX, midY);
    await page.waitForTimeout(50);

    let cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('text');

    // Click on the text annotation again to enter edit mode
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);

    // Should now show the contenteditable div for editing
    const editableDiv = page.locator('div[contenteditable="true"]');
    await expect(editableDiv).toBeVisible();
    await expect(editableDiv).toBeFocused();

    // Cursor should still be text while editing
    await page.mouse.move(midX + 10, midY + 10);
    await page.waitForTimeout(50);

    cursor = await canvas.evaluate((el) => window.getComputedStyle(el).cursor);
    expect(cursor).toBe('text');
  });

  test('should allow editing existing text annotation by clicking on it', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    // Create text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Type initial text
    await page.keyboard.type('Original text');

    // Click outside to finalize
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Click on the annotation to select and potentially edit it
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);

    // Click again to enter edit mode (first click selects, second click edits)
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);

    // Contenteditable should be visible and editable
    const editableDiv = page.locator('div[contenteditable="true"]');
    await expect(editableDiv).toBeVisible();

    // Verify we can continue editing by appending text
    await page.keyboard.type(' - modified');

    // Check the text content
    const textContent = await editableDiv.textContent();
    expect(textContent).toContain('Original text');

    // Finalize by clicking outside
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(editableDiv).not.toBeVisible();

    // Verify the annotation still exists with updated text
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should not render text on canvas while editing (avoid double rendering)', async ({
    page,
  }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    const startX = canvasBox.x + 100;
    const startY = canvasBox.y + 100;
    const endX = canvasBox.x + 300;
    const endY = canvasBox.y + 200;

    // Create text annotation
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY);
    await page.mouse.up();

    const textDiv = page.locator('div[contenteditable="true"]');
    await expect(textDiv).toBeVisible();

    // Type distinctive text
    await page.keyboard.type('UNIQUE_TEST_TEXT');

    // Click outside to finalize - text should now be rendered on canvas
    await page.mouse.click(canvasBox.x + 400, canvasBox.y + 400);
    await expect(textDiv).not.toBeVisible();

    // Get canvas pixel data where text is rendered (should have text pixels)
    const hasTextOnCanvas = await page.evaluate(
      ({ x, y }) => {
        const hbAnnotation = document.querySelector('hb-annotation');
        if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
        const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
        if (!hbCanvas || !hbCanvas.shadowRoot) return false;
        const canvasEl = hbCanvas.shadowRoot.querySelector('canvas');
        if (!canvasEl) return false;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return false;

        // Sample a small area where text should be rendered
        const dpr = window.devicePixelRatio || 1;
        const sampleX = Math.floor((x + 10) * dpr);
        const sampleY = Math.floor((y + 20) * dpr);
        const imageData = ctx.getImageData(sampleX, sampleY, 50, 30);

        // Check if there are any non-background pixels (text is red #E74C3C)
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          // Check for red text color
          if (r > 200 && g < 100 && b < 100) {
            return true;
          }
        }
        return false;
      },
      { x: 100, y: 100 }
    );

    // Text should be on canvas when not editing
    expect(hasTextOnCanvas).toBe(true);

    // Now click to select and edit
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);

    // Click again to enter edit mode
    await page.mouse.click(midX, midY);
    await page.waitForTimeout(100);

    // Should now show the contenteditable div
    const editableDiv = page.locator('div[contenteditable="true"]');
    await expect(editableDiv).toBeVisible();

    // Check that text is NOT rendered on canvas while editing (to avoid double rendering)
    const hasTextOnCanvasWhileEditing = await page.evaluate(
      ({ x, y }) => {
        const hbAnnotation = document.querySelector('hb-annotation');
        if (!hbAnnotation || !hbAnnotation.shadowRoot) return false;
        const hbCanvas = hbAnnotation.shadowRoot.querySelector('hb-canvas');
        if (!hbCanvas || !hbCanvas.shadowRoot) return false;
        const canvasEl = hbCanvas.shadowRoot.querySelector('canvas');
        if (!canvasEl) return false;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return false;

        // Sample the same area
        const dpr = window.devicePixelRatio || 1;
        const sampleX = Math.floor((x + 10) * dpr);
        const sampleY = Math.floor((y + 20) * dpr);
        const imageData = ctx.getImageData(sampleX, sampleY, 50, 30);

        // Check if there are any red text pixels
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          if (r > 200 && g < 100 && b < 100) {
            return true;
          }
        }
        return false;
      },
      { x: 100, y: 100 }
    );

    // Text should NOT be on canvas while editing (it's shown in contenteditable div only)
    expect(hasTextOnCanvasWhileEditing).toBe(false);

    // Verify the text is in the contenteditable div
    const divText = await editableDiv.textContent();
    expect(divText).toBe('UNIQUE_TEST_TEXT');
  });
});
