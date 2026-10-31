import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Sparkles, Send, Copy, Check } from 'lucide-react';
import api from '../../api/client';

export const AIAssistantModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);

  const suggestedQueries = [
    'Show me the total revenue collected and active subscriptions',
    'What is our current overdue invoice status and risk?',
    'Summarize our customer growth and plan health'
  ];

  const handleSend = async (qText) => {
    const textToSend = qText || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const res = await api.post('/ai/query', { query: textToSend });
      if (res.data.success) {
        setResponse(res.data.data);
      }
    } catch (err) {
      setResponse({
        source: 'Error',
        answer: 'Failed to query assistant: ' + (err.response?.data?.message || err.message)
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (response?.answer) {
      navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="NexSub Financial AI Assistant" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-[#f1d99c] bg-[#fff4d8] p-3.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#171717]">
            <Sparkles className="h-4 w-4 text-[#f5c875]" />
          </span>
          <p className="pt-0.5 text-xs leading-5 text-[#5b4a2d]">
            Ask about revenue, subscriptions, overdue invoices, and customer health. Responses are grounded in your live NexSub data.
          </p>
        </div>

        {/* Suggested Queries */}
        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#716d65]">Suggested prompts</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleSend(sq);
                }}
                className="rounded-lg border border-[#e5ded2] bg-[#fcfbf8] px-2.5 py-1.5 text-left text-xs text-[#514c45] transition-colors hover:border-[#d9cdb9] hover:bg-[#f7f1e5]"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Response Box */}
        {response && (
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-sky-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> {response.source}
              </span>
              <button
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap text-sm text-slate-200">{response.answer}</p>
            {response.rag?.sources?.length > 0 && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Grounded in: {response.rag.sources.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question (e.g. How much revenue is overdue?)..."
            className="flex-1 rounded-xl border border-[#dedbd5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm text-[#171717] outline-none focus:border-[#171717] focus:ring-4 focus:ring-[#171717]/5"
          />
          <Button onClick={() => handleSend()} loading={loading} disabled={!query.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
