'use client';

import { useState, useEffect, useRef } from 'react';

interface PatternHighlightEditorProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  height?: string;
}

export default function PatternHighlightEditor({
  content,
  onChange,
  readOnly = false,
  height = '300px',
}: PatternHighlightEditorProps) {
  const [text, setText] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(content);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onChange?.(newText);
  };

  const extractFields = (content: string) => {
    const bracketRegex = /\[([^\]]+)\]/g;
    const matches: { text: string; value: string; start: number; end: number }[] = [];
    let match;
    while ((match = bracketRegex.exec(content)) !== null) {
      matches.push({
        text: match[0],
        value: match[1],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return matches;
  };

  const highlightContent = (content: string) => {
    const fields = extractFields(content);
    if (fields.length === 0) return content;
    let result = '';
    let lastIndex = 0;
    fields.forEach((field) => {
      result += content.substring(lastIndex, field.start);
      result += `<span class="bg-orange-100 text-orange-800 border border-orange-300 rounded px-1 py-0.5 mx-0.5">${field.text}</span>`;
      lastIndex = field.end;
    });
    result += content.substring(lastIndex);
    return result;
  };

  const handleFieldClick = (index: number) => {
    if (!textareaRef.current) return;
    const fields = extractFields(text);
    const field = fields[index];
    if (!field) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(field.start, field.end);
  };

  const insertField = () => {
    if (!textareaRef.current || readOnly) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    let newText = text;
    if (selectedText) {
      newText = text.substring(0, start) + `[${selectedText}]` + text.substring(end);
    } else {
      newText = text.substring(0, start) + '[ ]' + text.substring(start);
    }
    setText(newText);
    onChange?.(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = selectedText ? start + selectedText.length + 2 : start + 1;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const clearAllFields = () => {
    const newText = text.replace(/\[([^\]]+)\]/g, '$1');
    setText(newText);
    onChange?.(newText);
  };

  const copyPlainText = () => {
    const plainText = text.replace(/\[([^\]]+)\]/g, '$1');
    navigator.clipboard.writeText(plainText);
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{extractFields(text).length} حقل (حقول) تم اكتشافها</div>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={insertField}
              className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors"
            >
              إضافة حقل
            </button>
            <button
              type="button"
              onClick={clearAllFields}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              إزالة الحقول
            </button>
          </div>
        )}
      </div>

      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
        {readOnly ? (
          <div
            ref={previewRef}
            className="p-4 min-h-[200px] whitespace-pre-wrap font-mono text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightContent(text) }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.hasAttribute('data-field-index')) {
                const index = parseInt(target.getAttribute('data-field-index') || '0', 10);
                handleFieldClick(index);
              }
            }}
          />
        ) : (
          <>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              className="w-full p-4 font-mono text-sm leading-relaxed resize-none outline-none"
              style={{ height, minHeight: '200px' }}
              spellCheck={false}
              placeholder="اكتب ملاحظاتك هنا... استخدم [أقواس] لتحديد الحقول التي سيتم استخراجها."
            />
            <div
              className="absolute inset-0 pointer-events-none p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-hidden"
              style={{ height, minHeight: '200px' }}
              dangerouslySetInnerHTML={{ __html: highlightContent(text) }}
            />
          </>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">معاينة الحقول</div>
          <button
            type="button"
            onClick={copyPlainText}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            نسخ النص العادي
          </button>
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {extractFields(text).map((field, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white border border-gray-200 rounded px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleFieldClick(index)}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                <span className="font-mono text-sm">{field.value}</span>
              </div>
              <div className="text-xs text-gray-500">{field.text.length} حرف</div>
            </div>
          ))}

          {extractFields(text).length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">لم يتم اكتشاف حقول. استخدم [أقواس] لتحديد الحقول.</div>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 border-t border-gray-200 pt-3 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-sm" />
          <span>الحقول الموجودة بين أقواس سيتم استخراجها تلقائياً</span>
        </div>
      </div>
    </div>
  );
}
