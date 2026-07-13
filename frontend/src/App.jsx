import { useState } from 'react';
import ResultCard from './components/ResultCard.jsx';
import { SignedIn, SignedOut, SignIn, UserButton, useAuth } from '@clerk/clerk-react';

const SMS_CHAR_LIMIT = 400;

export default function App() {
  const [mode, setMode]       = useState('generate'); // 'generate' | 'rate'
  const [channel, setChannel] = useState('SMS');
  const [company, setCompany] = useState('');
  const [reviews, setReviews] = useState('');
  const [details, setDetails] = useState('');
  const [draft, setDraft]     = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const draftLen = draft.length;
  const draftCharClass = draftLen > SMS_CHAR_LIMIT ? 'over' : draftLen > SMS_CHAR_LIMIT * 0.85 ? 'warn' : '';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = await getToken();
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          company: company.trim(),
          channel: channel,
          reviews: reviews.trim() || null,
          details: details.trim() || null,
          draft: mode === 'rate' ? draft.trim() : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`);
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Check the backend is running.');
    } finally {
      setLoading(false);
    }
  }

  const { getToken } = useAuth();

  return (
    <>
      <SignedOut>
        <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="app-wrapper">
          {/* Header */}
          <header className="header">
            <div className="header-brand">
              <div className="header-icon">🏚️</div>
              <h1 className="header-title">
                The Owner's <span>Desk</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="header-badge">Restoration Outreach AI</span>
              <UserButton />
            </div>
          </header>

      {/* Main */}
      <main className="main">
        {/* ── Left: Input panel ── */}
        <section className="card" aria-label="Lead input form">
          <div className="card-title">
            <span className="icon">🔍</span>
            Lead Details
          </div>

          {/* Mode switcher */}
          <div className="mode-switcher" role="group" aria-label="Mode selection">
            <button
              id="mode-generate"
              className={`mode-btn ${mode === 'generate' ? 'active' : ''}`}
              onClick={() => { setMode('generate'); setResult(null); setError(null); }}
              type="button"
            >
              ✍️ Write Message
            </button>
            <button
              id="mode-rate"
              className={`mode-btn ${mode === 'rate' ? 'active' : ''}`}
              onClick={() => { setMode('rate'); setResult(null); setError(null); }}
              type="button"
            >
              📊 Rate Draft
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Company name */}
            <div className="field">
              <label className="field-label" htmlFor="company-name">
                Company Name <span className="required">*</span>
              </label>
              <input
                id="company-name"
                type="text"
                placeholder="e.g. H&H Restoration Services"
                value={company}
                onChange={e => setCompany(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {/* Channel */}
            <div className="field">
              <label className="field-label" htmlFor="channel-select">
                Outreach Channel
              </label>
              <select
                id="channel-select"
                value={channel}
                onChange={e => setChannel(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #333', background: '#222', color: '#fff', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                <option value="SMS">SMS (Text Message)</option>
                <option value="Instagram DM">Instagram DM</option>
              </select>
            </div>

            {/* Reviews */}
            <div className="field">
              <label className="field-label" htmlFor="reviews-field">
                Google Reviews Paste
              </label>
              <textarea
                id="reviews-field"
                className="tall"
                placeholder={"Paste raw review text here...\n\nе.g. \"Maria — 1 star — Called 3 times, nobody picked up. Very disappointing.\"\n\"Devon — 4 stars — Great work but took forever to call back.\""}
                value={reviews}
                onChange={e => setReviews(e.target.value)}
              />
              <div className="field-hint">
                The more real review content you paste, the higher quality the output.
              </div>
            </div>

            {/* Details */}
            <div className="field">
              <label className="field-label" htmlFor="details-field">
                Other Known Details
              </label>
              <textarea
                id="details-field"
                placeholder="Anything else you know: owner first name, recent jobs, local events, certifications, team size, etc."
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
            </div>

            {/* Draft (rate mode only) */}
            {mode === 'rate' && (
              <div className="field fade-in">
                <label className="field-label" htmlFor="draft-field">
                  Your Draft SMS <span className="required">*</span>
                </label>
                <textarea
                  id="draft-field"
                  placeholder="Paste the cold SMS you want rated..."
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  required={mode === 'rate'}
                />
                <div className={`char-counter ${draftCharClass}`}>
                  {draftLen} / {SMS_CHAR_LIMIT} chars (body only)
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-box" role="alert">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="submit-btn"
              className="submit-btn"
              type="submit"
              disabled={loading || !company.trim() || (mode === 'rate' && !draft.trim())}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Owner is reading…
                </>
              ) : mode === 'generate' ? (
                '✍️ Write Me a 9.5 Message'
              ) : (
                '📊 Rate This Draft'
              )}
            </button>
          </form>
        </section>

        {/* ── Right: Results panel ── */}
        <section className="card" aria-label="AI results">
          <div className="card-title">
            <span className="icon">🏚️</span>
            Owner's Response
          </div>
          <ResultCard result={result} mode={mode} />
        </section>
      </main>

        <footer className="footer">
          The Owner's Desk · Powered by Gemini · For internal use only
        </footer>
      </div>
      </SignedIn>
    </>
  );
}
