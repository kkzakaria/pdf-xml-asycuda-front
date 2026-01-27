'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/Button';

interface XmlPreviewProps {
  xmlContent: string;
  filename: string;
  onDownload: () => void;
}

export function XmlPreview({ xmlContent, filename, onDownload }: XmlPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedXml = useMemo(() => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const serializer = new XMLSerializer();
      const rawXml = serializer.serializeToString(xmlDoc);

      let formatted = '';
      let indent = 0;
      const lines = rawXml.replace(/>\s*</g, '>\n<').split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 1);
        }

        formatted += '  '.repeat(indent) + trimmed + '\n';

        if (
          trimmed.startsWith('<') &&
          !trimmed.startsWith('</') &&
          !trimmed.startsWith('<?') &&
          !trimmed.endsWith('/>') &&
          !trimmed.includes('</')
        ) {
          indent += 1;
        }
      }

      return formatted;
    } catch {
      return xmlContent;
    }
  }, [xmlContent]);

  const previewLines = useMemo(() => {
    const lines = formattedXml.split('\n');
    const maxLines = isExpanded ? lines.length : 30;
    return {
      content: lines.slice(0, maxLines).join('\n'),
      hasMore: lines.length > 30,
      totalLines: lines.length,
    };
  }, [formattedXml, isExpanded]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          XML Preview
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy
              </>
            )}
          </Button>
          <Button variant="primary" size="sm" onClick={onDownload}>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download {filename}
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-700">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
          <span className="text-sm text-zinc-400">{filename}</span>
          <span className="text-xs text-zinc-500">
            {previewLines.totalLines} lines
          </span>
        </div>
        <pre className="max-h-[400px] overflow-auto p-4 text-sm">
          <code className="text-green-400">{previewLines.content}</code>
        </pre>
        {previewLines.hasMore && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-zinc-950 to-transparent pb-4 pt-12">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(true)}
            >
              Show all ({previewLines.totalLines} lines)
            </Button>
          </div>
        )}
        {isExpanded && (
          <div className="border-t border-zinc-800 bg-zinc-900 px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
