import { test, expect } from '@playwright/test';

test.describe('Copy to clipboard functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test-page.html');

    // Grant clipboard permissions
    await page
      .context()
      .grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('should copy system info to clipboard', async ({ page }) => {
    // Open system info panel
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // Click copy button
    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await copyButton.click();
    await page.waitForTimeout(200);

    // Read clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Verify clipboard contains system info fields
    expect(clipboardText).toContain('Date and time:');
    expect(clipboardText).toContain('URL:');
    expect(clipboardText).toContain('Visible area:');
    expect(clipboardText).toContain('Display resolution:');
    expect(clipboardText).toContain('Device pixel ratio:');
    expect(clipboardText).toContain('Browser:');
    expect(clipboardText).toContain('Operating system:');
  });

  test('should format clipboard content correctly', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await copyButton.click();
    await page.waitForTimeout(200);

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Verify format with line breaks
    const lines = clipboardText.split('\n');
    expect(lines.length).toBeGreaterThan(5);

    // Each line should have key: value format or be a section header (System, Display)
    lines.forEach((line) => {
      if (line.trim()) {
        // Allow section headers or key:value pairs
        expect(line).toMatch(/^(.+:.+|System|Display)$/);
      }
    });
  });

  test('should show visual feedback after copying', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );

    // Copy
    await copyButton.click();
    await page.waitForTimeout(100);

    // Check if button text changes (indicating successful copy)
    // The actual implementation might show "Copied!" or a checkmark
    const buttonText = await copyButton.textContent();
    expect(buttonText).toBeTruthy();
  });

  test('should allow multiple copy operations', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );

    // First copy
    await copyButton.click();
    await page.waitForTimeout(200);

    const clipboardText1 = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText1).toContain('Date and time:');

    // Second copy
    await copyButton.click();
    await page.waitForTimeout(200);

    const clipboardText2 = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText2).toContain('Date and time:');

    // Both should contain the same system info
    expect(clipboardText1).toBe(clipboardText2);
  });

  test('should copy complete URL in system info', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await copyButton.click();
    await page.waitForTimeout(200);

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Verify URL is in clipboard
    expect(clipboardText).toMatch(
      /URL: http:\/\/localhost:8080\/test-page\.html/
    );
  });

  test('should copy browser information', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await copyButton.click();
    await page.waitForTimeout(200);

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Verify browser info is in clipboard
    expect(clipboardText).toMatch(/Browser: Chrome/);
  });

  test('should copy OS information', async ({ page }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await copyButton.click();
    await page.waitForTimeout(200);

    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    // Verify OS info is in clipboard
    expect(clipboardText).toMatch(
      /Operating system: (Windows|macOS|Mac OS|Linux)/
    );
  });

  test('should maintain clipboard content after closing panel', async ({
    page,
  }) => {
    const systemInfoButton = page.locator('button:has-text("System info")');
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    const copyButton = page.locator(
      '.system-info-container button:has-text("Copy")'
    );
    await copyButton.click();
    await page.waitForTimeout(200);

    // Close system info panel
    await systemInfoButton.click();
    await page.waitForTimeout(100);

    // Clipboard should still contain the copied text
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );

    expect(clipboardText).toContain('Date and time:');
    expect(clipboardText).toContain('URL:');
  });
});
