import { test, expect } from '@playwright/test';

test.describe('Download functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
  });

  test('should download with no annotations', async ({ page }) => {
    const downloadButton = page.locator('button:has-text("Download")');

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');

    // Click download
    await downloadButton.click();

    const download = await downloadPromise;

    // Verify download filename format
    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should download with arrow annotation', async ({ page }) => {
    await page.click('[data-tool="arrow"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should download with line annotation', async ({ page }) => {
    await page.click('[data-tool="line"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw line
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should download with rectangle annotation', async ({ page }) => {
    await page.click('[data-tool="rectangle"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw rectangle
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should download with text annotation', async ({ page }) => {
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
    await editableDiv.fill('Test annotation');

    // Click outside to finalize
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should download with multiple mixed annotations', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 150);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 250, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 400, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Draw line
    await page.click('[data-tool="line"]');
    await page.mouse.move(box.x + 100, box.y + 250);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should deselect annotation before downloading', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw and select a rectangle
    await page.click('[data-tool="rectangle"]');
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Rectangle should be selected (select tool auto-activates)
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();

    // Download
    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download occurred
    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);

    // Note: We can't easily verify visual deselection in the downloaded image,
    // but this test ensures the download flow works with selected annotations
  });

  test('should download with text overflow', async ({ page }) => {
    await page.click('[data-tool="text"]');

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw small text box (must exceed minimum 40x60)
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 170);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Type long text that will overflow
    const editableDiv = page.locator('[contenteditable="true"]');
    await editableDiv.fill(
      'This is a very long text that will definitely overflow the text box boundaries and should still be visible in the downloaded image'
    );

    // Click outside to finalize
    await page.mouse.click(box.x + 400, box.y + 400);
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should download after crop operation', async ({ page }) => {
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

    // Confirm crop
    await page.click('.crop-buttons button[title="Confirm crop"]');
    await page.waitForTimeout(300);

    // Add an annotation after crop
    await page.click('[data-tool="arrow"]');
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 100);
    await page.mouse.up();
    await page.waitForTimeout(100);

    const downloadButton = page.locator('button:has-text("Download")');
    const downloadPromise = page.waitForEvent('download');

    await downloadButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bug .+\.jpg$/);
  });

  test('should generate unique filename for each download', async ({
    page,
  }) => {
    const downloadButton = page.locator('button:has-text("Download")');

    // First download
    const downloadPromise1 = page.waitForEvent('download');
    await downloadButton.click();
    const download1 = await downloadPromise1;
    const filename1 = download1.suggestedFilename();

    // Wait a moment to ensure timestamp differs
    await page.waitForTimeout(1100);

    // Second download
    const downloadPromise2 = page.waitForEvent('download');
    await downloadButton.click();
    const download2 = await downloadPromise2;
    const filename2 = download2.suggestedFilename();

    // Filenames should be different (due to timestamp)
    expect(filename1).not.toBe(filename2);
    expect(filename1).toMatch(/^bug .+\.jpg$/);
    expect(filename2).toMatch(/^bug .+\.jpg$/);
  });
});
