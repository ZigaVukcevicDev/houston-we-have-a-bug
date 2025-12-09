# Houston, we have a bug

A Chrome extension for quick bug capture with annotation and context.

## Features

- 📘 **TypeScript** - Fully typed extension code
- 🎨 **SCSS** - Advanced styling with variables and nesting
- 📦 **Modern build setup** - Automated compilation with Prettier formatting

## Project structure

```
├── src/
│   ├── popup.html        # Popup UI
│   ├── popup.ts          # Popup script (TypeScript)
│   ├── background.ts     # Service worker (TypeScript)
│   ├── images/           # Extension icons and images
│   ├── styles/
│   │   └── popup.scss    # Popup styles (SCSS)
│   └── utils/
│       ├── get-chrome-version.ts
│       └── get-os.ts
├── manifest.json         # Extension configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── dist/                 # Compiled JavaScript (auto-generated)
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

This compiles TypeScript to JavaScript and SCSS to CSS.

### 3. Load in chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select `dist` folder
4. The extension will appear in your Chrome toolbar

### 4. Development mode

For continuous development with auto-compilation:

```bash
npm run dev
```

This builds once, then watches for changes and automatically rebuilds TypeScript, SCSS, and copies static files.
