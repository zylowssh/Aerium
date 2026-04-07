import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Wifi, WifiOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  error?: boolean;
}

const SUGGESTIONS = [
  'Quel est mon CO₂ actuel ?',
  'Mes alertes actives',
  'Conseils ventilation',
  'Prévisions qualité air',
];

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Bonjour ! Je suis **Aéria** 🌿, votre assistante qualité de l\'air.\n\nPosez-moi vos questions sur vos capteurs, alertes, ou comment améliorer votre environnement intérieur.',
  timestamp: new Date(),
};

// ---------------------------------------------------------------------------
// Streaming helper
// ---------------------------------------------------------------------------

async function* streamChat(
  messages: { role: string; content: string }[],
  token: string,
  signal: AbortSignal
): AsyncGenerator<{ token?: string; done?: boolean; error?: string }> {
  const resp = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!resp.ok) {
    yield { error: `Erreur serveur (${resp.status})` };
    return;
  }

  if (!resp.body) {
    yield { error: 'Réponse de streaming invalide (body vide).' };
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      try {
        yield JSON.parse(payload);
      } catch { /* skip malformed */ }
    }
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  );
}

const MessageBubble = memo(function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn('flex gap-2 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted border border-border'
        )}
      >
        {isUser
          ? <User className="w-3.5 h-3.5" />
          : <Bot className="w-3.5 h-3.5 text-primary" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[84%] px-3 py-2 rounded-2xl',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm text-sm leading-relaxed'
            : msg.error
            ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        {msg.streaming && !msg.content ? (
          <TypingDots />
        ) : isUser || msg.streaming ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
        ) : (
          <MarkdownRenderer content={msg.content} />
        )}
        {/* Streaming cursor */}
        {msg.streaming && msg.content && !isUser && (
          <span className="inline-block w-0.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse align-text-bottom" />
        )}
      </div>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<Message[]>([WELCOME]);
  const streamBufferRef = useRef('');
  const flushTimerRef = useRef<number | null>(null);
  const streamTimeoutRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const flushBufferedToken = useCallback((assistantId: string) => {
    const pending = streamBufferRef.current;
    if (!pending) return;

    streamBufferRef.current = '';
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId ? { ...m, content: m.content + pending } : m
      )
    );
  }, []);

  // Check AI key status on first open
  useEffect(() => {
    if (open && isConfigured === null) {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      fetch(`${API_BASE_URL}/ai/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setIsConfigured(d.configured ?? false))
        .catch(() => setIsConfigured(false));
    }
  }, [open, isConfigured]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    if (!overrideText) setInput('');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Build history (skip welcome, skip errors)
    const history = [...messagesRef.current.slice(1), userMsg]
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    const controller = new AbortController();
    abortRef.current = controller;

    const resetStreamTimeout = () => {
      if (streamTimeoutRef.current !== null) {
        window.clearTimeout(streamTimeoutRef.current);
      }
      streamTimeoutRef.current = window.setTimeout(() => {
        controller.abort();
      }, 20000);
    };

    try {
      resetStreamTimeout();
      for await (const chunk of streamChat(history, token, controller.signal)) {
        resetStreamTimeout();
        if (chunk.error) {
          flushBufferedToken(assistantId);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `⚠️ ${chunk.error}`, streaming: false, error: true }
                : m
            )
          );
          break;
        }
        if (chunk.done) {
          flushBufferedToken(assistantId);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
          );
          break;
        }
        if (chunk.token) {
          streamBufferRef.current += chunk.token;
          if (flushTimerRef.current === null) {
            flushTimerRef.current = window.setTimeout(() => {
              flushBufferedToken(assistantId);
              flushTimerRef.current = null;
            }, 66);
          }
        }
      }
    } catch (err: any) {
      flushBufferedToken(assistantId);
      const isAbort = err.name === 'AbortError';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: isAbort ? m.content : '⚠️ Connexion interrompue. Réessayez.',
                streaming: false,
                error: !isAbort,
              }
            : m
        )
      );
    } finally {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      if (streamTimeoutRef.current !== null) {
        window.clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [flushBufferedToken, input, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    if (streamTimeoutRef.current !== null) {
      window.clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    setOpen(false);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    streamBufferRef.current = '';
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (streamTimeoutRef.current !== null) {
      window.clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    setIsStreaming(false);
    setMessages([WELCOME]);
    setInput('');
  };

  return (
    <>
      {/* ---- Chat Panel ---- */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'fixed bottom-20 right-4 z-50',
              'w-[22rem] sm:w-96 flex flex-col',
              'bg-card border border-border rounded-2xl shadow-2xl overflow-hidden'
            )}
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-card/95 flex-shrink-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card',
                    isConfigured === false ? 'bg-destructive' : 'bg-green-500'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none mb-0.5">Aéria</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isConfigured === false ? (
                    <><WifiOff className="w-3 h-3" /> Clé API non configurée</>
                  ) : (
                    <><Wifi className="w-3 h-3 text-green-500" /> Assistante qualité de l'air</>
                  )}
                </p>
              </div>
              {/* Reset button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={handleReset}
                title="Nouvelle conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions (only on fresh chat) */}
            {messages.length === 1 && !isStreaming && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="px-3 pb-3 pt-2 border-t border-border flex-shrink-0 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question…"
                disabled={isStreaming || isConfigured === false}
                className={cn(
                  'flex-1 min-w-0 text-sm px-3 py-2 rounded-xl',
                  'bg-muted border border-border text-foreground placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                )}
              />
              <Button
                size="icon"
                className="w-8 h-8 rounded-xl flex-shrink-0"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming || isConfigured === false}
              >
                {isStreaming
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- FAB Toggle ---- */}
      <motion.button
        onClick={() => (open ? handleClose() : setOpen(true))}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.93 }}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'w-12 h-12 rounded-2xl shadow-lg',
          'flex items-center justify-center',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2'
        )}
        aria-label={open ? 'Fermer le chat IA' : 'Ouvrir le chat IA'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.div key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div key="chat"
              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
