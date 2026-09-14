import React, { useState, useEffect } from 'react';
import { FileCode2, Layers, Database, Network, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';
import { api } from '../services/api.js';

export const DocsPage: React.FC = () => {
  const [docsData, setDocsData] = useState<{
    projectName: string;
    tagline: string;
    version: string;
    architectureSections: Array<{ id: string; title: string; content: string }>;
  } | null>(null);
  const [activeSectionId, setActiveSectionId] = useState('system-arch');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/docs');
        setDocsData(res.data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, []);

  const activeSection = docsData?.architectureSections.find((s) => s.id === activeSectionId);

  const handleCopy = () => {
    if (activeSection) {
      navigator.clipboard.writeText(activeSection.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
          <FileCode2 className="w-4 h-4 text-emerald-600" /> Technical Architecture & System Blueprint
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Hồ Sơ Thiết Kế Hệ Thống {docsData?.projectName || 'FOOTBALL CONNECT'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Phiên bản {docsData?.version || '2.0.0-PROD'} • Kiến trúc phân tầng Full-stack chuẩn Senior Engineer
        </p>
      </div>

      {/* Grid: Nav Tabs Left, Content Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-4 space-y-2 h-fit shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
            Mục lục Kiến trúc
          </h3>
          {docsData?.architectureSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                activeSectionId === sec.id
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="truncate">{sec.title}</span>
              {activeSectionId === sec.id && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
            </button>
          ))}
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              {activeSection?.title}
            </h2>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Đã sao chép!' : 'Sao chép'}
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 overflow-x-auto">
            <pre className="font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {activeSection?.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
