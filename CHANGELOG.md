# Changelog

## [0.0.1] - 2026-05-10

### Added

- **File type detection** — Identifies GitHub Copilot customization files by URL path: `.agent.md`, `AGENTS.md`, `SKILL.md`, `.prompt.md`, `.instructions.md`, and `copilot-instructions.md`
- **YAML frontmatter extraction** — Parses GitHub's server-rendered `<table>` (supports both `<th>+<td>` and `<td>+<td>` row formats)
- **Metadata card rendering** — Replaces the plain frontmatter table with a styled card featuring a gradient header, noise texture, and shimmer animation
- **Pill badge rendering** — List-type fields (e.g., `tools`, `tags`, `applyTo`) render as interactive pill badges per file type color scheme
- **Scalar field rendering** — Single-value fields (e.g., `model`, `description`, `version`, `argument-hint`) render as plain text, never split into pills
- **Per-type visual identity** — Four distinct color schemes with gradient headers:
  - Agent (`.agent.md`) — Purple gradient
  - Skill (`SKILL.md`) — Blue gradient
  - Prompt (`.prompt.md`) — Green gradient
  - Instructions (`.instructions.md`) — Amber gradient
- **Dark mode support** — Automatically adapts to GitHub's `data-color-mode="dark"` attribute
- **JetBrains Mono typography** — Loaded from Google Fonts for a developer-focused aesthetic
- **SPA navigation handling** — `MutationObserver` + `turbo:load` listener keeps the card in sync across GitHub's client-side navigation
- **Extension toggle** — Popup UI with an on/off switch that persists across devices via `chrome.storage.sync`
- **Popup redesign** — Dark-themed popup with gradient header, 2×2 file-type grid, and per-type hover colors matching the content card palette
- **Manifest V3** — Service worker background script, `activeTab` and `storage` permissions only
- **Build pipeline** — TypeScript + Vite 7 with a post-build PowerShell fix script; `npm run zip` produces a store-ready archive

[0.0.1]: https://github.com/kasuken/chrome-edge-extension-github-copilot-render/releases/tag/v0.0.1
