# AI instructions

You must follow these rules when working on this repository.

## 1. Testing is mandatory
- **Run tests**: You must run `npm run test` after every change to logic, components, or styles that could affect functionality.
- **Fix immediately**: If a test fails, fixing it is your top priority. Do not proceed with new features until tests pass.
- **No regressions**: Ensure that existing features (like the Screenshot or System info) continue to work.
- **Comprehensive coverage required**: When creating new functionality or updating existing functionality, you MUST write comprehensive tests that cover:
  - All major code paths and functionality
  - Edge cases and error handling
  - Integration points with other components
  - User interactions and state changes
- **Avoid duplicate coverage**: Component tests should focus on the component's responsibilities (initialization, delegation, rendering), not duplicate behavior tests that exist in child component/tool test files. For example:
  - ✅ Test that `HBCanvas` properly initializes and delegates to `TextTool`
  - ❌ Don't test `TextTool`'s text input behavior in `HBCanvas` tests (that's in `text-tool.test.ts`)

## 2. Code quality & cleanliness
- **No leftovers**: When refactoring or removing features (e.g., Memory Usage), fully remove all related code, types, and unused imports.
- **Remove unused imports**: After any refactoring, ALWAYS delete unused import statements. Check imports in all modified files.
- **No commented code**: Do not leave commented-out code blocks. If code is not used, delete it.
- **Remove dead code**: When refactoring, always identify and remove any unused functions, variables, or imports that are no longer needed.
- **Avoid ALL CAPS comments**: Avoid using ALL CAPS words in comments (e.g., use "Get raw position first" instead of "Get raw position FIRST").
- **Strict types**: Use TypeScript interfaces properly. Avoid `any`.

## Code organization

- **Types vs interfaces**: 
  - `src/types/` - For type aliases (e.g., `type DrawingMode = 'text' | 'line'`)
  - `src/interfaces/` - For object structures (e.g., `interface LineAnnotation { ... }`)
  
- **Naming conventions**:
  - Private methods: Use `private` keyword only, **no underscore prefix**
    - ✅ Correct: `private handleClick()`, `private redraw()`
    - ❌ Incorrect: `private _handleClick()`, `private _redraw()`
  - The `private` keyword is sufficient; underscore prefixes are redundant in modern TypeScript
  - Constants: Use camelCase, **not SCREAMING_SNAKE_CASE**
    - ✅ Correct: `const handleRadius = 8;`
    - ❌ Incorrect: `const HANDLE_RADIUS = 8;`

- **Component method order**:
  - In LitElement components, place the `render()` method near the top, immediately after class properties
  - This makes the component's output visible at a glance
  - Order: `constructor` → properties → `render()` → lifecycle methods → event handlers → helper methods

## 3. Source of truth
- **`src/*` only**: specificly edit files in `src/`.
- **`dist/*` is forbidden**: Never edit files in `dist/`. They are auto-generated.
- **Build**: Run `npm run build` to verify the build process works, but rely on `npm run test` for logic verification.

## 4. UI & styling
- **SCSS modules**: Use `@use` to import variables.
- **Variables**: Always use variables from `_variables.scss` (e.g., `$color-red-500`, `$spacing-md`) instead of hardcoded values.
- **Text capitalization**: Use European-style capitalization (sentence case) for **all text** including UI, test data, test descriptions, and documentation
  - ✅ Correct: "Copy to clipboard", "Test text", "should gather system info"
  - ❌ Incorrect: "Copy to Clipboard", "Test Text", "Should Gather System Info"
  - Only capitalize the first word and proper nouns
  - This applies to:
    - UI labels and buttons
    - Test data strings (e.g., `input.value = 'Test text'`)
    - Test descriptions (e.g., `it('should handle errors gracefully')`)
    - Documentation headings and content


## 5. Icons & assets
- **Icon swapping**: Use the CSS 3-state toggle pattern (Default/Hover/Active) with hidden `img` classes (`.icon-default`, `.icon-hover`, `.icon-active`) instead of SVGs filters or inline SVGs.

## 6. Canvas rendering & Retina display support
- **Device pixel ratio scaling**: All canvas drawing operations MUST account for `window.devicePixelRatio` to render correctly on Retina/high-DPI displays
  - When drawing shapes, multiply dimensions by DPR: `size * (window.devicePixelRatio || 1)`
  - When drawing strokes, multiply line widths by DPR: `lineWidth * (window.devicePixelRatio || 1)`
  - When hit-testing canvas elements, multiply hit areas by DPR
  - Example:
    ```typescript
    const dpr = window.devicePixelRatio || 1;
    ctx.lineWidth = baseLineWidth * dpr;
    ctx.fillRect(x, y, width * dpr, height * dpr);
    ```
- **Why this matters**: On Retina displays (DPR=2), canvas pixels ≠ CSS pixels. Without DPR scaling:
  - An 8px canvas element appears as 4 CSS pixels (50% too small)
  - A 5px line appears as 2.5 CSS pixels (looks thin/blurry)
- **Affected areas**: 
  - Handle rendering (`render-handle.ts`)
  - Line annotation rendering (`line-tool.ts`, `select-tool.ts`)
  - Any future canvas-based annotations (arrows, rectangles, etc.)

