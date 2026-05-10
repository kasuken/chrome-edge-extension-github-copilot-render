// Background service worker
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ extensionEnabled: true })
  }
})

export {}
