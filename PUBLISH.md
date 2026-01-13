# Publish

These are the information which are needed to publish the extension at [Chrome Web Store](https://chrome.google.com/webstore).

## 1. Build

### 1.1 Store listing

#### 1.1.1 Product details

**Title from package** 

Houston, we have a bug

**Summary from package**

Annotate screenshots and gather system info for quick bug reporting.

**Description**

Houston, we have a bug is a lightweight Chrome extension for bug reporting that helps you capture, annotate, and share clear bug screenshots in seconds.

The extension lets you take screenshots of the current page, add visual annotations, and automatically collect system info useful for debugging — all in one place. This includes details such as the page URL, date and time, visible area size, display resolution, device pixel ratio, browser version, and operating system.

Extension is built for QA engineers, testers, developers, product managers, and business analysts who need a fast and reliable way to document issues while preserving technical context.

Use the extension to:
- Capture and annotate screenshots directly in the browser
- Collect system info alongside visual bug evidence
- Transfer screenshots and system info into tools like Jira, Azure DevOps, GitHub Issues, or Slack as part of your existing workflow

The focus is on speed and clarity:
- No accounts
- No clutter
- No unnecessary steps

Just capture, annotate, and report bugs more efficiently.

**Category**

Tools

**Language**

English

#### 1.1.2 Graphic assets

**Store icon**

Use image `src/images/extension-presentation/hb-icon-128x128.png`

#### 1.1.3 Additional fields

**Official URL**

None

**Homepage URL**

https://github.com/ZigaVukcevicDev/houston-we-have-a-bug/blob/main/README.md

**Support URL**

https://github.com/ZigaVukcevicDev/houston-we-have-a-bug/issues

### 1.2 Privacy

#### 1.2.1 Single purpose

**Single purpose description**

The purpose of this extension is to capture screenshots, add annotations, and collect basic system information to support bug reporting.

#### 1.2.2 Permission justification

**activeTab justification**

The activeTab permission is used to capture a screenshot of the currently active tab and read the page URL only when the user explicitly triggers the extension. This permission is granted temporarily by Chrome and is required to collect visual context for bug reporting. The extension does not access any page content without direct user action.

**tabs justification**

The tabs permission is used to retrieve basic metadata about the active tab, such as the current URL and viewport dimensions, so that bug reports include accurate system information. The extension does not read browsing history, track tab changes, or monitor user activity.

**scripting justification**

The scripting permission is required to inject scripts into the active tab only after user activation. This is used to collect system information related to the current page, such as visible area size and device pixel ratio, and to display temporary UI elements needed for screenshot annotation. No scripts run automatically or persist after the action is completed.

**storage justification**

The storage permission is used to temporarily store the captured screenshot and system information while the annotation page initializes. This allows safe transfer of the image and system information, such as URL, date and time, display details, and browser information, between extension components. All stored data is deleted automatically after transfer and is never persisted, synced, or shared externally.

**Are you using remote code?**

No, I am not using remote code

#### 1.2.3 Data usage

Website content

#### 1.2.4 Privacy policy

https://github.com/ZigaVukcevicDev/houston-we-have-a-bug/blob/main/PRIVACY-POLICY.md

### 1.3 Distribution

Free of charge

## 2. Access

### 2.1 Test instructions

No login or authentication is required.

To test the extension:

1. Open any webpage.
2. Click the extension icon in the Chrome toolbar.
3. Gather system info, capture a screenshot, add annotations, and download the image.
