# Publish

These are the information which are needed to publish the extension at [Chrome Web Store](https://chrome.google.com/webstore).

## 1. Build

### 1.1 Store listing

#### 1.1.1 Product details

**Title from package** 

Houston, we have a bug

**Summary from package**

Annotate screenshots, and gather system info for quick bug reporting.

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

Use image `src/images/extension-presentation/icon-128.png`

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

The activeTab permission is used to capture a screenshot of the currently active tab and access the page URL when the user explicitly triggers the extension. This permission is only granted temporarily and is required to collect visual evidence for bug reporting.

**tabs justification**

The tabs permission is used to retrieve basic information about the active tab, such as the tab URL and dimensions, to include accurate context in bug reports. The extension does not access browsing history or monitor tab activity.

**scripting justification**

The scripting permission is required to inject scripts into the active tab only when the user activates the extension. This is used to collect page-specific details, such as visible area size and device pixel ratio, and to display temporary UI elements needed for screenshot annotation during bug reporting.

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
