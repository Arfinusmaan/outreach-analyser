import { useState } from 'react';

const STATUS_CONFIG = {
  engaged: {
    label: '✅ Engaged',
    className: 'engaged',
    description: 'Owner replied — this hit.',
  },
  lukewarm: {
    label: '🤔 Lukewarm',
    className: 'lukewarm',
    description: 'Noncommittal. Not bad, not great.',
  },
  left_on_read: {
    label: '👀 Left on Read',
    className: 'left_on_read',
    description: "Didn't bother replying.",
  },
  blunt_dismissal: {
    label: '🚫 Blunt Dismissal',
    className: 'blunt_dismissal',
    description: 'Got told off.',
  },
};

function getRatingColor(rating) {
  if (rating === null) return { color: '#64748b', bg: 'rgba(71,85,105,0.15)', border: 'rgba(71,85,105,0.3)' };
  if (rating >= 8.0) return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' };
  if (rating >= 6.0) return { color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)' };
  if (rating >= 3.5) return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} id="copy-sms-btn">
      {copied ? '✓ Copied' : '⎘ Copy SMS'}
    </button>
  );
}

export default function ResultCard({ result, mode }) {
  if (!result) {
    return (
      <div className="results-empty">
        <div className="empty-icon">🏚️</div>
        <p>Fill in the lead details and hit the button — the owner will respond.</p>
      </div>
    );
  }

  const { rating, verdict, breakdown, reply_status, reply_text, suggested_sms, closing_note } = result;
  const ratingColors = getRatingColor(rating);
  const statusConfig = reply_status ? STATUS_CONFIG[reply_status] : null;
  const isGenerateMode = mode === 'generate';

  return (
    <div className="fade-in">
      {/* Rating + Verdict */}
      <div className="rating-block">
        {rating !== null && (
          <div
            className="rating-circle"
            style={{
              background: ratingColors.bg,
              border: `2px solid ${ratingColors.border}`,
              color: ratingColors.color,
            }}
          >
            <span>{rating.toFixed(1)}</span>
            <span className="rating-label">/ 10</span>
          </div>
        )}
        <div className="rating-info">
          {verdict && <div className="rating-verdict">{verdict}</div>}
          <div className="rating-mode-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>{isGenerateMode ? '✍️ Generate mode' : `📊 Rate mode${rating !== null ? ` · ${rating.toFixed(1)}/10` : ''}`}</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: '#333', color: '#94a3b8', borderRadius: '3px', fontWeight: '500' }}>AI SIMULATED</span>
          </div>
        </div>
      </div>

      {/* Reply simulation (rate mode only) */}
      {reply_status && statusConfig && (
        <div className="reply-block">
          <div className="reply-block-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Owner's Reply</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: '#333', color: '#94a3b8', borderRadius: '3px', fontWeight: '500' }}>AI SIMULATION</span>
          </div>
          <div className={`reply-status-label ${statusConfig.className}`}>
            {statusConfig.label}
          </div>
          {reply_text ? (
            <div className={`reply-bubble ${statusConfig.className}`}>
              {reply_text}
            </div>
          ) : (
            <div className="left-on-read-state">
              <div className="dot-row">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
              <span>{statusConfig.description}</span>
            </div>
          )}
        </div>
      )}

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <div className="breakdown-block">
          <div className="breakdown-block-title">
            {isGenerateMode ? 'Why it works' : 'Breakdown'}
          </div>
          <ul className="breakdown-list">
            {breakdown.map((point, i) => (
              <li key={i}>
                <span className="bullet" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="divider" />

      {/* Suggested SMS */}
      {suggested_sms && (
        <div className="sms-block">
          <div className="sms-block-header">
            <div className="sms-block-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>{isGenerateMode ? '📱 Your SMS' : '📱 Suggested SMS'}</span>
              {result.suggested_sms_char_count !== undefined && result.suggested_sms_char_count !== null && (
                <span 
                  className="char-count-badge" 
                  style={{ 
                    fontSize: '0.72rem', 
                    padding: '0.15rem 0.4rem', 
                    background: '#222', 
                    border: `1px solid ${result.suggested_sms_char_count > 300 ? '#ef4444' : '#333'}`,
                    borderRadius: '4px', 
                    color: result.suggested_sms_char_count > 300 ? '#ef4444' : '#10b981', 
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Programmatically calculated on final message including compliance footer"
                >
                  {result.suggested_sms_char_count} chars {result.suggested_sms_char_count > 300 ? '⚠️ Over Ceiling' : '✓ Valid'}
                </span>
              )}
            </div>
            <CopyButton text={suggested_sms} />
          </div>
          <div className="sms-body">{suggested_sms}</div>
        </div>
      )}

      {/* Closing note */}
      {closing_note && (
        <div className="closing-note">
          <span className="quote-mark">"</span>
          <span>{closing_note}</span>
        </div>
      )}
    </div>
  );
}
