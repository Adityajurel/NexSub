import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Sparkles, Send, Copy, Check, MessageSquare } from 'lucide-react';
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
        <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
          <p className="text-xs text-sky-800">
            Powered by Claude 3.5 Sonnet / NexSub Embedded Intelligence. Ask questions in natural language regarding revenue, churn, overdue invoices, and financial reporting metrics.
          </p>
        </div>

        {/* Suggested Queries */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1.5">Suggested Prompts:</span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQueries.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleSend(sq);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors text-left"
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
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <Button onClick={() => handleSend()} loading={loading} disabled={!query.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
