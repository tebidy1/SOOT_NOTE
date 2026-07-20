import { FormField } from './fieldExtractor'
import { fieldMapper } from './fieldMapper'

interface PreviewData {
  data: Record<string, string>
  fields: FormField[]
  mappings: any[]
}

class FieldPreview {
  private previewOverlay: HTMLElement | null = null
  private currentPreviewData: PreviewData | null = null

  showPreview(data: Record<string, string>, fields: FormField[]): void {
    if (this.previewOverlay) {
      this.hidePreview()
    }

    const mappingResult = fieldMapper.mapFields(data, fields)
    
    this.currentPreviewData = {
      data,
      fields,
      mappings: mappingResult.mappedFields
    }

    this.createPreviewOverlay(mappingResult)
    this.highlightFields(mappingResult.mappedFields)
  }

  hidePreview(): void {
    if (this.previewOverlay) {
      this.previewOverlay.remove()
      this.previewOverlay = null
    }

    this.clearHighlights()
    this.currentPreviewData = null
  }

  private createPreviewOverlay(mappingResult: any): void {
    const overlay = document.createElement('div')
    overlay.className = 'scribe-flow-preview-overlay'
    
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: '9998',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })

    const modal = this.createPreviewModal(mappingResult)
    overlay.appendChild(modal)

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hidePreview()
      }
    })

    document.body.appendChild(overlay)
    this.previewOverlay = overlay

    this.addKeyboardShortcuts()
  }

  private createPreviewModal(mappingResult: any): HTMLElement {
    const modal = document.createElement('div')
    modal.className = 'preview-modal'
    
    Object.assign(modal.style, {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '800px',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      position: 'relative'
    })

    const header = this.createPreviewHeader()
    const content = this.createPreviewContent(mappingResult)
    const footer = this.createPreviewFooter()

    modal.appendChild(header)
    modal.appendChild(content)
    modal.appendChild(footer)

    return modal
  }

  private createPreviewHeader(): HTMLElement {
    const header = document.createElement('div')
    header.className = 'preview-header'
    
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb'
    })

    const title = document.createElement('h2')
    title.textContent = 'Preview Field Injection'
    Object.assign(title.style, {
      margin: '0',
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827'
    })

    const closeButton = document.createElement('button')
    closeButton.innerHTML = '&times;'
    closeButton.className = 'close-button'
    Object.assign(closeButton.style, {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#6b7280',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px'
    })
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = '#f3f4f6'
    })
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent'
    })
    closeButton.addEventListener('click', () => this.hidePreview())

    header.appendChild(title)
    header.appendChild(closeButton)

    return header
  }

  private createPreviewContent(mappingResult: any): HTMLElement {
    const content = document.createElement('div')
    content.className = 'preview-content'

    const stats = this.createStatsSection(mappingResult)
    const mappings = this.createMappingsSection(mappingResult.mappedFields)
    const unmatched = this.createUnmatchedSection(
      mappingResult.unmatchedFields,
      mappingResult.unmatchedData
    )

    content.appendChild(stats)
    content.appendChild(mappings)
    content.appendChild(unmatched)

    return content
  }

  private createStatsSection(mappingResult: any): HTMLElement {
    const stats = document.createElement('div')
    stats.className = 'preview-stats'
    
    Object.assign(stats.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    })

    const totalFields = mappingResult.mappedFields.length + mappingResult.unmatchedFields.length
    const matchRate = totalFields > 0 
      ? Math.round((mappingResult.mappedFields.length / totalFields) * 100)
      : 0

    const statItems = [
      {
        label: 'Total Fields',
        value: totalFields.toString(),
        color: '#3b82f6'
      },
      {
        label: 'Matched',
        value: mappingResult.mappedFields.length.toString(),
        color: '#10b981'
      },
      {
        label: 'Match Rate',
        value: `${matchRate}%`,
        color: matchRate >= 80 ? '#10b981' : matchRate >= 50 ? '#f59e0b' : '#ef4444'
      }
    ]

    statItems.forEach(item => {
      const statItem = document.createElement('div')
      statItem.className = 'stat-item'
      
      Object.assign(statItem.style, {
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '8px',
        textAlign: 'center'
      })

      const value = document.createElement('div')
      value.textContent = item.value
      Object.assign(value.style, {
        fontSize: '24px',
        fontWeight: '700',
        color: item.color,
        marginBottom: '4px'
      })

      const label = document.createElement('div')
      label.textContent = item.label
      Object.assign(label.style, {
        fontSize: '14px',
        color: '#6b7280'
      })

      statItem.appendChild(value)
      statItem.appendChild(label)
      stats.appendChild(statItem)
    })

    return stats
  }

  private createMappingsSection(mappedFields: any[]): HTMLElement {
    const section = document.createElement('div')
    section.className = 'mappings-section'
    
    Object.assign(section.style, {
      marginBottom: '24px'
    })

    const sectionTitle = document.createElement('h3')
    sectionTitle.textContent = `Field Mappings (${mappedFields.length})`
    Object.assign(sectionTitle.style, {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827'
    })

    const mappingsList = document.createElement('div')
    mappingsList.className = 'mappings-list'
    Object.assign(mappingsList.style, {
      maxHeight: '200px',
      overflowY: 'auto',
      border: '1px solid #e5e7eb',
      borderRadius: '8px'
    })

    if (mappedFields.length === 0) {
      const emptyMessage = document.createElement('div')
      emptyMessage.textContent = 'No fields matched'
      Object.assign(emptyMessage.style, {
        padding: '16px',
        textAlign: 'center',
        color: '#6b7280',
        fontStyle: 'italic'
      })
      mappingsList.appendChild(emptyMessage)
    } else {
      mappedFields.forEach((mapping, index) => {
        const mappingItem = this.createMappingItem(mapping, index)
        mappingsList.appendChild(mappingItem)
      })
    }

    section.appendChild(sectionTitle)
    section.appendChild(mappingsList)

    return section
  }

  private createMappingItem(mapping: any, index: number): HTMLElement {
    const item = document.createElement('div')
    item.className = 'mapping-item'
    
    Object.assign(item.style, {
      padding: '12px 16px',
      borderBottom: index < mapping.field.mappedFields.length - 1 ? '1px solid #e5e7eb' : 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    })

    const confidenceIndicator = document.createElement('div')
    confidenceIndicator.className = 'confidence-indicator'
    const confidenceColor = mapping.confidence >= 0.8 ? '#10b981' : 
                          mapping.confidence >= 0.6 ? '#f59e0b' : '#ef4444'
    Object.assign(confidenceIndicator.style, {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: confidenceColor
    })

    const content = document.createElement('div')
    content.className = 'mapping-content'
    content.style.flex = '1'

    const fieldName = document.createElement('div')
    fieldName.textContent = mapping.field.name || 'Unnamed field'
    Object.assign(fieldName.style, {
      fontWeight: '500',
      color: '#111827',
      marginBottom: '2px'
    })

    const mappingInfo = document.createElement('div')
    mappingInfo.className = 'mapping-info'
    Object.assign(mappingInfo.style, {
      fontSize: '12px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    })

    const sourceKey = document.createElement('span')
    sourceKey.textContent = `← ${mapping.sourceKey}`
    
    const confidence = document.createElement('span')
    confidence.textContent = `${Math.round(mapping.confidence * 100)}%`
    
    const valuePreview = document.createElement('span')
    valuePreview.textContent = `"${mapping.value.length > 20 ? mapping.value.substring(0, 20) + '...' : mapping.value}"`
    valuePreview.style.fontStyle = 'italic'

    mappingInfo.appendChild(sourceKey)
    mappingInfo.appendChild(confidence)
    mappingInfo.appendChild(valuePreview)

    content.appendChild(fieldName)
    content.appendChild(mappingInfo)

    item.appendChild(confidenceIndicator)
    item.appendChild(content)

    item.addEventListener('mouseenter', () => {
      this.highlightField(mapping.field.element, true)
    })
    
    item.addEventListener('mouseleave', () => {
      this.highlightField(mapping.field.element, false)
    })

    return item
  }

  private createUnmatchedSection(unmatchedFields: FormField[], unmatchedData: Record<string, string>): HTMLElement {
    const section = document.createElement('div')
    section.className = 'unmatched-section'

    const hasUnmatchedFields = unmatchedFields.length > 0
    const hasUnmatchedData = Object.keys(unmatchedData).length > 0

    if (!hasUnmatchedFields && !hasUnmatchedData) {
      return section
    }

    const sectionTitle = document.createElement('h3')
    sectionTitle.textContent = 'Unmatched Items'
    Object.assign(sectionTitle.style, {
      margin: '0 0 16px 0',
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827'
    })

    section.appendChild(sectionTitle)

    if (hasUnmatchedFields) {
      const fieldsTitle = document.createElement('h4')
      fieldsTitle.textContent = `Unmatched Fields (${unmatchedFields.length})`
      Object.assign(fieldsTitle.style, {
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: '500',
        color: '#6b7280'
      })

      const fieldsList = document.createElement('div')
      fieldsList.className = 'unmatched-list'
      Object.assign(fieldsList.style, {
        marginBottom: '16px'
      })

      unmatchedFields.forEach((field, index) => {
        const fieldItem = document.createElement('div')
        fieldItem.textContent = field.name || 'Unnamed field'
        Object.assign(fieldItem.style, {
          padding: '8px 12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          marginBottom: index < unmatchedFields.length - 1 ? '8px' : '0',
          fontSize: '12px',
          color: '#dc2626'
        })
        fieldsList.appendChild(fieldItem)
      })

      section.appendChild(fieldsTitle)
      section.appendChild(fieldsList)
    }

    if (hasUnmatchedData) {
      const dataTitle = document.createElement('h4')
      dataTitle.textContent = `Unmatched Data (${Object.keys(unmatchedData).length})`
      Object.assign(dataTitle.style, {
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: '500',
        color: '#6b7280'
      })

      const dataList = document.createElement('div')
      dataList.className = 'unmatched-data-list'

      Object.entries(unmatchedData).forEach(([key, value], index, array) => {
        const dataItem = document.createElement('div')
        dataItem.textContent = `${key}: "${value.length > 30 ? value.substring(0, 30) + '...' : value}"`
        Object.assign(dataItem.style, {
          padding: '8px 12px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '6px',
          marginBottom: index < array.length - 1 ? '8px' : '0',
          fontSize: '12px',
          color: '#d97706'
        })
        dataList.appendChild(dataItem)
      })

      section.appendChild(dataTitle)
      section.appendChild(dataList)
    }

    return section
  }

  private createPreviewFooter(): HTMLElement {
    const footer = document.createElement('div')
    footer.className = 'preview-footer'
    
    Object.assign(footer.style, {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb'
    })

    const cancelButton = this.createButton('Cancel', () => this.hidePreview(), 'secondary')
    const injectButton = this.createButton('Inject Fields', () => this.injectFields(), 'primary')

    footer.appendChild(cancelButton)
    footer.appendChild(injectButton)

    return footer
  }

  private createButton(text: string, onClick: () => void, variant: 'primary' | 'secondary'): HTMLElement {
    const button = document.createElement('button')
    button.textContent = text
    button.className = `preview-button ${variant}`
    
    const baseStyles = {
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }

    if (variant === 'primary') {
      Object.assign(button.style, {
        ...baseStyles,
        backgroundColor: '#3b82f6',
        color: 'white'
      })
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#2563eb'
      })
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#3b82f6'
      })
    } else {
      Object.assign(button.style, {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: '#6b7280',
        border: '1px solid #d1d5db'
      })
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#f9fafb'
      })
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent'
      })
    }

    button.addEventListener('click', onClick)

    return button
  }

  private highlightFields(mappedFields: any[]): void {
    mappedFields.forEach(mapping => {
      this.highlightField(mapping.field.element, true)
    })
  }

  private highlightField(element: HTMLElement, highlight: boolean): void {
    if (highlight) {
      element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)'
      element.style.transition = 'box-shadow 0.3s'
      element.style.zIndex = '9999'
      element.style.position = 'relative'
    } else {
      element.style.boxShadow = ''
      element.style.zIndex = ''
      element.style.position = ''
    }
  }

  private clearHighlights(): void {
    const highlightedElements = document.querySelectorAll('[style*="box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5)"]')
    highlightedElements.forEach(element => {
      (element as HTMLElement).style.boxShadow = ''
      ;(element as HTMLElement).style.zIndex = ''
      ;(element as HTMLElement).style.position = ''
    })
  }

  private addKeyboardShortcuts(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.hidePreview()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    if (this.previewOverlay) {
      this.previewOverlay.addEventListener('remove', () => {
        document.removeEventListener('keydown', handleKeyDown)
      })
    }
  }

  private injectFields(): void {
    if (this.currentPreviewData) {
      chrome.runtime.sendMessage({
        type: 'INJECT_CONTENT',
        content: this.currentPreviewData.data,
        previewData: this.currentPreviewData
      })
      
      this.hidePreview()
    }
  }
}

export const fieldPreview = new FieldPreview()