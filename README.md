# GitHub Copilot File Renderer

A Chrome/Edge extension that enhances the visualization of GitHub Copilot customization files (`.agent.md`, `SKILL.md`, `.prompt.md`, `.instructions.md`) when viewed on github.com. Replaces GitHub's plain frontmatter tables with styled metadata cards featuring gradient headers, pill badges, and dark mode support.

## Features

- 🤖 **Agent Files** (`.agent.md`) — Purple gradient card with parsed metadata
- ⚡ **Skill Files** (`SKILL.md`) — Blue gradient card with tools/tags rendered as pills
- 💬 **Prompt Files** (`.prompt.md`) — Green gradient card with mode and model display
- 📋 **Instructions Files** (`.instructions.md`) — Amber gradient card with glob patterns
- 🌙 **Dark Mode** — Automatically adapts to GitHub's dark theme
- 🎨 **Developer Luxury UI** — Glassmorphism, gradient headers, noise textures, shimmer animations, JetBrains Mono typography
- ⚙️ **Toggle On/Off** — Enable or disable the extension from the popup

## Supported File Types

| File Pattern | Type | Detected Via |
|---|---|---|
| `*.agent.md`, `AGENTS.md` | Agent | URL path |
| `SKILL.md` | Skill | URL path |
| `*.prompt.md` | Prompt | URL path |
| `*.instructions.md`, `copilot-instructions.md` | Instructions | URL path |

## Installation

### From Source

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kasuken/chrome-edge-extension-github-copilot-render.git
   cd chrome-edge-extension-github-copilot-render
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```

4. **Load in your browser:**
   - Open `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist` folder

## How It Works

When you navigate to a GitHub Copilot file on github.com, the extension:

1. **Detects** the file type from the URL path
2. **Extracts** YAML frontmatter from GitHub's rendered table
3. **Replaces** the plain table with a styled metadata card
4. **Renders** list-type fields (e.g., `tools`, `tags`) as interactive pill badges
5. **Preserves** scalar fields (e.g., `model`, `description`) as plain text

The extension uses a `MutationObserver` and listens for `turbo:load` events to handle GitHub's SPA navigation.

## Project Structure

```
src/
├── manifest.json       # Extension manifest (Manifest V3)
├── background.ts       # Service worker (enables extension on install)
├── content.ts          # Content script (detection, extraction, rendering)
├── popup.html          # Popup UI layout
├── popup.ts            # Popup logic (toggle extension on/off)
├── popup.css           # Popup styles (dark theme, gradient header)
└── icons/              # Extension icons (16/32/48/128px)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | TypeScript check + Vite build + post-build fix |
| `npm run build:watch` | Build in watch mode |
| `npm run type-check` | Run TypeScript type checking only |
| `npm run clean` | Clean the `dist` directory |
| `npm run zip` | Build and create `extension.zip` for store submission |

## Development

### Quick Start

```bash
npm install
npm run build
```

Then load the `dist` folder as an unpacked extension. After making changes, run `npm run build` again and reload the extension in the browser.

### Watch Mode

```bash
npm run build:watch
```

Automatically rebuilds on file changes. You still need to reload the extension in the browser.

## Tech Stack

- **TypeScript** with strict typing
- **Vite 7** for bundling
- **Manifest V3** for Chrome/Edge compatibility
- **Chrome Extension APIs** (`chrome.storage.sync`, `chrome.runtime`)

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Manifest V3)
- ✅ Other Chromium-based browsers

## Publishing

### Chrome Web Store
1. Run `npm run zip`
2. Upload `extension.zip` to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

### Edge Add-ons
1. Run `npm run zip`
2. Upload `extension.zip` to the [Microsoft Edge Add-ons Developer Portal](https://partner.microsoft.com/en-us/dashboard/microsoftedge/)

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension not loading | Run `npm run build` and load the `dist` folder (not `src`) |
| Cards not appearing | Check that the URL matches a supported file pattern |
| Stale rendering after update | Reload the extension from `chrome://extensions/` |
| TypeScript errors | Run `npm run type-check` to diagnose |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in both Chrome and Edge
5. Submit a pull request

## License

MIT

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Overview](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [GitHub Copilot Customization Docs](https://docs.github.com/en/copilot/customizing-copilot)
- [Vite Documentation](https://vitejs.dev/)
