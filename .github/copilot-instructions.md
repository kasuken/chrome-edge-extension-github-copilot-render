# GitHub Copilot File Renderer — Development Instructions

This is a Chrome/Edge extension that enhances the visualization of GitHub Copilot customization files (`.agent.md`, `SKILL.md`, `.prompt.md`, `.instructions.md`) on github.com. Built with TypeScript and Vite, using Manifest V3.

## Project Structure

- `src/manifest.json` - Extension manifest (Manifest V3)
- `src/background.ts` - Service worker (sets `extensionEnabled` on install)
- `src/content.ts` - Content script: detects Copilot files on GitHub, extracts YAML frontmatter, renders styled metadata cards
- `src/popup.ts` - Popup logic (toggle extension on/off via `chrome.storage.sync`)
- `src/popup.html` - Popup UI layout (dark theme, gradient header, file-type grid)
- `src/popup.css` - Popup styles
- `src/icons/` - Extension icons (16/32/48/128px)

## Architecture

### Content Script (`content.ts`)
The core logic lives here (~730 lines). Key parts:
- **`FILE_TYPES`** — config object mapping each file type (agent/skill/prompt/instructions) to its gradient colors, icon, and pill styles
- **`detectFileType()`** — matches the current URL path against known file patterns
- **`extractFrontmatterFromTable()`** — parses GitHub's rendered `<table>` (handles both `<th>+<td>` and `<td>+<td>` row formats)
- **`isListValue()`** — determines if a field should render as pills or plain text, using `LIST_KEYS` and `SCALAR_KEYS` sets
- **`createMetadataCard()`** — builds the styled card with gradient header, noise texture, shimmer animation, and field grid
- **`injectGlobalStyles()`** — injects CSS with JetBrains Mono font, keyframe animations, and dark mode rules
- **`enhance()`** — orchestrator that detects, extracts, renders, and replaces the original table
- **Navigation handling** — `MutationObserver` + `turbo:load` listener for GitHub's SPA navigation

### CSS Convention
All CSS classes use the `cpr-` prefix (e.g., `.cpr-wrapper`, `.cpr-card`, `.cpr-header`, `.cpr-pill`).

### Dark Mode
Detected via GitHub's `data-color-mode="dark"` and `data-dark-theme="dark"` attributes on `<html>`.

## Development Commands

- `npm run build` - TypeScript check + Vite build + post-build fix script
- `npm run build:watch` - Build in watch mode
- `npm run type-check` - Run TypeScript type checking only
- `npm run clean` - Clean the dist directory
- `npm run zip` - Build and create extension ZIP for store submission

## Extension APIs Used

- `chrome.storage.sync` — persists the `extensionEnabled` toggle across devices
- `chrome.runtime.onInstalled` — sets default settings on first install
- Content script injection via `manifest.json` `content_scripts` on `https://github.com/*`

## Key Design Decisions

- **No external dependencies at runtime** — all rendering is vanilla DOM manipulation
- **Scalar vs list fields** — `SCALAR_KEYS` (model, description, version, etc.) render as plain text; list-type keys (tools, tags) render as pill badges
- **Frontmatter extraction** — parses GitHub's server-rendered HTML table rather than re-fetching raw markdown
- **Design system** — "Developer Luxury" aesthetic: gradient headers, glassmorphism, noise overlays, shimmer animations

## Best Practices

- Always use Manifest V3 APIs (`chrome.action`, service workers)
- Use strict TypeScript typing throughout
- Handle async operations with proper error handling
- Validate all data extracted from the DOM
- Test in both Chrome and Edge
- Minimize permissions (`activeTab`, `storage` only)
- Never inject untrusted content — only render parsed frontmatter values
- Use `textContent` over `innerHTML` when inserting user-derived content
