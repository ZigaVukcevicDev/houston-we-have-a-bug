# Testing guide

## Quick reference

### Run tests
```bash
npm test              # Unit tests (486 tests, fast)
npm run test:e2e      # E2E tests (real browser)
npm run test:all      # All tests (runs automatically on commit)
```

### Debug E2E tests
```bash
npm run test:e2e:ui   # Interactive mode - see browser, step through tests
```

## Why two types of tests?

**Unit tests (Vitest)**
- Fast, comprehensive (486 tests, 98% coverage)
- Test individual functions
- ⚠️ Can pass while features are broken (tests mocks, not real behaviour)

**E2E tests (Playwright)**
- Slower, test critical flows
- Run in real browser
- ✅ Catch real bugs like "annotation disappears on mouse release"

## Writing E2E tests

Located in `testing-e2e/`. Example:

```typescript
test('text annotation persists', async ({ page }) => {
  await page.goto('http://localhost:8080/test-page.html');
  await page.click('[data-tool="text"]');

  // Draw annotation
  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 200);
  await page.mouse.up();

  // Type text
  await page.locator('textarea').fill('Test');
  await page.mouse.click(box.x + 400, box.y + 400);

  // Verify it persists
  await page.mouse.click(box.x + 200, box.y + 150);
  await expect(page.locator('[data-tool="select"]')).toBeVisible();
});
```

## Manual testing

Use `test-page.html` for quick manual testing:
1. Run `npm run build` to build the extension
2. Start a simple server: `npx http-server -p 8080`
3. Open `http://localhost:8080/test-page.html` in browser
4. Test the tool you changed

## Debugging tips

### E2E test failing?
1. Run `npm run test:e2e:ui` to see what's happening
2. Check screenshots in `test-results/`
3. Add `await page.pause()` to pause execution

### Common issues
- **Annotation disappears**: Check if using spread operator instead of `push()`
- **Handles don't show**: Check if `selectAnnotation()` was called
- **Can't type**: Check `pointer-events` CSS

## Philosophy

**High test coverage ≠ working features**

- 98% coverage didn't prevent the "annotation disappears" bug
- Unit tests passed, but real functionality was broken
- E2E tests would have caught it immediately
