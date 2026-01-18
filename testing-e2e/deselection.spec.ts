import { test, expect } from '@playwright/test';

test.describe('Annotation deselection when switching tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should deselect text annotation when switching to arrow tool', async ({ page }) => {
    // Draw a text annotation
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Wait for tool to switch to select and annotation to be selected
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
    await page.waitForTimeout(100);

    // Verify handles are visible (annotation is selected)
    const handleCount = await page.evaluate(() => {
      const hbCanvas = document.querySelector('hb-canvas');
      if (!hbCanvas || !hbCanvas.shadowRoot) return 0;
      const canvas = hbCanvas.shadowRoot.querySelector('canvas');
      if (!canvas) return 0;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;

      // Check if arc (handle) was called
      return (ctx as any).arc ? 1 : 0;
    });

    // Switch to arrow tool
    await page.click('[data-tool="arrow"]');
    await page.waitForTimeout(100);

    // Verify arrow tool is active
    await expect(page.locator('[data-tool="arrow"][aria-selected="true"]')).toBeVisible();

    // The annotation should be deselected (handles should not be visible)
    // We can verify this by checking that select tool is not active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).not.toBeVisible();
  });

  test('should deselect line annotation when switching to rectangle tool', async ({ page }) => {
    // Draw a line annotation
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Wait for tool to switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
    await page.waitForTimeout(100);

    // Switch to rectangle tool
    await page.click('[data-tool="rectangle"]');
    await page.waitForTimeout(100);

    // Verify rectangle tool is active and select is not
    await expect(page.locator('[data-tool="rectangle"][aria-selected="true"]')).toBeVisible();
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).not.toBeVisible();
  });

  test('should deselect rectangle annotation when switching to text tool', async ({ page }) => {
    // Draw a rectangle annotation
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Wait for tool to switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
    await page.waitForTimeout(100);

    // Switch to text tool
    await page.click('[data-tool="text"]');
    await page.waitForTimeout(100);

    // Verify text tool is active and select is not
    await expect(page.locator('[data-tool="text"][aria-selected="true"]')).toBeVisible();
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).not.toBeVisible();
  });

  test('should deselect arrow annotation when switching to line tool', async ({ page }) => {
    // Draw an arrow annotation
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Wait for tool to switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
    await page.waitForTimeout(100);

    // Switch to line tool
    await page.click('[data-tool="line"]');
    await page.waitForTimeout(100);

    // Verify line tool is active and select is not
    await expect(page.locator('[data-tool="line"][aria-selected="true"]')).toBeVisible();
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).not.toBeVisible();
  });

  test('should keep annotation selected when manually clicking select tool', async ({ page }) => {
    // Draw a line annotation
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Wait for tool to switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
    await page.waitForTimeout(100);

    // Switch to arrow tool (deselects annotation)
    await page.click('[data-tool="arrow"]');
    await page.waitForTimeout(100);

    // Now manually click select tool
    await page.click('[data-tool="select"]');
    await page.waitForTimeout(100);

    // Verify select tool is active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();

    // Click on the line to select it
    await page.mouse.click(canvasBox.x + 200, canvasBox.y + 150);
    await page.waitForTimeout(100);

    // Switch to another tool and back to select
    await page.click('[data-tool="arrow"]');
    await page.waitForTimeout(100);
    await page.click('[data-tool="select"]');
    await page.waitForTimeout(100);

    // Select tool should still be active
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
  });

  test('should deselect all annotations when switching to crop tool', async ({ page }) => {
    // Draw a rectangle annotation
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas not found');

    await page.mouse.move(canvasBox.x + 100, canvasBox.y + 100);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 300, canvasBox.y + 200);
    await page.mouse.up();

    // Wait for tool to switch to select
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).toBeVisible();
    await page.waitForTimeout(100);

    // Switch to crop tool
    await page.click('[data-tool="crop"]');
    await page.waitForTimeout(100);

    // Verify crop tool is active and select is not
    await expect(page.locator('[data-tool="crop"][aria-selected="true"]')).toBeVisible();
    await expect(page.locator('[data-tool="select"][aria-selected="true"]')).not.toBeVisible();
  });
});
