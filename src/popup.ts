// Popup script
const enabledCheckbox = document.getElementById('enabled-checkbox') as HTMLInputElement
const statusDiv = document.getElementById('status') as HTMLDivElement

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings()
  setupEventListeners()
})

async function loadSettings(): Promise<void> {
  try {
    const data = await chrome.storage.sync.get(['extensionEnabled'])
    enabledCheckbox.checked = data.extensionEnabled !== false
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

function setupEventListeners(): void {
  enabledCheckbox.addEventListener('change', async () => {
    await chrome.storage.sync.set({ extensionEnabled: enabledCheckbox.checked })
    showStatus(
      enabledCheckbox.checked ? 'Extension enabled' : 'Extension disabled',
      'success'
    )
  })
}

function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
  statusDiv.textContent = message
  statusDiv.className = `status ${type}`

  setTimeout(() => {
    statusDiv.textContent = ''
    statusDiv.className = 'status'
  }, 2000)
}

export {}
