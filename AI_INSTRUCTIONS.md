# AI Instructions

You must follow these rules when working on this repository.

## 1. Testing is Mandatory
- **Run Tests**: You must run `npm run test` after every change to logic, components, or styles that could affect functionality.
- **Fix Immediately**: If a test fails, fixing it is your top priority. Do not proceed with new features until tests pass.
- **No Regressions**: Ensure that existing features (like the Screenshot or Environment Details) continue to work.

## 2. Code Quality & Cleanliness
- **No Leftovers**: When refactoring or removing features (e.g., Memory Usage), fully remove all related code, types, and unused imports.
- **No Commented Code**: Do not leave commented-out code blocks. If code is not used, delete it.
- **Strict Types**: Use TypeScript interfaces properly. Avoid `any`.

## 3. Source of Truth
- **`src/*` Only**: specificly edit files in `src/`.
- **`dist/*` is Forbidden**: Never edit files in `dist/`. They are auto-generated.
- **Build**: Run `npm run build` to verify the build process works, but rely on `npm run test` for logic verification.

## 4. UI & Styling
- **SCSS Modules**: Use `@use` to import variables.
- **Variables**: Always use variables from `_variables.scss` (e.g., `$color-red-500`, `$spacing-md`) instead of hardcoded values.
- **Popup Width**: The popup width is fixed at `305px`.

## 5. Icons & Assets
- **Icon Swapping**: Use the CSS 3-state toggle pattern (Default/Hover/Active) with hidden `img` classes (`.icon-default`, `.icon-hover`, `.icon-active`) instead of SVGs filters or inline SVGs.
