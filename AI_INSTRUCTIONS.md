# AI instructions

You must follow these rules when working on this repository.

## 1. Testing is mandatory
- **Run tests**: You must run `npm run test` after every change to logic, components, or styles that could affect functionality.
- **Fix immediately**: If a test fails, fixing it is your top priority. Do not proceed with new features until tests pass.
- **No regressions**: Ensure that existing features (like the Screenshot or Environment Details) continue to work.
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
- **No commented code**: Do not leave commented-out code blocks. If code is not used, delete it.
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
  - ✅ Correct: "Copy to clipboard", "Test text", "should gather environment details"
  - ❌ Incorrect: "Copy to Clipboard", "Test Text", "Should Gather Environment Details"
  - Only capitalize the first word and proper nouns
  - This applies to:
    - UI labels and buttons
    - Test data strings (e.g., `input.value = 'Test text'`)
    - Test descriptions (e.g., `it('should handle errors gracefully')`)
    - Documentation headings and content

## 5. Icons & assets
- **Icon swapping**: Use the CSS 3-state toggle pattern (Default/Hover/Active) with hidden `img` classes (`.icon-default`, `.icon-hover`, `.icon-active`) instead of SVGs filters or inline SVGs.
