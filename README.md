# History Preventer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange)](https://addons.mozilla.org/) <!-- placeholder -->
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web_Store-brightgreen)](https://chrome.google.com/webstore) <!-- placeholder -->

**History Preventer** is a cross‑browser extension that automatically removes specific pages from your browsing history immediately after they load. It does **not** prevent history entries from being written – it deletes them right after the page has finished loading.

Supported browsers:

- **Firefox** (Desktop & Android)
- **Chrome** (and all Chromium‑based browsers: Edge, Opera, Brave, Vivaldi, etc.)

---

## Features

- 🔥 **Remove by URL** – add any domain (e.g., `example.com`) and every visit to that domain is erased from history.
- 🔍 **Remove by page title** – add keywords (e.g., `News`) and any page whose title contains that word is removed.
- 👁️ **Privacy mode** – each entry in the list can be hidden (masked as `••••••`) so that your block list is not visible when you open the popup.
- 🧹 **Bulk clean‑up** – one‑click to delete _all_ matching entries from your entire browsing history.
- 🔄 **Live updates** – changes to the lists take effect immediately without restarting the browser.
- 🔒 **Cross‑browser** – works seamlessly in Firefox and Chrome using a single codebase.

> ⚠️ **Important:** This extension **deletes** history entries after the page has loaded. It does **not** prevent them from being written in the first place.

---

## Installation

### For end‑users

- **Firefox**: install from the [Firefox Add‑on Store](https://addons.mozilla.org/) (coming soon).
- **Chrome** (and other Chromium‑based browsers): install from the [Chrome Web Store](https://chrome.google.com/webstore) (coming soon).

### Manual installation from a release

1. Download the latest `.xpi` (Firefox) or `.zip` (Chrome) from the [Releases](../../releases) page.
2. For **Firefox**: drag and drop the `.xpi` file into any Firefox window and confirm installation.
3. For **Chrome**: unpack the `.zip` archive, then go to `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the extracted folder.

---

## Building from source

If you want to build the extension yourself (e.g., for development or customisation), follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (for the build script)
- (Optional) [`web-ext`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) – for signing and testing Firefox builds.

### Clone and install dependencies

```bash
git clone https://github.com/yourusername/history-preventer.git
cd history-preventer
npm install         # installs dev dependencies (if any)
```

### Project structure

```
history-preventer/
├── src/                     # Shared source code
│   ├── background.js        # Background script (uses browser.* API)
│   ├── popup/
│   │   ├── edit_block_list.html
│   │   ├── edit_block_list.js
│   │   └── edit_block_list.css
│   └── icons/               # Icons (optional)
├── manifests/               # Browser‑specific manifests
│   ├── manifest.firefox.json
│   └── manifest.chrome.json
├── polyfill/                # webextension‑polyfill
│   └── browser-polyfill.min.js
├── scripts/
│   └── build.js             # Build script
└── dist/                    # Generated builds (ignored by git)
    ├── firefox/
    └── chrome/
```

### Build the extension

Run the build script to produce two packages (one for each browser) in the `dist/` folder:

```bash
npm run build
# or
node scripts/build.js
```

This copies the shared source files, adds the polyfill, and places the correct manifest in each browser's folder.

### Test locally

- **Firefox**: open `about:debugging` → This Firefox → Load Temporary Add‑on → select `dist/firefox/manifest.json`.
  Alternatively, use `web-ext run --source-dir=dist/firefox`.
- **Chrome**: go to `chrome://extensions/`, enable Developer mode, click **Load unpacked**, and select the `dist/chrome` folder.

### Package for distribution

- **Firefox** (signed `.xpi`):
  ```bash
  web-ext sign --source-dir=dist/firefox --channel=unlisted
  ```
  (Requires API keys from Mozilla Add‑ons.)
- **Chrome** (`.zip` for the store):
  ```bash
  cd dist/chrome && zip -r ../history-preventer-chrome.zip .
  ```

---

## Usage

Click the extension’s toolbar icon to open the popup.

- **Add a site** – type a domain (e.g., `youtube.com`) and press **+**. All pages from that domain will be removed from history after loading.
- **Add a keyword** – type a word (e.g., `Wikipedia`) and press **+**. Any page whose title contains that word will be removed.
- **Toggle visibility** – each list item has an eye icon (`👁️`/`🙈`) to show or hide its real value. Hidden items appear as `••••••`.
- **Show/Hide all** – use the small eye/hide buttons below the input fields to toggle all entries in that category at once.
- **Clear matching history** – press the **Remove all matching entries from history** button to scan your entire history and delete everything that matches your lists.

All settings are stored in your browser’s local storage and persist across browser restarts.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request. For major changes, please discuss them first.

- Use clear, descriptive commit messages.
- Keep the code style consistent.
- Test your changes in both Firefox and Chrome before submitting.

---

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- Built with the [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) and the [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) library.
- Inspired by the need for a simple, privacy‑conscious history management tool.

---

## Disclaimer

This add‑on is provided “as is”, without warranty of any kind. Use it at your own risk. The developers are not responsible for any loss of browsing data.
