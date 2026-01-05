# Houston, we have a bug

![Status](https://img.shields.io/badge/status-work_in_progress-orange)
![Tests](https://github.com/ZigaVukcevicDev/houston-we-have-a-bug/actions/workflows/test.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-409%20passing-success)
![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![Platform](https://img.shields.io/badge/platform-Chrome_extension-blue)
![Lit](https://img.shields.io/badge/framework-Lit-324FFF?logo=lit)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)
![SCSS](https://img.shields.io/badge/style-SCSS-CC6699)
![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)
![Build](https://img.shields.io/badge/build-esbuild-lightgrey)

<img
  src="src/images/extension-presentation/hb-small-promo-tile-440x280@2x.jpg"
  width="440"
  alt="Houston, we have a bug"
/>

A Chrome extension that helps you annotate screenshots and gather system info for quick bug reporting.

> 🚧 **Status: Work in progress — not published**
>
> This Chrome extension is under active development and has **not been published
> to the Chrome Web Store yet**. Features, UX, and behavior may change.

## Key capabilities

- 📸 **Screenshot with annotations** - Capture visible tab with annotations
- 📋 **System info** - Gather current date and time, URL, display settings, browser, and OS information
- 🗺️ **[Roadmap](ROADMAP.md)** - Planned features, and evolution

## Tech stack & tooling

- ⚡ **Lit** - Fast, lightweight web components framework by Google
- 📘 **TypeScript** - Fully typed extension code
- 🎨 **SCSS** - Styling with variables and nesting
- 🧪 **Vitest** - Unit testing framework with DOM simulation
- 📦 **Modern build setup** - esbuild compilation with Prettier formatting

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

### 1. Install dependencies

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
