'use client';

import React, { useState } from 'react';
import { LLMConfig } from '@/lib/types';
import { Settings, X, Key, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSaveConfig: (newConfig: LLMConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [provider, setProvider] = useState<LLMConfig['provider']>(config.provider || 'mock');
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [model, setModel] = useState<string>(config.model || 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState<string>(config.baseUrl || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim(),
      baseUrl: baseUrl.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">AI Provider &amp; Model Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">AI Engine Mode</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as LLMConfig['provider'])}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="mock">⚡ Built-in Demo Engine (Works 100% Offline / No API Key Needed)</option>
              <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
              <option value="groq">Groq (Llama 3 70B Fast Inference)</option>
              <option value="openrouter">OpenRouter / Local LLM</option>
            </select>
          </div>

          {provider === 'mock' ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-1">
              <span className="font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Zero-Config Demo Mode Ready
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-200">
                The built-in engine performs real token-level quote verification, semantic retrieval, and agent tool execution directly on your uploaded files.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">API Key</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. gpt-4o-mini"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Custom Base URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://api.openai.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-950/40 transition cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
