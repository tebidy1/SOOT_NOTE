import { fieldExtractor } from './fieldExtractor'
import { fieldMapper } from './fieldMapper'
import { fieldInjector } from './fieldInjector'
import { fieldPreview } from './fieldPreview'

console.log('ScribeFlow Content Script loaded')

interface Message {
  type: string
  [key: string]: any
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('Content script received message:', message.type)

  switch (message.type) {
    case 'SMART_COPY':
      handleSmartCopy(message.content)
      break

    case 'INJECT_FIELDS':
      handleInjectFields(message.extractedFields, message.fieldMappings)
      break

    case 'INJECT_CONTENT':
      handleInjectContent(message.content, message.template)
      break

    case 'SCAN_PAGE':
      handleScanPage()
      break

    case 'PREVIEW_FIELDS':
      handlePreviewFields(message.content)
      break

    default:
      console.warn('Unknown message type:', message.type)
  }

  return true
})

function handleSmartCopy(content: string) {
  try {
    const cleanedContent = content.replace(/\[([^\]]+)\]/g, '$1')
    navigator.clipboard.writeText(cleanedContent)
    
    showNotification('Content copied to clipboard (smart format)', 'success')
  } catch (error) {
    console.error('Smart copy failed:', error)
    showNotification('Failed to copy content', 'error')
  }
}

function handleInjectFields(extractedFields: Record<string, any>, fieldMappings?: any[]) {
  try {
    if (fieldMappings && fieldMappings.length > 0) {
      injectWithFieldMappings(fieldMappings)
    } else {
      injectWithExtractedFields(extractedFields)
    }
  } catch (error) {
    console.error('Field injection failed:', error)
    showNotification('Failed to inject fields', 'error')
  }
}

function injectWithFieldMappings(fieldMappings: any[]) {
  let filledCount = 0

  for (const mapping of fieldMappings) {
    if (!mapping.value || mapping.confidence < 0.5) continue

    const selector = `[name="${mapping.form_field}"]`
    const element = document.querySelector(selector) as HTMLElement | null
    if (!element) continue

    const success = fillElementByType(element, mapping.value)
    if (success) filledCount++
  }

  if (filledCount > 0) {
    showNotification(`Successfully filled ${filledCount} fields`, 'success')
  } else {
    showNotification('No matching fields found on page', 'warning')
  }
}

function fillElementByType(element: HTMLElement, value: string): boolean {
  try {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = true
      } else {
        element.value = value
      }
      triggerInputEvents(element)
      return true
    }

    if (element instanceof HTMLTextAreaElement) {
      element.value = value
      triggerInputEvents(element)
      return true
    }

    if (element instanceof HTMLSelectElement) {
      const options = Array.from(element.options)
      for (const option of options) {
        if (option.value === value || option.text === value ||
            option.value.toLowerCase() === value.toLowerCase() ||
            option.text.toLowerCase() === value.toLowerCase()) {
          option.selected = true
          element.dispatchEvent(new Event('change', { bubbles: true }))
          return true
        }
      }
      return false
    }

    if (element.getAttribute('contenteditable') === 'true') {
      element.textContent = value
      element.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    }

    return false
  } catch (error) {
    console.error('Error filling element:', error)
    return false
  }
}

function triggerInputEvents(element: HTMLElement) {
  element.focus()
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
  setTimeout(() => element.dispatchEvent(new Event('blur', { bubbles: true })), 100)
}

function injectWithExtractedFields(extractedFields: Record<string, any>) {
  const fields = fieldExtractor.scanPage()
  console.log('Found fields on page:', fields.length)

  const flatData = flattenExtractedFields(extractedFields)
  console.log('Flattened extracted data:', flatData)

  const mappingResult = fieldMapper.mapFields(flatData, fields)
  console.log('Mapped fields:', mappingResult)

  fieldInjector.fillFields(mappingResult.mappedFields).then(injectionResults => {
    console.log('Injection results:', injectionResults)

    if (injectionResults.successCount > 0) {
      showNotification(`Successfully filled ${injectionResults.successCount} fields`, 'success')
    } else {
      showNotification('No matching fields found on page', 'warning')
    }

    trackInjection(injectionResults)
  })
}

function flattenExtractedFields(extractedFields: Record<string, any>): Record<string, string> {
  const data: Record<string, string> = {}

  for (const [key, value] of Object.entries(extractedFields)) {
    if (value === null || value === undefined) continue

    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== null && subValue !== undefined) {
          data[subKey] = String(subValue)
        }
      }
    } else {
      data[key] = String(value)
    }
  }

  return data
}

function handleInjectContent(content: string, template?: any) {
  try {
    const fields = fieldExtractor.scanPage()
    console.log('Found fields on page:', fields.length)

    const extractedData = extractDataFromContent(content)
    console.log('Extracted data from content:', extractedData)

    const mappingResult = fieldMapper.mapFields(extractedData, fields, template)
    console.log('Mapped fields:', mappingResult)

    fieldInjector.fillFields(mappingResult.mappedFields).then(injectionResults => {
      console.log('Injection results:', injectionResults)

      if (injectionResults.successCount > 0) {
        showNotification(`Successfully filled ${injectionResults.successCount} fields`, 'success')
      } else {
        showNotification('No fields were filled', 'warning')
      }

      trackInjection(injectionResults)
    })
  } catch (error) {
    console.error('Content injection failed:', error)
    showNotification('Failed to inject content', 'error')
  }
}

function handleScanPage() {
  try {
    const fields = fieldExtractor.scanPage()
    chrome.runtime.sendMessage({
      type: 'PAGE_SCANNED',
      fields: fields
    })
  } catch (error) {
    console.error('Page scan failed:', error)
  }
}

function handlePreviewFields(content: string) {
  try {
    const extractedData = extractDataFromContent(content)
    const fields = fieldExtractor.scanPage()
    
    fieldPreview.showPreview(extractedData, fields)
  } catch (error) {
    console.error('Preview failed:', error)
  }
}

function extractDataFromContent(content: string): Record<string, string> {
  const data: Record<string, string> = {}
  const bracketRegex = /\[([^\]]+)\]/g
  let match
  let index = 1

  while ((match = bracketRegex.exec(content)) !== null) {
    const key = `field_${index}`
    data[key] = match[1]
    index++
  }

  const lines = content.split('\n')
  lines.forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_')
      const value = line.substring(colonIndex + 1).trim()
      
      if (value && !value.startsWith('[') && !value.endsWith(']')) {
        data[key] = value
      }
    }
  })

  return data
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  const notification = document.createElement('div')
  notification.className = `scribe-flow-notification ${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${getNotificationIcon(type)}</div>
      <div class="notification-message">${message}</div>
    </div>
  `

  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: getNotificationColor(type),
    color: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '10000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    maxWidth: '300px',
    animation: 'slideIn 0.3s ease-out'
  })

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)

  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .notification-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `
  document.head.appendChild(style)
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✗'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ℹ'
    default:
      return '•'
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'success':
      return '#10b981'
    case 'error':
      return '#ef4444'
    case 'warning':
      return '#f59e0b'
    case 'info':
      return '#3b82f6'
    default:
      return '#6b7280'
  }
}

function trackInjection(results: any) {
  const injectionLog = {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    results: results,
    userAgent: navigator.userAgent
  }

  chrome.storage.local.get(['injectionHistory'], (data) => {
    const history = data.injectionHistory || []
    history.unshift(injectionLog)
    
    if (history.length > 50) {
      history.pop()
    }
    
    chrome.storage.local.set({ injectionHistory: history })
  })
}

window.addEventListener('load', () => {
  console.log('Page loaded, ScribeFlow ready')
})

export {}