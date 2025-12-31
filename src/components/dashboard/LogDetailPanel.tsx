// src/components/dashboard/LogDetailPanel.tsx

'use client';

import { useMemo } from 'react';
import { LogEntry } from '@/types';
import { useI18n } from '@/i18n/useI18n';
import { X, Copy } from 'lucide-react';

interface LogDetailPanelProps {
  log: LogEntry;
  onClose: () => void;
}

const DetailItem = ({ label, value, color }: { label: string, value: string, color?: string }) => {
  const levelColorClass =
    color === 'ERROR' ? 'text-red-600 dark:text-red-400' :
    color === 'WARN' ? 'text-yellow-700 dark:text-yellow-400' :
    color === 'INFO' ? 'text-blue-600 dark:text-blue-400' :
    color === 'DEBUG' ? 'text-green-600 dark:text-green-400' :
    'text-gray-700 dark:text-gray-300';

  return (
    <div className="flex text-sm font-medium">
      <span className="w-24 text-gray-500 dark:text-gray-400 shrink-0">{label}:</span>
      <span className={`flex-1 font-mono text-xs ${levelColorClass}`}>{value}</span>
    </div>
  );
};

export const LogDetailPanel = ({ log, onClose }: LogDetailPanelProps) => {
  const { t, language } = useI18n();
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a small notification here
  };
  
  const detailsString = useMemo(() => {
    if (!log.details) return null;

    type JSONPrimitive = string | number | boolean | null;
    type JSONValue = JSONPrimitive | { [key: string]: JSONValue } | JSONValue[];

    const sanitize = (val: JSONValue | unknown): JSONValue => {
      if (typeof val === 'string') {
        return val.replace(/`/g, '').trim();
      }
      if (Array.isArray(val)) {
        return val.map((v) => sanitize(v));
      }
      if (val && typeof val === 'object') {
        const out: { [key: string]: JSONValue } = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
          out[k] = sanitize(v);
        }
        return out;
      }
      // number | boolean | null are returned as-is
      return val as JSONValue;
    };

    const tryParse = (s: string): JSONValue | string => {
      try {
        const first = JSON.parse(s) as unknown;
        if (typeof first === 'string') {
          try { return JSON.parse(first) as JSONValue; } catch { return first; }
        }
        return first as JSONValue;
      } catch {
        const cleaned = s.replace(/`/g, '').trim();
        try { return JSON.parse(cleaned) as JSONValue; } catch { return s; }
      }
    };

    const raw = log.details as unknown;
    const parsed = typeof raw === 'string' ? tryParse(raw) : (raw as JSONValue);
    const cleaned = sanitize(parsed);

    try {
      return JSON.stringify(cleaned, null, 2);
    } catch {
      return JSON.stringify({ error: t('detailsParseError') }, null, 2);
    }
  }, [log.details, t]);

  const getLocale = () => (language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : 'en-US');

  return (
    <div className="w-[600px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl z-20 shrink-0">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('logDetails')}</h3>
        <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <DetailItem label={t('timestamp')} value={new Date(log.timestamp).toLocaleString(getLocale())} />
          <DetailItem label={t('level')} value={log.level} color={log.level} />
          <DetailItem label={t('module')} value={log.module} />
          <div className="flex items-center text-sm font-medium">
            <span className="w-24 text-gray-500 dark:text-gray-400 shrink-0">Event:</span>
            <code className="text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded mr-2">{log.eventId}</code>
          </div>
        </div>
        <hr className="border-gray-100 dark:border-gray-700" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('message')}:</p>
          <p className="text-gray-800 dark:text-gray-200 font-mono text-sm whitespace-pre-wrap p-2 bg-gray-100 dark:bg-gray-900/50 rounded">{log.message}</p>
        </div>
        {detailsString && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('structuredData')}:</p>
              <button 
                onClick={() => handleCopy(detailsString)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center transition-colors"
              >
                <Copy size={12} className="mr-1" /> {t('copyJson')}
              </button>
            </div>
            <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto max-h-96">
              <code>{detailsString}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};