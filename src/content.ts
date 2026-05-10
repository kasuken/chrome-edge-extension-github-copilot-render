// Content script - enhances GitHub Copilot agent/skill/prompt file rendering
// Design: "Developer Luxury" — gradient headers, glass body, refined typography

interface CopilotFileInfo {
  type: 'agent' | 'skill' | 'prompt' | 'instructions'
  label: string
  icon: string
  gradient: string
  gradientDark: string
  accentColor: string
  accentLight: string
  accentSubtle: string
  glowColor: string
  pillBg: string
  pillColor: string
  pillBorder: string
}

const FILE_TYPES: Record<string, CopilotFileInfo> = {
  agent: {
    type: 'agent',
    label: 'Agent',
    icon: '🤖',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #434190 0%, #553373 100%)',
    accentColor: '#8b5cf6',
    accentLight: '#c4b5fd',
    accentSubtle: '#f5f3ff',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    pillBg: 'rgba(139, 92, 246, 0.08)',
    pillColor: '#7c3aed',
    pillBorder: 'rgba(139, 92, 246, 0.2)',
  },
  skill: {
    type: 'skill',
    label: 'Skill',
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    gradientDark: 'linear-gradient(135deg, #0c6fa1 0%, #1e40af 100%)',
    accentColor: '#3b82f6',
    accentLight: '#93c5fd',
    accentSubtle: '#eff6ff',
    glowColor: 'rgba(59, 130, 246, 0.35)',
    pillBg: 'rgba(59, 130, 246, 0.08)',
    pillColor: '#2563eb',
    pillBorder: 'rgba(59, 130, 246, 0.2)',
  },
  prompt: {
    type: 'prompt',
    label: 'Prompt',
    icon: '💬',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    gradientDark: 'linear-gradient(135deg, #0b7e58 0%, #047857 100%)',
    accentColor: '#10b981',
    accentLight: '#6ee7b7',
    accentSubtle: '#ecfdf5',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    pillBg: 'rgba(16, 185, 129, 0.08)',
    pillColor: '#059669',
    pillBorder: 'rgba(16, 185, 129, 0.2)',
  },
  instructions: {
    type: 'instructions',
    label: 'Instructions',
    icon: '📋',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    gradientDark: 'linear-gradient(135deg, #b07208 0%, #92400e 100%)',
    accentColor: '#f59e0b',
    accentLight: '#fcd34d',
    accentSubtle: '#fffbeb',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    pillBg: 'rgba(245, 158, 11, 0.08)',
    pillColor: '#b45309',
    pillBorder: 'rgba(245, 158, 11, 0.2)',
  },
}

function detectFileType(): CopilotFileInfo | null {
  const path = window.location.pathname

  // Extract the filename from the path (handles blob/tree URLs)
  const segments = path.split('/')
  const fileName = segments[segments.length - 1]?.toLowerCase() ?? ''

  if (fileName.endsWith('.agent.md')) return FILE_TYPES.agent
  if (fileName === 'skill.md') return FILE_TYPES.skill
  if (fileName.endsWith('.prompt.md')) return FILE_TYPES.prompt
  if (
    fileName.endsWith('.instructions.md') ||
    fileName === 'copilot-instructions.md'
  )
    return FILE_TYPES.instructions

  return null
}

function isGitHubFilePage(): boolean {
  return (
    window.location.hostname === 'github.com' &&
    window.location.pathname.includes('/blob/')
  )
}

interface FrontmatterEntry {
  key: string
  value: string
}

function extractFrontmatterFromTable(): {
  entries: FrontmatterEntry[]
  tableElement: Element | null
} {
  const article = document.querySelector('article.markdown-body')
  if (!article) return { entries: [], tableElement: null }

  const firstTable = article.querySelector('table')
  if (!firstTable) return { entries: [], tableElement: null }

  // Try rows from tbody first, then direct tr children
  let rows = firstTable.querySelectorAll('tbody tr')
  if (rows.length === 0) {
    rows = firstTable.querySelectorAll('tr')
  }
  if (rows.length === 0) return { entries: [], tableElement: null }

  const entries: FrontmatterEntry[] = []
  rows.forEach((row) => {
    // GitHub renders frontmatter keys as <th> and values as <td>
    const th = row.querySelector('th')
    const td = row.querySelector('td')
    if (th && td) {
      entries.push({
        key: th.textContent?.trim() ?? '',
        value: td.textContent?.trim() ?? '',
      })
      return
    }
    // Fallback: two <td> cells
    const tds = row.querySelectorAll('td')
    if (tds.length === 2) {
      entries.push({
        key: tds[0].textContent?.trim() ?? '',
        value: tds[1].textContent?.trim() ?? '',
      })
    }
  })

  if (entries.length === 0) return { entries: [], tableElement: null }

  // Validate this looks like frontmatter
  const keys = entries.map((e) => e.key.toLowerCase())
  const frontmatterKeys = [
    'name',
    'description',
    'version',
    'license',
    'compatibility',
    'metadata',
    'argument-hint',
    'tools',
    'model',
    'instructions',
    'applyto',
  ]
  const hasFrontmatterKey = keys.some((k) =>
    frontmatterKeys.some((fk) => k.includes(fk))
  )

  if (!hasFrontmatterKey) return { entries: [], tableElement: null }

  return { entries, tableElement: firstTable }
}

// Keys whose values should be rendered as pill/badge lists
const LIST_KEYS = new Set(['tools', 'applyto'])
// Keys that should never be split into pills
const SCALAR_KEYS = new Set(['model', 'name', 'description', 'version', 'license', 'argument-hint', 'compatibility'])

function isListValue(key: string, value: string): boolean {
  const k = key.toLowerCase()
  if (SCALAR_KEYS.has(k)) return false
  if (LIST_KEYS.has(k)) return true
  // Heuristic: if there are multiple space-separated tokens without regular sentence structure
  const tokens = value.split(/\s+/)
  return tokens.length >= 3 && !value.includes('. ') && tokens.every((t) => !t.endsWith(','))
}

function createMetadataCard(
  fileInfo: CopilotFileInfo,
  entries: FrontmatterEntry[]
): HTMLElement {
  const nameEntry = entries.find((e) => e.key.toLowerCase() === 'name')
  const descEntry = entries.find((e) => e.key.toLowerCase() === 'description')
  const otherEntries = entries.filter(
    (e) => !['name', 'description'].includes(e.key.toLowerCase())
  )

  const wrapper = document.createElement('div')
  wrapper.className = 'cpr-wrapper'

  const card = document.createElement('div')
  card.className = 'cpr-card'

  // ── Gradient header ──
  const header = document.createElement('div')
  header.className = 'cpr-header'
  header.style.setProperty('--cpr-gradient', fileInfo.gradient)
  header.style.setProperty('--cpr-gradient-dark', fileInfo.gradientDark)
  header.style.setProperty('--cpr-glow', fileInfo.glowColor)

  // Noise texture overlay
  const noise = document.createElement('div')
  noise.className = 'cpr-header-noise'
  header.appendChild(noise)

  // Animated shimmer accent line
  const shimmer = document.createElement('div')
  shimmer.className = 'cpr-shimmer'
  shimmer.style.setProperty('--cpr-accent', fileInfo.accentColor)
  shimmer.style.setProperty('--cpr-accent-light', fileInfo.accentLight)
  header.appendChild(shimmer)

  const headerInner = document.createElement('div')
  headerInner.className = 'cpr-header-inner'

  // Glowing icon container
  const iconWrap = document.createElement('div')
  iconWrap.className = 'cpr-icon-wrap'
  iconWrap.style.setProperty('--cpr-glow', fileInfo.glowColor)
  const iconEl = document.createElement('span')
  iconEl.className = 'cpr-icon'
  iconEl.textContent = fileInfo.icon
  iconWrap.appendChild(iconEl)

  const headerContent = document.createElement('div')
  headerContent.className = 'cpr-header-content'

  const topRow = document.createElement('div')
  topRow.className = 'cpr-header-top'

  const typeBadge = document.createElement('span')
  typeBadge.className = 'cpr-type-badge'
  typeBadge.textContent = `GitHub Copilot ${fileInfo.label}`

  topRow.appendChild(typeBadge)
  headerContent.appendChild(topRow)

  const titleEl = document.createElement('h2')
  titleEl.className = 'cpr-title'
  titleEl.textContent = nameEntry?.value ?? fileInfo.label

  headerContent.appendChild(titleEl)

  if (descEntry) {
    const descEl = document.createElement('p')
    descEl.className = 'cpr-header-desc'
    descEl.textContent = descEntry.value
    headerContent.appendChild(descEl)
  }

  headerInner.appendChild(iconWrap)
  headerInner.appendChild(headerContent)
  header.appendChild(headerInner)
  card.appendChild(header)

  // ── Body with metadata fields ──
  if (otherEntries.length > 0) {
    const body = document.createElement('div')
    body.className = 'cpr-body'
    body.style.setProperty('--cpr-accent', fileInfo.accentColor)
    body.style.setProperty('--cpr-accent-subtle', fileInfo.accentSubtle)

    const fieldsTitle = document.createElement('div')
    fieldsTitle.className = 'cpr-fields-title'
    fieldsTitle.textContent = 'Configuration'
    body.appendChild(fieldsTitle)

    const fields = document.createElement('div')
    fields.className = 'cpr-fields'

    otherEntries.forEach((entry) => {
      const field = document.createElement('div')
      field.className = 'cpr-field'

      const keyEl = document.createElement('div')
      keyEl.className = 'cpr-field-key'
      keyEl.textContent = entry.key

      field.appendChild(keyEl)

      if (isListValue(entry.key, entry.value)) {
        const pillContainer = document.createElement('div')
        pillContainer.className = 'cpr-pills'
        const tokens = entry.value.split(/[\s,]+/).filter(Boolean)
        tokens.forEach((token) => {
          const pill = document.createElement('span')
          pill.className = 'cpr-pill'
          pill.style.setProperty('--cpr-pill-bg', fileInfo.pillBg)
          pill.style.setProperty('--cpr-pill-color', fileInfo.pillColor)
          pill.style.setProperty('--cpr-pill-border', fileInfo.pillBorder)
          pill.textContent = token
          pillContainer.appendChild(pill)
        })
        field.appendChild(pillContainer)
      } else {
        const valEl = document.createElement('div')
        valEl.className = 'cpr-field-value'
        valEl.textContent = entry.value
        field.appendChild(valEl)
      }

      fields.appendChild(field)
    })

    body.appendChild(fields)
    card.appendChild(body)
  }

  wrapper.appendChild(card)
  return wrapper
}

function addSectionStyling(fileInfo: CopilotFileInfo): void {
  const article = document.querySelector('article.markdown-body')
  if (!article) return

  const headings = article.querySelectorAll(':scope > h1, :scope > h2')
  headings.forEach((heading) => {
    const el = heading as HTMLElement
    if (el.dataset.copilotStyled) return
    el.dataset.copilotStyled = 'true'

    el.style.paddingBottom = '8px'
    el.style.marginTop = '36px'
    el.style.borderBottom = '2px solid transparent'
    el.style.borderImage = `${fileInfo.gradient} 1`
    el.style.borderImageSlice = '1'
  })
}

function injectGlobalStyles(): void {
  if (document.getElementById('cpr-styles')) return

  const style = document.createElement('style')
  style.id = 'cpr-styles'
  style.textContent = `
    /* ── Fonts ── */
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    /* ── Keyframes ── */
    @keyframes cpr-shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    @keyframes cpr-fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes cpr-pulseGlow {
      0%, 100% { box-shadow: 0 0 20px var(--cpr-glow, rgba(0,0,0,0.1)); }
      50%      { box-shadow: 0 0 35px var(--cpr-glow, rgba(0,0,0,0.2)); }
    }

    /* ── Wrapper ── */
    .cpr-wrapper {
      margin-bottom: 28px;
      animation: cpr-fadeIn 0.4s ease-out;
    }
    .cpr-wrapper + hr {
      display: none;
    }

    /* ── Card ── */
    .cpr-card {
      border-radius: 16px;
      overflow: hidden;
      box-shadow:
        0 1px 2px rgba(0,0,0,0.04),
        0 4px 16px rgba(0,0,0,0.06),
        0 12px 40px rgba(0,0,0,0.04);
      transition: box-shadow 0.3s ease;
    }
    .cpr-card:hover {
      box-shadow:
        0 1px 2px rgba(0,0,0,0.04),
        0 8px 24px rgba(0,0,0,0.1),
        0 20px 60px rgba(0,0,0,0.06);
    }

    /* ── Header ── */
    .cpr-header {
      position: relative;
      background: var(--cpr-gradient);
      padding: 28px 28px 24px;
      overflow: hidden;
    }
    .cpr-header-noise {
      position: absolute;
      inset: 0;
      opacity: 0.06;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
      background-size: 128px 128px;
      pointer-events: none;
    }
    .cpr-shimmer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        var(--cpr-accent-light, #fff) 50%,
        transparent 100%
      );
      animation: cpr-shimmer 3s ease-in-out infinite;
      opacity: 0.7;
    }
    .cpr-header-inner {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      gap: 18px;
    }

    /* ── Icon ── */
    .cpr-icon-wrap {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.2);
      animation: cpr-pulseGlow 4s ease-in-out infinite;
    }
    .cpr-icon {
      font-size: 28px;
      line-height: 1;
    }

    /* ── Header content ── */
    .cpr-header-content {
      flex: 1;
      min-width: 0;
    }
    .cpr-header-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .cpr-type-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(255,255,255,0.85);
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .cpr-title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      line-height: 1.25;
      letter-spacing: -0.02em;
      text-shadow: 0 1px 2px rgba(0,0,0,0.12);
    }
    .cpr-header-desc {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: rgba(255,255,255,0.75);
      margin: 8px 0 0;
      line-height: 1.5;
      max-width: 600px;
    }

    /* ── Body ── */
    .cpr-body {
      background: #ffffff;
      padding: 22px 28px 26px;
      border-top: none;
    }
    .cpr-fields-title {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.8px;
      color: #8b8fa3;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }

    /* ── Fields ── */
    .cpr-fields {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
    .cpr-field {
      padding: 12px 14px;
      background: #f8f9fb;
      border-radius: 10px;
      border: 1px solid #eaecf0;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .cpr-field:hover {
      border-color: var(--cpr-accent, #d1d5db);
      background: var(--cpr-accent-subtle, #f3f4f6);
    }
    .cpr-field-key {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .cpr-field-value {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #1f2937;
      word-break: break-word;
      line-height: 1.5;
    }

    /* ── Pills ── */
    .cpr-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }
    .cpr-pill {
      display: inline-flex;
      align-items: center;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      font-weight: 500;
      padding: 3px 10px;
      border-radius: 6px;
      background: var(--cpr-pill-bg);
      color: var(--cpr-pill-color);
      border: 1px solid var(--cpr-pill-border);
      transition: all 0.15s ease;
      cursor: default;
    }
    .cpr-pill:hover {
      filter: brightness(0.95);
      transform: translateY(-1px);
    }

    /* ── Fallback badge ── */
    .cpr-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border-radius: 10px;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      animation: cpr-fadeIn 0.3s ease-out;
    }

    /* ━━━━ Dark mode ━━━━ */
    [data-color-mode="dark"] .cpr-card,
    [data-dark-theme="dark"] .cpr-card,
    html[data-color-mode="dark"] .cpr-card {
      box-shadow:
        0 1px 2px rgba(0,0,0,0.2),
        0 4px 16px rgba(0,0,0,0.3),
        0 12px 40px rgba(0,0,0,0.15);
    }
    [data-color-mode="dark"] .cpr-card:hover,
    [data-dark-theme="dark"] .cpr-card:hover,
    html[data-color-mode="dark"] .cpr-card:hover {
      box-shadow:
        0 1px 2px rgba(0,0,0,0.2),
        0 8px 24px rgba(0,0,0,0.4),
        0 20px 60px rgba(0,0,0,0.2);
    }

    [data-color-mode="dark"] .cpr-header,
    [data-dark-theme="dark"] .cpr-header,
    html[data-color-mode="dark"] .cpr-header {
      background: var(--cpr-gradient-dark) !important;
    }

    [data-color-mode="dark"] .cpr-body,
    [data-dark-theme="dark"] .cpr-body,
    html[data-color-mode="dark"] .cpr-body {
      background: #0d1117 !important;
    }

    [data-color-mode="dark"] .cpr-fields-title,
    [data-dark-theme="dark"] .cpr-fields-title,
    html[data-color-mode="dark"] .cpr-fields-title {
      color: #6e7681 !important;
      border-bottom-color: #21262d !important;
    }

    [data-color-mode="dark"] .cpr-field,
    [data-dark-theme="dark"] .cpr-field,
    html[data-color-mode="dark"] .cpr-field {
      background: #161b22 !important;
      border-color: #21262d !important;
    }
    [data-color-mode="dark"] .cpr-field:hover,
    [data-dark-theme="dark"] .cpr-field:hover,
    html[data-color-mode="dark"] .cpr-field:hover {
      border-color: var(--cpr-accent, #30363d) !important;
      background: #1c2128 !important;
    }

    [data-color-mode="dark"] .cpr-field-key,
    [data-dark-theme="dark"] .cpr-field-key,
    html[data-color-mode="dark"] .cpr-field-key {
      color: #6e7681 !important;
    }

    [data-color-mode="dark"] .cpr-field-value,
    [data-dark-theme="dark"] .cpr-field-value,
    html[data-color-mode="dark"] .cpr-field-value {
      color: #e6edf3 !important;
    }

    [data-color-mode="dark"] .cpr-pill,
    [data-dark-theme="dark"] .cpr-pill,
    html[data-color-mode="dark"] .cpr-pill {
      background: rgba(255,255,255,0.04) !important;
      border-color: rgba(255,255,255,0.08) !important;
      color: var(--cpr-accent-light, #93c5fd) !important;
    }

    [data-color-mode="dark"] .cpr-badge,
    [data-dark-theme="dark"] .cpr-badge,
    html[data-color-mode="dark"] .cpr-badge {
      background: rgba(255,255,255,0.06) !important;
      border-color: rgba(255,255,255,0.1) !important;
    }
  `

  document.head.appendChild(style)
}

function enhance(): void {
  if (!isGitHubFilePage()) return

  const fileInfo = detectFileType()
  if (!fileInfo) return

  // Avoid double-processing
  if (document.querySelector('.cpr-wrapper')) return

  injectGlobalStyles()

  const { entries, tableElement } = extractFrontmatterFromTable()

  if (entries.length > 0 && tableElement) {
    const card = createMetadataCard(fileInfo, entries)

    tableElement.parentElement?.insertBefore(card, tableElement)
    ;(tableElement as HTMLElement).style.display = 'none'

    const nextSibling = tableElement.nextElementSibling
    if (nextSibling?.tagName === 'HR') {
      ;(nextSibling as HTMLElement).style.display = 'none'
    }
  } else {
    const article = document.querySelector('article.markdown-body')
    if (article) {
      const badge = document.createElement('div')
      badge.className = 'cpr-wrapper'

      const inner = document.createElement('div')
      inner.className = 'cpr-badge'
      inner.style.background = fileInfo.accentSubtle
      inner.style.border = `1px solid ${fileInfo.accentLight}`
      inner.style.color = fileInfo.accentColor
      inner.textContent = `${fileInfo.icon}  GitHub Copilot ${fileInfo.label}`
      badge.appendChild(inner)

      article.insertBefore(badge, article.firstChild)
    }
  }

  addSectionStyling(fileInfo)
}

enhance()

document.addEventListener('turbo:load', () => {
  enhance()
})

const observer = new MutationObserver(() => {
  if (
    isGitHubFilePage() &&
    detectFileType() &&
    !document.querySelector('.cpr-wrapper')
  ) {
    enhance()
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})

export {}
