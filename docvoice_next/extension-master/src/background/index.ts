console.log('ScribeFlow Background Script loaded')

if (typeof chrome !== 'undefined' && chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
    console.warn('Failed to set side panel behavior:', err)
  })
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('ScribeFlow extension installed')
  
  chrome.storage.local.set({
    installedAt: new Date().toISOString(),
    version: '1.0.0'
  })
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message?.type)

  switch (message?.type) {
    case 'PAGE_SCANNED':
      handlePageScanned(message.fields)
      break

    case 'INJECTION_COMPLETE':
      handleInjectionComplete(message.results)
      break

    case 'GET_INJECTION_HISTORY':
      handleGetInjectionHistory(sendResponse)
      return true

    case 'CLEAR_INJECTION_HISTORY':
      handleClearInjectionHistory(sendResponse)
      return true

    default:
      console.warn('Unknown message type:', message?.type)
  }

  return false
})

function handlePageScanned(fields: any[]) {
  console.log(`Page scanned with ${fields?.length || 0} fields`)
  
  chrome.storage.local.get(['scanHistory'], (result) => {
    const history = result.scanHistory || []
    history.unshift({
      timestamp: new Date().toISOString(),
      fieldCount: fields?.length || 0,
      url: chrome.tabs ? 'unknown' : 'background'
    })
    
    if (history.length > 100) {
      history.pop()
    }
    
    chrome.storage.local.set({ scanHistory: history })
  })
}

function handleInjectionComplete(results: any) {
  console.log('Injection complete:', results)
  
  if (results && results.successCount > 0) {
    showNotification(
      'ScribeFlow',
      `Successfully filled ${results.successCount} field(s)`,
      'success'
    )
  }
}

function handleGetInjectionHistory(sendResponse: (response: any) => void) {
  chrome.storage.local.get(['injectionHistory'], (result) => {
    sendResponse(result.injectionHistory || [])
  })
}

function handleClearInjectionHistory(sendResponse: (response: any) => void) {
  chrome.storage.local.remove(['injectionHistory'], () => {
    sendResponse({ success: true })
  })
}

function showNotification(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: title,
    message: message,
    priority: 2
  })
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (chrome.runtime.lastError) return
  if (changeInfo.status === 'complete' && tab && tab.url) {
    console.log('Tab updated:', tab.url)
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return
    console.log('Tab activated:', tab.url)
  })
})

setInterval(() => {
  chrome.storage.local.get(['authToken'], (result) => {
    if (result && result.authToken) {
      console.log('Token present, checking validity...')
    }
  })
}, 300000)

export {}