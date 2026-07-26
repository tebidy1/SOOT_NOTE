'use client';

import { useRef, useEffect, useCallback } from 'react';

interface NoteViewerProps {
  content: string;
  onChange?: (text: string) => void;
  placeholder?: string;
}

function escapeHTML(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.endsWith(':')) return false;
  const withoutColon = trimmed.slice(0, -1);
  const letters = withoutColon.replace(/[^A-Za-z]/g, '');
  return letters.length >= 2 && letters === letters.toUpperCase();
}

function lineToHTML(line: string): string {
  if (line.trim() === '') {
    return '<div style="min-height:1.1em"><br></div>';
  }
  if (isHeaderLine(line)) {
    return `<div class="mt-3.5 mb-1 py-1.5 px-2.5 bg-blue-500/10 dark:bg-blue-500/15 border-l-4 border-blue-500 font-extrabold text-blue-950 dark:text-white text-sm rounded-r-md tracking-wide">${escapeHTML(line.trim())}</div>`;
  }
  const escaped = escapeHTML(line);
  const withTokens = escaped.replace(
    /\[Not\s+Reported\]/gi,
    '<span style="color:#ef4444;background:rgba(239,68,68,0.08);font-style:italic;padding:1px 4px;border-radius:3px;cursor:pointer;border:1px solid rgba(239,68,68,0.15)" data-token="not-reported">$&</span>',
  );
  return `<div style="padding:1.5px 0;line-height:1.65">${withTokens}</div>`;
}

function contentToHTML(content: string): string {
  if (!content.trim()) return '';
  return content.split('\n').map(lineToHTML).join('');
}

export function generateClipboardHTML(plainText: string): string {
  const lines = plainText.split('\n');
  const parts: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      parts.push('<p style="margin:0;line-height:0.6em">&nbsp;</p>');
      continue;
    }
    if (isHeaderLine(trimmed)) {
      parts.push(
        `<p style="font-family:Arial,Helvetica,sans-serif;font-size:13pt;font-weight:bold;color:#1e3a8a;border-bottom:1.5px solid #93c5fd;padding-bottom:3px;margin:14px 0 4px 0">${escapeHTML(trimmed)}</p>`,
      );
    } else if (trimmed.startsWith('-')) {
      const c = trimmed.slice(1).trim();
      parts.push(
        `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11.5pt;color:#111827;margin:3px 0 3px 16px">&#8226; ${escapeHTML(c)}</p>`,
      );
    } else {
      parts.push(
        `<p style="font-family:Arial,Helvetica,sans-serif;font-size:11.5pt;color:#111827;margin:3px 0">${escapeHTML(trimmed)}</p>`,
      );
    }
  }
  return `<html><head><meta charset="utf-8"></head><body><div style="max-width:720px;padding:16px;font-family:Arial,Helvetica,sans-serif">${parts.join('')}</div></body></html>`;
}

export default function NoteViewer({ content, onChange, placeholder }: NoteViewerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef(content);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = contentToHTML(content);
      prevContentRef.current = content;
    }
  }, []);

  useEffect(() => {
    if (content !== prevContentRef.current && editorRef.current && !isInternalChangeRef.current) {
      editorRef.current.innerHTML = contentToHTML(content);
      prevContentRef.current = content;
    }
    isInternalChangeRef.current = false;
  }, [content]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChangeRef.current = true;
    const text = editorRef.current.innerText ?? '';
    prevContentRef.current = text;
    onChange?.(text);
  }, [onChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.token === 'not-reported') {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onClick={handleClick}
      onPaste={handlePaste}
      data-placeholder={placeholder || ''}
      className="w-full min-h-[300px] p-4 focus:outline-none text-gray-800"
      style={{
        fontFamily: '"SF Mono", "Fira Code", ui-monospace, monospace',
        fontSize: '13.5px',
        lineHeight: '1.65',
        caretColor: '#3b82f6',
      }}
    />
  );
}
