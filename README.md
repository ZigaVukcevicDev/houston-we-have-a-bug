# Houston, we have a problem

A Chrome extension for quick bug capture with annotation and context.

## Features

- 📘 **TypeScript** - Fully typed extension code
- 🎨 **SCSS** - Advanced styling with variables and nesting
- 📦 **Modern build setup** - Automated compilation
- 🔄 **Message passing** - Communication between components
- 💾 **Chrome storage** - Persistent data storage

## Project structure

```
├── src/
│   ├── popup.ts          # Popup script (TypeScript)
│   ├── background.ts     # Service worker (TypeScript)
│   ├── content.ts        # Content script (TypeScript)
│   └── styles/
│       └── popup.scss    # Popup styles (SCSS)
├── popup.html            # Popup UI
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
3. Click **Load unpacked** and select this folder
4. The extension will appear in your Chrome toolbar

### 4. Development mode

For continuous development with auto-compilation:

```bash
npm run watch
```

This watches for changes and automatically rebuilds TypeScript and SCSS.
