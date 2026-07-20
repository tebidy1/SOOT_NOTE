export class InjectionService {
  applySmartCopy(content: string): string {
    let cleaned = content;
    cleaned = this.removeNotReportedLines(cleaned);
    cleaned = this.removeBrackets(cleaned);
    cleaned = this.normalizeWhitespace(cleaned);
    cleaned = this.ensureHeaderSpacing(cleaned);
    return cleaned;
  }

  private removeNotReportedLines(content: string): string {
    const notReportedRegex = /^[\s\-\*]*.*?(?::)?\s*\[Not\s+Reported\]\s*$/gim;
    return content.replace(notReportedRegex, '').replace(/\n\s*\n/g, '\n').trim();
  }

  private removeBrackets(content: string): string {
    return content.replace(/\[([^\]]+)\]/g, '$1');
  }

  private normalizeWhitespace(content: string): string {
    const lines = content.split('\n');
    const normalized = lines.map((line) => line.replace(/[ \t]+/g, ' ').trimEnd());
    const result: string[] = [];
    let blankCount = 0;
    for (const line of normalized) {
      if (line.trim() === '') {
        blankCount++;
        if (blankCount <= 1) result.push(line);
      } else {
        blankCount = 0;
        result.push(line);
      }
    }
    return result.join('\n').trim();
  }

  private ensureHeaderSpacing(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const isHeader =
        trimmed.endsWith(':') &&
        trimmed.replace(/[^A-Za-z]/g, '') === trimmed.replace(/[^A-Za-z]/g, '').toUpperCase() &&
        trimmed.replace(/[^A-Za-z]/g, '').length >= 2;
      if (isHeader && i > 0 && result[result.length - 1].trim() !== '') {
        result.push('');
      }
      result.push(lines[i]);
    }
    return result.join('\n');
  }

  validateContent(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!content || content.trim().length === 0) {
      errors.push('المحتوى فارغ');
    }
    if (content.length > 10000) {
      errors.push('المحتوى طويل جداً (الحد الأقصى 10000 حرف)');
    }
    const bracketCount = (content.match(/\[/g) || []).length;
    if (bracketCount > 50) {
      errors.push('عدد كبير جداً من الأقواس (الحد الأقصى 50)');
    }
    const lineCount = content.split('\n').length;
    if (lineCount > 100) {
      errors.push('عدد كبير جداً من الأسطر (الحد الأقصى 100)');
    }
    return { isValid: errors.length === 0, errors };
  }
}

export const injectionService = new InjectionService();
