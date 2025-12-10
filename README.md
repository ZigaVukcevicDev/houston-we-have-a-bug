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
│   ├── entrypoints/
│   │   ├── popup.html            # Popup HTML entry
│   │   ├── popup.ts              # Popup TS entry
│   │   ├── tab.html              # Annotation tab HTML entry
│   │   └── tab.ts                # Annotation tab TS entry
│   ├── components/
│   │   ├── hb-popup/             # Popup component
│   │   │   ├── hb-popup.ts
│   │   │   └── hb-popup.scss
│   │   ├── hb-annotation/        # Annotation editor component
│   │   │   ├── hb-annotation.ts
│   │   │   └── hb-annotation.scss
│   │   ├── hb-toolbar/           # Annotation toolbar
│   │   │   ├── hb-toolbar.ts
│   │   │   └── hb-toolbar.scss
│   │   └── hb-canvas/            # Canvas for annotations
│   │       ├── hb-canvas.ts
│   │       └── hb-canvas.scss
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

## Usage

### Popup

The extension popup displays system info and a screenshot button. It uses the `<hb-popup>` component, which is rendered by the app shell `<houston-we-have-a-bug>`.

**popup.html**

```html
<houston-we-have-a-bug></houston-we-have-a-bug>
```

**popup.ts**

```ts
import '../app';
// The app shell renders <hb-popup>
```

### Annotation Tab

When a screenshot is taken, a new tab opens with the `<hb-annotation>` component for annotation.

**tab.html**

```html
<hb-annotation></hb-annotation>
```

**tab.ts**

```ts
import '../components/hb-annotation/hb-annotation';
```

### Custom Elements

- `<houston-we-have-a-bug>`: App shell (popup root)
- `<hb-popup>`: Popup UI (system info, screenshot)
- `<hb-annotation>`: Annotation editor (tab)
- `<hb-toolbar>`: Toolbar for annotation tools
- `<hb-canvas>`: Canvas for drawing annotations
