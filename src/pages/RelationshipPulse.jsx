import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { differenceInDays, format } from 'date-fns';
import { quickPrompt } from '../gemini';
import toast from 'react-hot-toast';

const RELATIONSHIP_TYPES = ['Friend', 'Family', 'Mentor', 'Partner', 'Colleague'];
const EMOJI_OPTIONS = ['👤','👩','👨','👧','👦','👴','👵','🧑','🧒','🧓','🤝','💑','👫','👬','👭'];

function ConnectionBadge({ days }) {
  if (days === null || days === undefined) return <span className="badge conn-yellow">Unknown</span>;
  if (days <= 7)  return <span className="badge conn-green">✅ {days}d ago</span>;
  if (days <= 21) return <span className="badge conn-yellow">💛 {days}d ago</span>;
  return <span className="badge conn-red" style={{ padding: '0.3rem 0.75rem' }}>🔴 {days}d ago</span>;
}

export default function RelationshipPulse() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [aiNudge, setAiNudge] = useState('');
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '👤', type: 'Friend', lastConnected: format(new Date(), 'yyyy-MM-dd') });
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (!user) return;
    loadPeople();
  }, [user]);

  async function loadPeople() {
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'relationships'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => getDays(b) - getDays(a)); // most overdue first
      setPeople(list);
      // Auto-generate nudge for most-overdue person
      if (list.length > 0 && !aiNudge) generateNudge(list[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const getDays = (p) =>
    p.lastConnected ? differenceInDays(new Date(), new Date(p.lastConnected)) : 999;

  async function generateNudge(person) {
    if (!person) return;
    setNudgeLoading(true);
    try {
      const days = getDays(person);
      const prompt = `I haven't contacted ${person.name} (my ${person.type?.toLowerCase() || 'friend'}) in ${days} days. Today is ${format(new Date(), 'EEEE, MMMM d')}. Suggest a specific, warm, encouraging nudge (1-2 sentences) about a good time or way to reconnect this weekend. Be friendly and natural.`;
      const tip = await quickPrompt(prompt);
      setAiNudge(tip || `You haven't talked to ${person.name} in a while. How about reaching out today? 💛`);
    } catch (e) {
      setAiNudge(`You haven't connected with ${person.name} in ${getDays(person)} days. A quick message could mean the world! 💛`);
    } finally {
      setNudgeLoading(false);
    }
  }

  async function addPerson() {
    if (!form.name.trim()) { toast.error('Please enter a name'); return; }
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'relationships'), {
        name:          form.name.trim(),
        emoji:         form.emoji,
        type:          form.type,
        lastConnected: form.lastConnected,
        notes:         [],
        createdAt:     serverTimestamp(),
      });
      const newPerson = { id: docRef.id, ...form, notes: [] };
      setPeople((prev) => [newPerson, ...prev].sort((a, b) => getDays(b) - getDays(a)));
      setShowModal(false);
      setForm({ name: '', emoji: '👤', type: 'Friend', lastConnected: format(new Date(), 'yyyy-MM-dd') });
      toast.success(`${form.name} added to your Pulse! ❤️`);
    } catch (e) {
      toast.error('Failed to add person');
    }
  }

  async function markConnected(person) {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await updateDoc(doc(db, 'users', user.uid, 'relationships', person.id), { lastConnected: today });
      setPeople((prev) => prev.map((p) => p.id === person.id ? { ...p, lastConnected: today } : p));
      if (selectedPerson?.id === person.id) setSelectedPerson({ ...selectedPerson, lastConnected: today });
      toast.success(`Marked connected with ${person.name} today! 🎉`);
    } catch (e) { toast.error('Update failed'); }
  }

  async function addNote() {
    if (!noteInput.trim() || !selectedPerson) return;
    const newNote = { text: noteInput.trim(), date: format(new Date(), 'yyyy-MM-dd') };
    const updatedNotes = [...(selectedPerson.notes || []), newNote];
    try {
      await updateDoc(doc(db, 'users', user.uid, 'relationships', selectedPerson.id), { notes: updatedNotes });
      setSelectedPerson({ ...selectedPerson, notes: updatedNotes });
      setPeople((prev) => prev.map((p) => p.id === selectedPerson.id ? { ...p, notes: updatedNotes } : p));
      setNoteInput('');
      toast.success('Note saved!');
    } catch (e) { toast.error('Failed to save note'); }
  }

  const topNudgePerson = people.find((p) => getDays(p) > 7);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="fade-in-up">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>❤️ Relationship Pulse</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Never let a connection drift away</p>
        </div>
        <button className="btn btn-primary" id="add-person-btn" onClick={() => setShowModal(true)}>+ Add Person</button>
      </div>

      {/* ── AI Nudge Banner ────────────────────────────────────────────── */}
      {(aiNudge || nudgeLoading) && topNudgePerson && (
        <div className="card fade-in-up" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)', border: '1.5px solid #FDBA74' }}>
          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.75rem' }}>{topNudgePerson.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#92400E', marginBottom: '0.25rem' }}>
                💡 ARIA's Nudge — {topNudgePerson.name}
              </div>
              {nudgeLoading
                ? <div className="skeleton" style={{ height: 16, width: '80%' }} />
                : <p style={{ fontSize: '0.875rem', color: '#92400E', lineHeight: 1.6 }}>{aiNudge}</p>
              }
            </div>
            <button onClick={() => setAiNudge('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FDBA74', fontSize: '1.1rem' }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total People', value: people.length, icon: '👥', color: '#A78BFA' },
          { label: 'Needs Attention', value: people.filter((p) => getDays(p) > 21).length, icon: '🔴', color: '#EF4444' },
          { label: 'All Good', value: people.filter((p) => getDays(p) <= 7).length, icon: '✅', color: '#10B981' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── People Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 20 }} />)}
        </div>
      ) : people.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No people added yet</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>Add friends, family, and mentors to track your connections.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Your First Person</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {people.map((person) => {
            const days = getDays(person);
            return (
              <div
                key={person.id}
                className="card"
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setSelectedPerson(person)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: days > 21 ? '#FEE2E2' : days > 7 ? '#FFFBEB' : '#D1FAE5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
                  }}>{person.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{person.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <ConnectionBadge days={days} />
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.625rem' }}
                    onClick={(e) => { e.stopPropagation(); markConnected(person); }}
                  >
                    ✓ Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Person Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.2rem' }}>➕ Add Person</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Emoji Picker */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>Emoji Avatar</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => setForm((f) => ({ ...f, emoji: e }))} style={{
                      width: 36, height: 36, borderRadius: 8, border: form.emoji === e ? '2px solid #A78BFA' : '1.5px solid #E2E8F0',
                      background: form.emoji === e ? '#EDE9FE' : 'white', cursor: 'pointer', fontSize: '1.1rem',
                    }}>{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>Name *</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Riya, Mom, Prof. Sharma" id="person-name-input" />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>Relationship Type</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  {RELATIONSHIP_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.375rem' }}>Last Connected</label>
                <input type="date" className="input-field" value={form.lastConnected} onChange={(e) => setForm((f) => ({ ...f, lastConnected: e.target.value }))} id="last-connected-input" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={addPerson}>Add Person ❤️</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Person Detail Modal ────────────────────────────────────────── */}
      {selectedPerson && (
        <div className="modal-overlay" onClick={() => setSelectedPerson(null)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: '#EDE9FE', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '2rem', flexShrink: 0,
              }}>{selectedPerson.emoji}</div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.2rem' }}>{selectedPerson.name}</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{selectedPerson.type}</p>
                <ConnectionBadge days={getDays(selectedPerson)} />
              </div>
              <button className="btn btn-accent" style={{ marginLeft: 'auto' }} onClick={() => markConnected(selectedPerson)}>
                ✓ Mark Connected
              </button>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Last connected: {selectedPerson.lastConnected ? format(new Date(selectedPerson.lastConnected), 'MMMM d, yyyy') : 'Unknown'}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>📝 Shared History & Notes</div>
              {(selectedPerson.notes || []).length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>No notes yet. Add memories, topics to discuss, etc.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 180, overflowY: 'auto' }}>
                  {selectedPerson.notes.map((n, i) => (
                    <div key={i} style={{ padding: '0.625rem 0.875rem', borderRadius: 10, background: '#F8F7FF', border: '1px solid rgba(167,139,250,0.15)', fontSize: '0.82rem' }}>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{n.date}</div>
                      <div>{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input
                  className="input-field"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note…"
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                  style={{ flex: 1 }}
                  id="note-input"
                />
                <button className="btn btn-primary" onClick={addNote} style={{ padding: '0.65rem 1rem' }}>Save</button>
              </div>
            </div>

            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setSelectedPerson(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
