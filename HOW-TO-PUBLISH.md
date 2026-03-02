# How to publish

## Before publishing

### 1. Update CHANGELOG.md

Add a new entry at the top with the new version and today's date.

### 2. Bump version

Update the version in 3 files:

- `package.json`
- `package-lock.json`
- `manifest.json`

### 3. Run all checks

```bash
npm run test:all
```

All tests must pass before building.

### 4. Commit and push

Commit the CHANGELOG and version bumps, then push code before building.

### 5. Build

```bash
npm run build
```

Output goes to the `dist/` folder.

### 6. Create a ZIP

```bash
cd dist && zip -r ../houston-we-have-a-bug-1-0-1.zip . && cd ..
```

## Publishing to GitHub releases

1. Go to the repository on GitHub → **Releases** → **Draft a new release**
2. In the **Choose a tag** dropdown, type a new tag (e.g. `vX.X.X`) — GitHub will create it on publish
3. Set the release title to `vX.X.X`
4. Copy the relevant section from `CHANGELOG.md` into the release notes
5. Attach `houston-we-have-a-bug-X-X-X.zip` as a release asset
6. Click **Publish release**

## Publishing to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Find the extension and click **Package**
3. Click **Upload new package**
4. Upload the new `houston-we-have-a-bug-X-X-X.zip`
5. Click **Submit for review**
