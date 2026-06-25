import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { chatWithAria, parseTaskFromResponse, getRemainingCalls, isRateLimited } from '../gemini';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm **ARIA**, your MindMesh AI companion 🌟\n\nTell me about your tasks, deadlines, or how you're feeling. I can:\n• 📝 Add tasks & set deadlines\n• 📅 Spot scheduling conflicts\n• 💡 Give productivity tips\n• ❤️ Remind you to connect with people\n\nTry: *\"I have a project due Friday, high priority\"*",
  timestamp: new Date(),
};

// Simple markdown bold/italic renderer
function renderContent(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function AriaChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [remainingCalls, setRemainingCalls] = useState(getRemainingCalls());
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chat history
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, 'users', user.uid, 'chats'),
          orderBy('timestamp', 'asc'),
        ));
        if (!snap.empty) {
          const history = snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() }));
          setMessages([WELCOME_MSG, ...history]);
        }
      } catch (e) {
        console.error('Chat history load error:', e);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Save message to Firestore
  const saveMessage = useCallback(async (msg) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'chats'), {
        role: msg.role,
        content: msg.content,
        timestamp: serverTimestamp(),
        taskExtracted: msg.taskExtracted || null,
      });
    } catch (e) {
      console.error('Save chat error:', e);
    }
  }, [user]);

  // Save task to Firestore
  const saveTask = async (taskData) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        task:           taskData.task,
        deadline:       taskData.deadline,
        priority:       taskData.priority,
        category:       taskData.category,
        estimatedHours: taskData.estimatedHours || 1,
        done:           false,
        createdAt:      serverTimestamp(),
      });
      toast.success(`Task added: ${taskData.task}`, { icon: '✅', duration: 3000 });
    } catch (e) {
      toast.error('Failed to save task');
    }
  };

  const sendMessage = async (content) => {
    if (!content.trim() || loading) return;
    if (isRateLimited()) {
      toast.error('AI call limit reached (20/session). Please refresh.', { duration: 4000 });
      return;
    }

    const userMsg = { id: Date.now().toString(), role: 'user', content: content.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await saveMessage(userMsg);

    try {
      // Build conversation history for Gemini (exclude welcome msg)
      const history = [...messages.filter((m) => m.id !== 'welcome'), userMsg]
        .map((m) => ({ role: m.role, content: m.content }));

      const responseText = await chatWithAria(history);
      setRemainingCalls(getRemainingCalls());

      // Parse task if present
      const taskData = parseTaskFromResponse(responseText);
      if (taskData) await saveTask(taskData);

      // Strip JSON block from display text
      const displayText = responseText.replace(/```json[\s\S]*?```/g, '').trim();

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayText,
        timestamp: new Date(),
        taskExtracted: taskData || null,
      };
      setMessages((prev) => [...prev, aiMsg]);
      await saveMessage(aiMsg);
    } catch (err) {
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Oops! I hit a snag 😅 — ${err.message || 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error(err.message || 'ARIA is unavailable right now');
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API
  const toggleRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser. Try Chrome!');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      sendMessage(transcript);
    };

    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      toast.error('Could not hear you clearly. Please try again.');
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast('Listening… speak now 🎙️', { icon: '🔴', duration: 3000 });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const ratePct = (remainingCalls / 20) * 100;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', height: 'calc(100vh - 4rem)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem', padding: '0 0.25rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
          boxShadow: '0 4px 14px rgba(124,58,237,0.3)', flexShrink: 0
        }}>🤖</div>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text)', lineHeight: 1 }}>ARIA</h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>AI Life Companion · Voice & Text</p>
        </div>
        {/* Rate limit bar */}
        <div className="rate-bar-wrap" style={{ marginLeft: 'auto', minWidth: 140 }}>
          <span>{remainingCalls}/20 calls left</span>
          <div className="rate-bar"><div className="rate-bar-fill" style={{ width: `${ratePct}%` }} /></div>
        </div>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '0.5rem 0.25rem 1rem',
      }}>
        {loadingHistory && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            <div className="spin-slow" style={{ width: 28, height: 28, border: '2px solid #A78BFA', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 0.5rem' }} />
            Loading chat history…
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.25rem' }}>
            {/* Timestamp */}
            {msg.timestamp && (
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', padding: '0 0.5rem' }}>
                {format(new Date(msg.timestamp), 'h:mm a')}
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>🤖</div>
              )}

              <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
              </div>
            </div>

            {/* Task Confirmation Card */}
            {msg.taskExtracted && (
              <div className="confirm-card fade-in-up" style={{ maxWidth: '75%', alignSelf: 'flex-start', marginLeft: 36 }}>
                ✅ <strong>Task added!</strong><br />
                <span style={{ fontWeight: 600 }}>"{msg.taskExtracted.task}"</span>
                {msg.taskExtracted.deadline && <> → {format(new Date(msg.taskExtracted.deadline), 'EEE, MMM d yyyy')}</>}
                {' '}<span className={`badge badge-${msg.taskExtracted.priority?.toLowerCase() === 'high' ? 'high' : msg.taskExtracted.priority?.toLowerCase() === 'medium' ? 'medium' : 'low'}`}>{msg.taskExtracted.priority}</span>
                {' '}<span className={`badge badge-${msg.taskExtracted.category}`}>{msg.taskExtracted.category}</span>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>🤖</div>
            <div className="chat-bubble-ai" style={{ padding: '0.625rem 0.875rem' }}>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Quick Prompts ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', marginBottom: '0.75rem', scrollbarWidth: 'none' }}>
        {[
          '📝 Add a task',
          '📅 Check my week',
          '💡 Productivity tip',
          '❤️ Who should I call?',
          '🔄 Reschedule my Thursday',
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            style={{
              padding: '0.4rem 0.875rem', borderRadius: 999,
              border: '1.5px solid rgba(167,139,250,0.25)',
              background: 'white', color: 'var(--color-text)',
              fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(167,139,250,0.10)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.25)'; }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* ── Input Bar ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '0.625rem', alignItems: 'flex-end',
        background: 'white', border: '1.5px solid rgba(167,139,250,0.25)',
        borderRadius: 18, padding: '0.625rem', boxShadow: '0 2px 12px rgba(167,139,250,0.10)',
      }}>
        {/* Mic button */}
        <button
          id="aria-mic-btn"
          onClick={toggleRecording}
          className={isRecording ? 'recording' : ''}
          style={{
            width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: isRecording ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #A78BFA, #7C3AED)',
            color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
            boxShadow: isRecording ? '0 0 16px rgba(239,68,68,0.4)' : '0 2px 8px rgba(167,139,250,0.3)',
          }}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? '⏹️' : '🎙️'}
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="aria-text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type or speak to ARIA… (Enter to send, Shift+Enter for newline)"
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
            color: 'var(--color-text)', lineHeight: 1.5, maxHeight: 120,
            background: 'transparent', overflowY: 'auto',
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />

        {/* Send button */}
        <button
          id="aria-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 42, height: 42, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: input.trim() && !loading ? 'linear-gradient(135deg, #A78BFA, #7C3AED)' : '#E2E8F0',
            color: input.trim() && !loading ? 'white' : '#94A3B8',
            fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s',
          }}
          title="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
