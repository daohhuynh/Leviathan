'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSwarmStore } from '@/store/useSwarmStore';

type SendState = 'idle' | 'sending' | 'success' | 'error';

export default function EmailModal() {
  const showEmailModal = useSwarmStore((s) => s.showEmailModal);
  const setShowEmailModal = useSwarmStore((s) => s.setShowEmailModal);
  const setEmailSent = useSwarmStore((s) => s.setEmailSent);
  const generatedLOI = useSwarmStore((s) => s.generatedLOI);
  const targetItem = useSwarmStore((s) => s.targetItem);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState(
    `LEVIATHAN — Letter of Intent: ${targetItem}`,
  );
  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamically sync the subject line whenever the user searches a new target item
  useEffect(() => {
    setSubject(`LEVIATHAN — Letter of Intent: ${targetItem}`);
  }, [targetItem]);

  const handleClose = useCallback(() => {
    setShowEmailModal(false);
    // Reset state after close animation
    setTimeout(() => {
      setSendState('idle');
      setErrorMessage('');
    }, 300);
  }, [setShowEmailModal]);

  const handleSend = useCallback(async () => {
    if (!to.trim()) {
      setErrorMessage('Please enter a recipient email address.');
      setSendState('error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
      setErrorMessage('Please enter a valid email address.');
      setSendState('error');
      return;
    }

    setSendState('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to.trim(),
          subject,
          body: generatedLOI ?? 'No LOI document was generated.',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSendState('success');
      setEmailSent(true);

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setErrorMessage(message);
      setSendState('error');
    }
  }, [to, subject, generatedLOI, setEmailSent, handleClose]);

  return (
    <AnimatePresence>
      {showEmailModal && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-cyan-500/10"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Send LOI via Email
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Deliver the Letter of Intent directly
                </p>
              </div>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 transition-all hover:border-white/20 hover:bg-white/5"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4 px-6 py-5">
              {/* To */}
              <div>
                <label
                  htmlFor="email-to"
                  className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                >
                  Recipient Email
                </label>
                <input
                  id="email-to"
                  type="email"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    if (sendState === 'error') setSendState('idle');
                  }}
                  placeholder="buyer@company.com"
                  disabled={sendState === 'sending' || sendState === 'success'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="email-subject"
                  className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500"
                >
                  Subject
                </label>
                <input
                  id="email-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sendState === 'sending' || sendState === 'success'}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
                />
              </div>

              {/* Preview */}
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Attachment Preview
                </p>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <pre className="whitespace-pre-wrap break-words font-mono text-[10px] text-slate-500">
                    {generatedLOI
                      ? generatedLOI.substring(0, 500) + '...'
                      : 'No document generated.'}
                  </pre>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {sendState === 'error' && errorMessage && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-2.5"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <p className="text-xs text-rose-300">{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success message */}
              <AnimatePresence>
                {sendState === 'success' && (
                  <motion.div
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-xs text-emerald-300">
                      Email sent successfully! Check your inbox.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-white/10 px-6 py-4">
              <button
                onClick={handleSend}
                disabled={sendState === 'sending' || sendState === 'success'}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 disabled:opacity-50"
              >
                {sendState === 'sending' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : sendState === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Sent!
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
