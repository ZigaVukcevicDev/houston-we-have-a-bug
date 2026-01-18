import { test, expect } from '@playwright/test';

test.describe('Annotation page features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');
    // Wait for the annotation component to fully render with data
    await page.waitForTimeout(500);
  });

  test('should display download button', async ({ page }) => {
    const downloadButton = page.locator('button:has-text("Download")');
    await expect(downloadButton).toBeVisible();
  });

  test('should display system info button', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await expect(systemInfoButton).toBeVisible();
  });

  test('should toggle system info panel when clicking button', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Initially system info panel should not be visible
    await expect(page.locator('.system-info-container')).not.toBeVisible();

    // Click to open
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // System info panel should be visible
    await expect(page.locator('.system-info-container')).toBeVisible();

    // Click again to close
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // System info panel should be hidden
    await expect(page.locator('.system-info-container')).not.toBeVisible();
  });

  test('should display system info details when panel is open', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Open system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const container = page.locator('.system-info-container');
    await expect(container).toBeVisible();

    // Check for system info fields
    const content = await container.textContent();
    expect(content).toContain('Date and time');
    expect(content).toContain('URL');
    expect(content).toContain('Visible area');
    expect(content).toContain('Display resolution');
    expect(content).toContain('Device pixel ratio');
    expect(content).toContain('Browser');
    expect(content).toContain('OS');
  });

  test('should close system info panel when clicking outside', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Open system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);
    await expect(page.locator('.system-info-container')).toBeVisible();

    // Click outside the panel (on canvas)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.click(box.x + 100, box.y + 100);
    await page.waitForTimeout(100);

    // System info panel should be hidden
    await expect(page.locator('.system-info-container')).not.toBeVisible();
  });

  test('should close system info panel when pressing Escape', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Open system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);
    await expect(page.locator('.system-info-container')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    // System info panel should be hidden
    await expect(page.locator('.system-info-container')).not.toBeVisible();
  });

  test('should have copy to clipboard button in system info', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Open system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // Check for copy button
    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await expect(copyButton).toBeVisible();
  });

  test('should keep system info button highlighted when panel is open', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');

    // Initially button should not have activated class
    await expect(systemInfoButton).not.toHaveClass(/activated/);

    // Open system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // Button should have activated class
    await expect(systemInfoButton).toHaveClass(/activated/);

    // Close panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // Button should not have activated class
    await expect(systemInfoButton).not.toHaveClass(/activated/);
  });

  test('should display all toolbar tools', async ({ page }) => {
    // Check all tools are present
    await expect(page.locator('[data-tool="select"]')).toBeVisible();
    await expect(page.locator('[data-tool="text"]')).toBeVisible();
    await expect(page.locator('[data-tool="line"]')).toBeVisible();
    await expect(page.locator('[data-tool="arrow"]')).toBeVisible();
    await expect(page.locator('[data-tool="rectangle"]')).toBeVisible();
    await expect(page.locator('[data-tool="crop"]')).toBeVisible();
  });

  test('should switch between tools when clicking toolbar buttons', async ({
    page,
  }) => {
    // Initially arrow tool should be active (default in hb-annotation)
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();

    // Click arrow tool
    await page.click('[data-tool="arrow"]');
    await page.waitForTimeout(50);
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();

    // Click line tool
    await page.click('[data-tool="line"]');
    await page.waitForTimeout(50);
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
    ).toBeVisible();

    // Click rectangle tool
    await page.click('[data-tool="rectangle"]');
    await page.waitForTimeout(50);
    await expect(
      page.locator('[data-tool="rectangle"][aria-selected="true"]')
    ).toBeVisible();

    // Click crop tool
    await page.click('[data-tool="crop"]');
    await page.waitForTimeout(50);
    await expect(
      page.locator('[data-tool="crop"][aria-selected="true"]')
    ).toBeVisible();

    // Click select tool
    await page.click('[data-tool="select"]');
    await page.waitForTimeout(50);
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should only have one active tool at a time', async ({ page }) => {
    // Click arrow tool
    await page.click('[data-tool="arrow"]');
    await page.waitForTimeout(50);

    // Check only arrow is active
    const activeTools = await page.locator('[aria-selected="true"]').count();
    expect(activeTools).toBe(1);
    await expect(
      page.locator('[data-tool="arrow"][aria-selected="true"]')
    ).toBeVisible();

    // Click line tool
    await page.click('[data-tool="line"]');
    await page.waitForTimeout(50);

    // Check only line is active
    const activeToolsAfter = await page
      .locator('[aria-selected="true"]')
      .count();
    expect(activeToolsAfter).toBe(1);
    await expect(
      page.locator('[data-tool="line"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should switch to select tool after creating annotation', async ({
    page,
  }) => {
    // Click arrow tool
    await page.click('[data-tool="arrow"]');
    await page.waitForTimeout(50);

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw arrow
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 200);
    await page.mouse.up();
    await page.waitForTimeout(100);

    // Should switch to select tool
    await expect(
      page.locator('[data-tool="select"][aria-selected="true"]')
    ).toBeVisible();
  });

  test('should show canvas element', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Canvas should have dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should not show crop buttons initially', async ({ page }) => {
    await expect(page.locator('.crop-buttons')).not.toBeVisible();
  });

  test('should render canvas with screenshot', async ({ page }) => {
    const canvas = page.locator('canvas');

    // Verify canvas has image content (not blank)
    const hasContent = await canvas.evaluate((el) => {
      const canvas = el as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some((value) => value > 0);
    });

    expect(hasContent).toBe(true);
  });
});
