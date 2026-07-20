import { FormField } from './fieldExtractor'

interface MappedField {
  field: FormField
  value: string
  confidence: number
  sourceKey: string
  transformation?: string
}

interface MappingResult {
  mappedFields: MappedField[]
  unmatchedFields: FormField[]
  unmatchedData: Record<string, string>
}

class FieldMapper {
  private fieldMappingRules: Record<string, string[]> = {
    // Name fields
    'name': ['name', 'fullname', 'patient_name', 'patientname', 'full_name'],
    'first_name': ['firstname', 'fname', 'first', 'givenname', 'given_name'],
    'last_name': ['lastname', 'lname', 'last', 'surname', 'familyname'],
    
    // Contact fields
    'email': ['email', 'mail', 'email_address', 'e_mail'],
    'phone': ['phone', 'telephone', 'mobile', 'cellphone', 'cell', 'tel'],
    'address': ['address', 'street', 'street_address'],
    'city': ['city', 'town'],
    'state': ['state', 'province', 'region'],
    'zip': ['zip', 'zipcode', 'postalcode', 'postal_code'],
    'country': ['country', 'nation'],
    
    // Date fields
    'date_of_birth': ['dob', 'birthdate', 'birth_date', 'dateofbirth'],
    'date': ['date', 'visit_date', 'appointment_date', 'encounter_date'],
    
    // Medical fields
    'age': ['age'],
    'gender': ['gender', 'sex'],
    'patient_id': ['patientid', 'patient_id', 'mrn', 'medical_record_number'],
    'diagnosis': ['diagnosis', 'dx', 'condition'],
    'symptoms': ['symptoms', 'complaints', 'chief_complaint'],
    'medication': ['medication', 'drug', 'medicine', 'prescription'],
    'dosage': ['dosage', 'dose'],
    'frequency': ['frequency', 'how_often'],
    'duration': ['duration', 'how_long', 'treatment_duration'],
    'allergies': ['allergies', 'allergy'],
    'history': ['history', 'medical_history', 'past_history'],
    'examination': ['examination', 'exam', 'physical_exam'],
    'assessment': ['assessment', 'impression'],
    'plan': ['plan', 'treatment_plan', 'management'],
    'follow_up': ['followup', 'follow_up', 'next_visit'],
    
    // Insurance fields
    'insurance_id': ['insuranceid', 'insurance_id', 'policy_number'],
    'insurance_provider': ['insurance', 'provider', 'insurance_company'],
    
    // General fields
    'notes': ['notes', 'comments', 'remarks', 'additional_notes'],
    'signature': ['signature', 'sign', 'consent_signature'],
    'consent': ['consent', 'agreement', 'authorization']
  }

  private valueTransformations: Record<string, (value: string) => string> = {
    'date': (value) => this.transformDate(value),
    'phone': (value) => this.transformPhone(value),
    'gender': (value) => this.transformGender(value),
    'boolean': (value) => this.transformBoolean(value),
    'uppercase': (value) => value.toUpperCase(),
    'lowercase': (value) => value.toLowerCase(),
    'trim': (value) => value.trim(),
    'capitalize': (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
  }

  mapFields(
    data: Record<string, string>,
    fields: FormField[],
    template?: any
  ): MappingResult {
    const mappedFields: MappedField[] = []
    const unmatchedFields: FormField[] = []
    const unmatchedData = { ...data }

    fields.forEach(field => {
      const mapping = this.findBestMapping(field, data, template)
      
      if (mapping) {
        mappedFields.push(mapping)
        delete unmatchedData[mapping.sourceKey]
      } else {
        unmatchedFields.push(field)
      }
    })

    return {
      mappedFields,
      unmatchedFields,
      unmatchedData
    }
  }

  private findBestMapping(
    field: FormField,
    data: Record<string, string>,
    template?: any
  ): MappedField | null {
    let bestMatch: { key: string; confidence: number } | null = null

    const fieldName = field.name.toLowerCase()
    const fieldLabel = field.label?.toLowerCase() || ''
    const fieldPlaceholder = field.placeholder?.toLowerCase() || ''

    const searchStrings = [
      fieldName,
      fieldLabel,
      fieldPlaceholder,
      ...fieldName.split('_'),
      ...fieldLabel.split(/\s+/),
      ...fieldPlaceholder.split(/\s+/)
    ].filter(s => s.length > 0)

    for (const [dataKey, dataValue] of Object.entries(data)) {
      if (!dataValue || dataValue.trim() === '') continue

      const dataKeyLower = dataKey.toLowerCase()
      const dataValueLower = dataValue.toLowerCase()

      let confidence = 0

      for (const searchString of searchStrings) {
        if (searchString && dataKeyLower.includes(searchString)) {
          confidence = Math.max(confidence, 0.8)
          break
        }
        
        if (searchString && dataValueLower.includes(searchString)) {
          confidence = Math.max(confidence, 0.6)
        }
      }

      for (const [canonicalName, variations] of Object.entries(this.fieldMappingRules)) {
        if (variations.some(v => fieldName.includes(v) || fieldLabel.includes(v))) {
          const matchingDataKey = Object.keys(data).find(k => 
            k.toLowerCase().includes(canonicalName) || 
            data[k].toLowerCase().includes(canonicalName)
          )
          
          if (matchingDataKey) {
            confidence = Math.max(confidence, 0.9)
            break
          }
        }
      }

      if (template && template.fields) {
        const templateField = template.fields.find((f: any) => 
          f.name?.toLowerCase() === fieldName ||
          f.label?.toLowerCase() === fieldLabel
        )
        
        if (templateField && templateField.mappingPatterns) {
          const hasPatternMatch = templateField.mappingPatterns.some((pattern: string) =>
            dataKeyLower.includes(pattern) || dataValueLower.includes(pattern)
          )
          
          if (hasPatternMatch) {
            confidence = Math.max(confidence, 0.95)
          }
        }
      }

      if (confidence > 0) {
        confidence += this.calculateSemanticSimilarity(fieldName, dataKeyLower)
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { key: dataKey, confidence }
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.5) {
      let value = data[bestMatch.key]
      const transformation = this.determineTransformation(field, value)
      
      if (transformation) {
        value = this.valueTransformations[transformation](value)
      }

      return {
        field,
        value,
        confidence: bestMatch.confidence,
        sourceKey: bestMatch.key,
        transformation
      }
    }

    return null
  }

  private calculateSemanticSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 0.3
    
    const words1 = str1.split(/[_\s]+/)
    const words2 = str2.split(/[_\s]+/)
    
    let matches = 0
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.length > 2 && word2.length > 2) {
          if (word1 === word2) {
            matches += 1
          } else if (word1.startsWith(word2) || word2.startsWith(word1)) {
            matches += 0.5
          }
        }
      }
    }
    
    return (matches / Math.max(words1.length, words2.length)) * 0.2
  }

  private determineTransformation(field: FormField, value: string): string | undefined {
    const fieldName = field.name.toLowerCase()
    const fieldType = field.attributes.type?.toLowerCase()
    
    if (fieldName.includes('date') || fieldType === 'date') {
      return 'date'
    }
    
    if (fieldName.includes('phone') || fieldName.includes('tel')) {
      return 'phone'
    }
    
    if (fieldName.includes('gender') || fieldName.includes('sex')) {
      return 'gender'
    }
    
    if (fieldType === 'checkbox' || fieldType === 'radio') {
      return 'boolean'
    }
    
    if (field.attributes.pattern?.includes('[A-Z]')) {
      return 'uppercase'
    }
    
    if (field.attributes.pattern?.includes('[a-z]')) {
      return 'lowercase'
    }
    
    return 'trim'
  }

  private transformDate(value: string): string {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
      
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/
      ]
      
      for (const format of formats) {
        const match = value.match(format)
        if (match) {
          const year = match[3] || match[1]
          const month = match[2] || match[2]
          const day = match[1] || match[3]
          return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
      }
    } catch (error) {
      console.error('Date transformation error:', error)
    }
    
    return value
  }

  private transformPhone(value: string): string {
    const digits = value.replace(/\D/g, '')
    
    if (digits.length === 10) {
      return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
    }
    
    return value
  }

  private transformGender(value: string): string {
    const lowerValue = value.toLowerCase()
    
    if (lowerValue.includes('male') || lowerValue === 'm') {
      return 'Male'
    }
    
    if (lowerValue.includes('female') || lowerValue === 'f') {
      return 'Female'
    }
    
    if (lowerValue.includes('other') || lowerValue.includes('prefer')) {
      return 'Other'
    }
    
    return value
  }

  private transformBoolean(value: string): string {
    const lowerValue = value.toLowerCase()
    
    if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
      return 'true'
    }
    
    if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
      return 'false'
    }
    
    return value
  }

  getMappingRules(): Record<string, string[]> {
    return this.fieldMappingRules
  }

  addCustomMappingRule(canonicalName: string, variations: string[]): void {
    this.fieldMappingRules[canonicalName] = [
      ...(this.fieldMappingRules[canonicalName] || []),
      ...variations
    ]
  }
}

export const fieldMapper = new FieldMapper()