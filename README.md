# Houston, we have a bug

![Tests](https://github.com/ZigaVukcevicDev/houston-we-have-a-bug/actions/workflows/test.yml/badge.svg)
![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)

A Chrome extension for quick bug capture with annotation and context.

## Features

- ⚡ **Lit** - Fast, lightweight Web Components framework by Google
- 📘 **TypeScript** - Fully typed extension code
- 🧪 **Vitest** - Unit testing framework with DOM simulation
- 🎨 **SCSS** - Advanced styling with variables, mixins, and nesting
- 📸 **Screenshot capture** - Capture visible tab with text annotations
- 📋 **System info** - Gather browser, OS, and display information
- 📦 **Modern build setup** - esbuild compilation with Prettier formatting
- 🗺️ **[Roadmap](ROADMAP.md)** - Planned features and evolution

## Project structure

```
├── src/
│   ├── app.ts                    # Main Lit app component
│   ├── entrypoints/
│   │   ├── popup.html            # Popup HTML entry
│   │   ├── popup.ts              # Popup TS entry
│   │   ├── tab.html              # Annotation tab HTML entry
│   │   └── tab.ts                # Annotation tab TS entry
│   ├── components/
│   │   ├── hb-popup/             # Popup component
│   │   ├── hb-annotation/        # Annotation editor component
│   │   ├── hb-toolbar/           # Annotation toolbar
│   │   ├── hb-toolbar-tool/      # Annotation toolbar tool
│   │   └── hb-canvas/            # Canvas for annotations
│   ├── styles/
│   │   ├── _variables.scss       # Shared design tokens
│   │   ├── _mixins.scss          # Reusable style mixins
│   │   ├── app.scss              # App-level styles
│   │   └── fonts.css             # Global font-face declarations
│   ├── fonts/                    # Custom font files
│   ├── utils/                    # Utility functions
│   └── types/                    # TypeScript declarations
├── manifest.json                 # Extension configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Test configuration
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

### 3. Testing

Run unit tests with Vitest:

```bash
npm run test
```

Tests are automatically run before every commit using **Husky** hooks to ensure stability.

### 4. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist` folder
4. The extension will appear in your Chrome toolbar

### 5. Development mode

For continuous development with auto-compilation:

```bash
npm run dev
```

This builds once, then watches for changes and automatically rebuilds.
