interface InjectionRequest {
  content: string
  template?: any
  tabId?: number
}

interface InjectionResult {
  success: boolean
  injectedCount: number
  totalFields: number
  errors: string[]
  tabId?: number
}

class InjectionService {
  async smartCopyAndInject(request: InjectionRequest): Promise<InjectionResult> {
    try {
      const cleanedContent = this.applySmartCopy(request.content)
      
      const tabId = request.tabId || await this.getActiveTabId()
      if (!tabId) {
        throw new Error('No active tab found')
      }

      const result = await this.injectToTab(tabId, {
        type: 'INJECT_CONTENT',
        content: cleanedContent,
        template: request.template
      })

      return result
    } catch (error) {
      console.error('Smart copy and inject failed:', error)
      return {
        success: false,
        injectedCount: 0,
        totalFields: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  applySmartCopy(content: string): string {
    let cleanedContent = content

    // 1. Remove lines whose only value is [Not Reported]
    cleanedContent = this.removeNotReportedLines(cleanedContent)
    // 2. Remove any remaining bracket wrappers (e.g. [value] -> value)
    cleanedContent = this.removeBrackets(cleanedContent)
    // 3. Normalise per-line whitespace only — NEVER collapse newlines
    cleanedContent = this.normalizeWhitespace(cleanedContent)
    // 4. Ensure every header line has a blank line before it
    cleanedContent = this.ensureHeaderSpacing(cleanedContent)

    return cleanedContent
  }

  private removeNotReportedLines(content: string): string {
    // This removes lines where the only meaningful content is [Not Reported]
    // e.g. "- History: [Not Reported]" or "[Not Reported]"
    const notReportedRegex = /^[\s\-\*]*.*?(?::)?\s*\[Not\s+Reported\]\s*$/gim;
    
    // First remove the lines, then clean up any double newlines created
    return content
      .replace(notReportedRegex, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private removeBrackets(content: string): string {
    // Unwrap decorative brackets [value] -> value, but KEEP [?...] uncertainty
    // markers intact so an unverified term stays flagged even after injection.
    return content.replace(/\[([^\]]+)\]/g, (full, inner) =>
      inner.startsWith('?') ? full : inner
    )
  }

  private normalizeWhitespace(content: string): string {
    // Fix each line individually — never touch newlines!
    const lines = content.split('\n')
    const normalized = lines.map(line =>
      line.replace(/[ \t]+/g, ' ').trimEnd()
    )
    // Remove runs of more than 2 consecutive blank lines
    const result: string[] = []
    let blankCount = 0
    for (const line of normalized) {
      if (line.trim() === '') {
        blankCount++
        if (blankCount <= 1) result.push(line)
      } else {
        blankCount = 0
        result.push(line)
      }
    }
    return result.join('\n').trim()
  }

  private ensureHeaderSpacing(content: string): string {
    // Add a blank line before each ALL-CAPS header (e.g. "SUBJECTIVE (S):")
    // so sections are visually separated when pasted into plain-text fields
    const lines = content.split('\n')
    const result: string[] = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      const isHeader =
        trimmed.endsWith(':') &&
        trimmed.replace(/[^A-Za-z]/g, '') ===
          trimmed.replace(/[^A-Za-z]/g, '').toUpperCase() &&
        trimmed.replace(/[^A-Za-z]/g, '').length >= 2
      // Add blank line before header (if not already there)
      if (isHeader && i > 0 && result[result.length - 1].trim() !== '') {
        result.push('')
      }
      result.push(line)
    }
    return result.join('\n')
  }

  private async getActiveTabId(): Promise<number | undefined> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      return tabs[0]?.id
    } catch (error) {
      console.error('Failed to get active tab:', error)
      return undefined
    }
  }

  private async injectToTab(tabId: number, message: any): Promise<InjectionResult> {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message error:', chrome.runtime.lastError)
          resolve({
            success: false,
            injectedCount: 0,
            totalFields: 0,
            errors: [chrome.runtime.lastError.message || 'Failed to communicate with content script'],
            tabId
          })
          return
        }

        if (response) {
          resolve({
            success: response.success || false,
            injectedCount: response.injectedCount || 0,
            totalFields: response.totalFields || 0,
            errors: response.errors || [],
            tabId
          })
        } else {
          resolve({
            success: false,
            injectedCount: 0,
            totalFields: 0,
            errors: ['No response from content script'],
            tabId
          })
        }
      })
    })
  }

  async scanCurrentPage(): Promise<any> {
    try {
      const tabId = await this.getActiveTabId()
      if (!tabId) {
        throw new Error('No active tab found')
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: 'SCAN_PAGE' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Scan error:', chrome.runtime.lastError)
            resolve({ fields: [], error: chrome.runtime.lastError.message })
            return
          }
          resolve(response || { fields: [] })
        })
      })
    } catch (error) {
      console.error('Page scan failed:', error)
      return { fields: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async previewInjection(content: string): Promise<any> {
    try {
      const tabId = await this.getActiveTabId()
      if (!tabId) {
        throw new Error('No active tab found')
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { 
          type: 'PREVIEW_FIELDS',
          content: content
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Preview error:', chrome.runtime.lastError)
            resolve({ success: false, error: chrome.runtime.lastError.message })
            return
          }
          resolve(response || { success: false })
        })
      })
    } catch (error) {
      console.error('Preview failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async undoLastInjection(): Promise<boolean> {
    try {
      const tabId = await this.getActiveTabId()
      if (!tabId) {
        throw new Error('No active tab found')
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { type: 'UNDO_INJECTION' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Undo error:', chrome.runtime.lastError)
            resolve(false)
            return
          }
          resolve(response?.success || false)
        })
      })
    } catch (error) {
      console.error('Undo failed:', error)
      return false
    }
  }

  async getInjectionHistory(): Promise<any[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['injectionHistory'], (result) => {
        resolve(result.injectionHistory || [])
      })
    })
  }

  async clearInjectionHistory(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['injectionHistory'], () => {
        resolve()
      })
    })
  }

  formatContentForInjection(content: string, template?: any): string {
    let formatted = content

    if (template?.fields) {
      const templateFields = template.fields.map((f: any) => f.name).filter(Boolean)
      
      const lines = formatted.split('\n')
      const templateLines: string[] = []

      templateFields.forEach((field: string) => {
        const fieldLine = lines.find(line => 
          line.toLowerCase().includes(field.toLowerCase())
        )
        
        if (fieldLine) {
          templateLines.push(fieldLine)
        } else {
          templateLines.push(`${field}: `)
        }
      })

      if (templateLines.length > 0) {
        formatted = templateLines.join('\n')
      }
    }

    return formatted
  }

  validateContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!content || content.trim().length === 0) {
      errors.push('Content is empty')
    }

    if (content.length > 10000) {
      errors.push('Content is too long (max 10000 characters)')
    }

    const bracketCount = (content.match(/\[/g) || []).length
    if (bracketCount > 50) {
      errors.push('Too many field brackets (max 50)')
    }

    const lineCount = content.split('\n').length
    if (lineCount > 100) {
      errors.push('Too many lines (max 100)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const injectionService = new InjectionService()