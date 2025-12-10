# Houston, we have a bug

A Chrome extension for quick bug capture with annotation and context.

## Features

- 🔥 **Lit** - Fast, lightweight Web Components framework by Google
- 📘 **TypeScript** - Fully typed extension code
- 🎨 **SCSS** - Advanced styling with variables, mixins, and nesting
- 📸 **Screenshot capture** - Capture visible tab with text annotations
- 📋 **System info** - Gather browser, OS, and display information
- 📦 **Modern build setup** - esbuild compilation with Prettier formatting

## Project structure

```
├── src/
│   ├── app.ts                    # Main Lit app component
│   ├── main.ts                   # Entry point
│   ├── popup.html                # Popup UI
│   ├── components/
│   │   ├── main-view/            # System info view
│   │   │   ├── main-view.ts
│   │   │   └── main-view.scss
│   │   ├── screenshot-editor/    # Screenshot annotation editor
│   │   │   ├── screenshot-editor.ts
│   │   │   └── screenshot-editor.scss
│   │   ├── editor-toolbar/       # Annotation toolbar
│   │   │   ├── editor-toolbar.ts
│   │   │   └── editor-toolbar.scss
│   │   └── annotation-canvas/    # Canvas for annotations
│   │       ├── annotation-canvas.ts
│   │       └── annotation-canvas.scss
│   ├── styles/
│   │   ├── _variables.scss       # Shared design tokens
│   │   ├── _mixins.scss          # Reusable style mixins
│   │   └── app.scss              # App-level styles
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript declarations
├── manifest.json                 # Extension configuration
├── tsconfig.json                 # TypeScript configuration
├── build.js                      # esbuild configuration
├── package.json                  # Dependencies and scripts
└── dist/                         # Compiled output (auto-generated)
```

## Installation & setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the extension

```bash
npm run build
```

This compiles TypeScript and SCSS into a single bundled JavaScript file.

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist` folder
4. The extension will appear in your Chrome toolbar

### 4. Development mode

For continuous development with auto-compilation:

```bash
npm run dev
```

This builds once, then watches for changes and automatically rebuilds.
