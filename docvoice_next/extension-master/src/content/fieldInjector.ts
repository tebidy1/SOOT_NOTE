import { MappedField } from './fieldMapper'

interface InjectionResult {
  field: MappedField
  success: boolean
  error?: string
  previousValue?: string
}

interface InjectionSummary {
  totalFields: number
  successCount: number
  errorCount: number
  results: InjectionResult[]
}

class FieldInjector {
  async fillFields(mappedFields: MappedField[]): Promise<InjectionSummary> {
    const results: InjectionResult[] = []
    let successCount = 0
    let errorCount = 0

    for (const mappedField of mappedFields) {
      try {
        const result = await this.fillField(mappedField)
        results.push(result)
        
        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        const errorResult: InjectionResult = {
          field: mappedField,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
        results.push(errorResult)
        errorCount++
      }
    }

    return {
      totalFields: mappedFields.length,
      successCount,
      errorCount,
      results
    }
  }

  private async fillField(mappedField: MappedField): Promise<InjectionResult> {
    const { field, value } = mappedField
    const element = field.element
    
    try {
      const previousValue = this.extractCurrentValue(element)
      
      let success = false
      let injectedValue = value

      switch (field.type) {
        case 'input':
          success = await this.fillInputElement(element as HTMLInputElement, injectedValue)
          break
          
        case 'textarea':
          success = await this.fillTextareaElement(element as HTMLTextAreaElement, injectedValue)
          break
          
        case 'select':
          success = await this.fillSelectElement(element as HTMLSelectElement, injectedValue)
          break
          
        case 'checkbox':
        case 'radio':
          success = await this.fillCheckableElement(element as HTMLInputElement, injectedValue)
          break
          
        case 'contenteditable':
          success = await this.fillContentEditableElement(element, injectedValue)
          break
          
        default:
          throw new Error(`Unsupported field type: ${field.type}`)
      }

      if (success) {
        await this.triggerEvents(element, 'input')
        await this.triggerEvents(element, 'change')
        
        setTimeout(() => {
          this.triggerEvents(element, 'blur')
        }, 100)
      }

      return {
        field: mappedField,
        success,
        previousValue,
        error: success ? undefined : 'Failed to inject value'
      }
    } catch (error) {
      return {
        field: mappedField,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async fillInputElement(element: HTMLInputElement, value: string): Promise<boolean> {
    try {
      const inputType = element.type
      
      if (inputType === 'checkbox' || inputType === 'radio') {
        return this.fillCheckableElement(element, value)
      }

      if (inputType === 'date' && this.isValidDate(value)) {
        element.valueAsDate = new Date(value)
      } else {
        element.value = value
      }

      await this.simulateUserInput(element, value)
      return true
    } catch (error) {
      console.error('Error filling input element:', error, element)
      return false
    }
  }

  private async fillTextareaElement(element: HTMLTextAreaElement, value: string): Promise<boolean> {
    try {
      element.value = value
      await this.simulateUserInput(element, value)
      return true
    } catch (error) {
      console.error('Error filling textarea element:', error, element)
      return false
    }
  }

  private async fillSelectElement(element: HTMLSelectElement, value: string): Promise<boolean> {
    try {
      const options = Array.from(element.options)
      
      for (const option of options) {
        if (option.value.toLowerCase() === value.toLowerCase() ||
            option.text.toLowerCase() === value.toLowerCase()) {
          option.selected = true
          await this.triggerEvents(element, 'change')
          return true
        }
      }

      for (const option of options) {
        if (option.value.toLowerCase().includes(value.toLowerCase()) ||
            option.text.toLowerCase().includes(value.toLowerCase())) {
          option.selected = true
          await this.triggerEvents(element, 'change')
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error filling select element:', error, element)
      return false
    }
  }

  private async fillCheckableElement(element: HTMLInputElement, value: string): Promise<boolean> {
    try {
      const shouldBeChecked = this.parseBoolean(value)
      
      if (element.type === 'checkbox') {
        element.checked = shouldBeChecked
      } else if (element.type === 'radio') {
        if (shouldBeChecked) {
          element.checked = true
          
          const radioName = element.name
          if (radioName) {
            const otherRadios = document.querySelectorAll(`input[type="radio"][name="${radioName}"]`)
            otherRadios.forEach((radio: HTMLInputElement) => {
              if (radio !== element) {
                radio.checked = false
              }
            })
          }
        }
      }
      
      await this.triggerEvents(element, 'change')
      return true
    } catch (error) {
      console.error('Error filling checkable element:', error, element)
      return false
    }
  }

  private async fillContentEditableElement(element: HTMLElement, value: string): Promise<boolean> {
    try {
      element.textContent = value
      await this.triggerEvents(element, 'input')
      return true
    } catch (error) {
      console.error('Error filling contenteditable element:', error, element)
      return false
    }
  }

  private async simulateUserInput(element: HTMLElement, value: string): Promise<void> {
    try {
      element.focus()
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      element.dispatchEvent(new Event('focus', { bubbles: true }))
      element.dispatchEvent(new Event('input', { bubbles: true }))
      
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (error) {
      console.error('Error simulating user input:', error)
    }
  }

  private async triggerEvents(element: HTMLElement, eventType: string): Promise<void> {
    try {
      const event = new Event(eventType, {
        bubbles: true,
        cancelable: true
      })
      
      element.dispatchEvent(event)
      
      await new Promise(resolve => setTimeout(resolve, 10))
    } catch (error) {
      console.error(`Error triggering ${eventType} event:`, error)
    }
  }

  private extractCurrentValue(element: HTMLElement): string | undefined {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked ? 'true' : 'false'
      }
      return element.value || undefined
    } else if (element instanceof HTMLTextAreaElement) {
      return element.value || undefined
    } else if (element instanceof HTMLSelectElement) {
      return element.value || undefined
    } else if (element.getAttribute('contenteditable') === 'true') {
      return element.textContent || undefined
    }
    
    return undefined
  }

  private parseBoolean(value: string): boolean {
    const lowerValue = value.toLowerCase().trim()
    
    if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
      return true
    }
    
    if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
      return false
    }

    const positiveWords = ['check', 'checked', 'select', 'selected', 'enable', 'enabled']
    const negativeWords = ['uncheck', 'unchecked', 'deselect', 'deselected', 'disable', 'disabled']
    
    for (const word of positiveWords) {
      if (lowerValue.includes(word)) {
        return true
      }
    }
    
    for (const word of negativeWords) {
      if (lowerValue.includes(word)) {
        return false
      }
    }

    return false
  }

  private isValidDate(value: string): boolean {
    const date = new Date(value)
    return !isNaN(date.getTime())
  }

  async undoLastInjection(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(['lastInjection'])
      const lastInjection = result.lastInjection
      
      if (!lastInjection) {
        return false
      }

      const { fields } = lastInjection
      
      for (const field of fields) {
        try {
          const element = document.evaluate(
            field.xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
          ).singleNodeValue as HTMLElement

          if (element && field.previousValue !== undefined) {
            this.restoreFieldValue(element, field.previousValue)
          }
        } catch (error) {
          console.error('Error undoing field injection:', error)
        }
      }

      await chrome.storage.local.remove(['lastInjection'])
      return true
    } catch (error) {
      console.error('Error undoing last injection:', error)
      return false
    }
  }

  private restoreFieldValue(element: HTMLElement, previousValue: string): void {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = previousValue === 'true'
      } else {
        element.value = previousValue
      }
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = previousValue
    } else if (element instanceof HTMLSelectElement) {
      element.value = previousValue
    } else if (element.getAttribute('contenteditable') === 'true') {
      element.textContent = previousValue
    }
    
    this.triggerEvents(element, 'input')
    this.triggerEvents(element, 'change')
  }

  async storeInjectionSnapshot(results: InjectionResult[]): Promise<void> {
    try {
      const snapshot = results.map(result => ({
        xpath: result.field.field.xpath,
        previousValue: result.previousValue,
        injectedValue: result.field.value
      }))

      await chrome.storage.local.set({
        lastInjection: {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          fields: snapshot
        }
      })
    } catch (error) {
      console.error('Error storing injection snapshot:', error)
    }
  }
}

export const fieldInjector = new FieldInjector()