interface FormField {
  element: HTMLElement
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'contenteditable'
  name: string
  label?: string
  placeholder?: string
  value?: string
  required?: boolean
  attributes: Record<string, string>
  xpath?: string
  boundingRect?: DOMRect
}

class FieldExtractor {
  private commonFieldNames = [
    'name', 'firstname', 'lastname', 'fname', 'lname',
    'email', 'mail',
    'phone', 'mobile', 'tel',
    'address', 'street', 'city', 'state', 'zip', 'country',
    'date', 'dob', 'birthdate', 'birthday',
    'age',
    'gender', 'sex',
    'patient', 'patient_id', 'patientid',
    'doctor', 'physician',
    'diagnosis', 'symptoms',
    'medication', 'prescription',
    'notes', 'comments', 'remarks',
    'signature', 'consent'
  ]

  private medicalFieldPatterns = [
    /patient.*name/i,
    /date.*of.*birth/i,
    /dob/i,
    /age/i,
    /gender/i,
    /address/i,
    /phone/i,
    /email/i,
    /emergency.*contact/i,
    /insurance.*id/i,
    /policy.*number/i,
    /diagnosis/i,
    /symptoms/i,
    /medication/i,
    /dosage/i,
    /frequency/i,
    /duration/i,
    /allergies/i,
    /history/i,
    /examination/i,
    /assessment/i,
    /plan/i,
    /follow.*up/i,
    /prescription/i,
    /signature/i,
    /consent/i
  ]

  scanPage(): FormField[] {
    const fields: FormField[] = []

    try {
      const inputElements = document.querySelectorAll('input, textarea, select')
      inputElements.forEach(element => {
        const field = this.extractFieldFromElement(element as HTMLElement)
        if (field) {
          fields.push(field)
        }
      })

      const contentEditableElements = document.querySelectorAll('[contenteditable="true"]')
      contentEditableElements.forEach(element => {
        const field = this.extractFieldFromElement(element as HTMLElement)
        if (field) {
          fields.push(field)
        }
      })

      console.log(`Found ${fields.length} form fields on the page`)
      return fields
    } catch (error) {
      console.error('Error scanning page for fields:', error)
      return []
    }
  }

  private extractFieldFromElement(element: HTMLElement): FormField | null {
    try {
      const tagName = element.tagName.toLowerCase()
      const type = this.getElementType(element)
      
      if (!type) return null

      const name = this.extractFieldName(element)
      const label = this.findLabelForElement(element)
      const placeholder = element.getAttribute('placeholder') || undefined
      const value = this.extractValue(element)
      const required = element.hasAttribute('required') || 
                      element.getAttribute('aria-required') === 'true'
      
      const attributes: Record<string, string> = {}
      Array.from(element.attributes).forEach(attr => {
        attributes[attr.name] = attr.value
      })

      const xpath = this.getElementXPath(element)
      const boundingRect = element.getBoundingClientRect()

      return {
        element,
        type,
        name,
        label,
        placeholder,
        value,
        required,
        attributes,
        xpath,
        boundingRect
      }
    } catch (error) {
      console.error('Error extracting field from element:', error, element)
      return null
    }
  }

  private getElementType(element: HTMLElement): FormField['type'] | null {
    const tagName = element.tagName.toLowerCase()
    
    if (tagName === 'input') {
      const type = (element as HTMLInputElement).type
      switch (type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'number':
        case 'date':
        case 'password':
        case 'search':
        case 'url':
          return 'input'
        case 'checkbox':
          return 'checkbox'
        case 'radio':
          return 'radio'
        default:
          return null
      }
    } else if (tagName === 'textarea') {
      return 'textarea'
    } else if (tagName === 'select') {
      return 'select'
    } else if (element.getAttribute('contenteditable') === 'true') {
      return 'contenteditable'
    }
    
    return null
  }

  private extractFieldName(element: HTMLElement): string {
    const name = element.getAttribute('name') ||
                element.getAttribute('id') ||
                element.getAttribute('data-name') ||
                element.getAttribute('aria-label') ||
                ''

    if (name) {
      return this.normalizeFieldName(name)
    }

    const label = this.findLabelForElement(element)
    if (label) {
      return this.normalizeFieldName(label)
    }

    const placeholder = element.getAttribute('placeholder')
    if (placeholder) {
      return this.normalizeFieldName(placeholder)
    }

    const className = element.className
    if (className) {
      const classNames = className.split(' ')
      for (const cls of classNames) {
        if (this.commonFieldNames.some(field => cls.toLowerCase().includes(field))) {
          return this.normalizeFieldName(cls)
        }
      }
    }

    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private normalizeFieldName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  private findLabelForElement(element: HTMLElement): string | undefined {
    const id = element.id
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) {
        return label.textContent?.trim() || undefined
      }
    }

    const parent = element.parentElement
    if (parent) {
      const label = parent.querySelector('label')
      if (label) {
        return label.textContent?.trim() || undefined
      }

      const previousSibling = element.previousElementSibling
      if (previousSibling && previousSibling.tagName.toLowerCase() === 'label') {
        return previousSibling.textContent?.trim() || undefined
      }
    }

    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) {
      return ariaLabel.trim()
    }

    const title = element.getAttribute('title')
    if (title) {
      return title.trim()
    }

    return undefined
  }

  private extractValue(element: HTMLElement): string | undefined {
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

  private getElementXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`
    }

    const parts: string[] = []
    let current: HTMLElement | null = element
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0
      let sibling = current.previousSibling
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && 
            sibling.nodeName === current.nodeName) {
          index++
        }
        sibling = sibling.previousSibling
      }
      
      const tagName = current.tagName.toLowerCase()
      const part = index > 0 ? `${tagName}[${index + 1}]` : tagName
      parts.unshift(part)
      
      current = current.parentElement
    }

    return parts.length ? `/${parts.join('/')}` : ''
  }

  isMedicalField(fieldName: string): boolean {
    const normalizedName = fieldName.toLowerCase()
    
    if (this.commonFieldNames.some(name => normalizedName.includes(name))) {
      return true
    }

    return this.medicalFieldPatterns.some(pattern => pattern.test(normalizedName))
  }

  getFieldConfidence(field: FormField): number {
    let confidence = 0.5

    if (field.name && this.isMedicalField(field.name)) {
      confidence += 0.3
    }

    if (field.label && this.isMedicalField(field.label)) {
      confidence += 0.2
    }

    if (field.placeholder && this.isMedicalField(field.placeholder)) {
      confidence += 0.1
    }

    if (field.required) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }
}

export const fieldExtractor = new FieldExtractor()