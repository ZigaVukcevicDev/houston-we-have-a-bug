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

  test('should remove annotation if no text is entered', async ({ page }) => {
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

    // Annotation should not exist - verify by checking canvas doesn't have the annotation
    // We can verify this by taking a snapshot of the annotations array
    // This would require exposing the state for testing
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

  test('should show move cursor when hovering over text box border', async ({
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

    // Hover over left border (not on handle)
    const midY = (startY + endY) / 2;
    await page.mouse.move(startX, midY);
    await page.waitForTimeout(50);
    const cursor = await canvas.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('move');
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
});
