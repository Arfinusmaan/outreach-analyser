/**
 * cleanGoogleReviews
 * ------------------
 * Takes the raw copy-paste from a Google Maps / Google Search review panel
 * and returns a clean list of just the customer reviews.
 *
 * STRIPS:
 *  - Owner reply blocks (everything after "[Business] (owner)")
 *  - "Services" header + the service list line below it
 *  - "Photo N in review by..." lines
 *  - Review count / badge lines ("2 reviews", "Local Guide·22 reviews",
 *    "2 reviews·7 photos", etc.)
 *  - "…More" / "...More" expand links
 *
 * KEEPS:
 *  - Reviewer name
 *  - "X months ago" / "a year ago" time stamp
 *  - The actual review text (including any heading line like "Great price")
 */
function cleanGoogleReviews(raw) {
  if (!raw || !raw.trim()) return raw;

  // Regex helpers
  const timeAgoRe  = /^(just now|(a|an|\d+)\s+(minute|hour|day|week|month|year)s?\s+ago)$/i;
  const countBadge = /^(local guide[·•]\s*)?\d+\s+reviews?([\s·•]\d+\s+photos?)?$/i;
  const ownerRe    = /\(owner\)\s*$/i;
  const photoRe    = /^photo\s+\d+\s+in\s+review\s+by\s+/i;
  const servicesRe = /^services$/i;
  const expandRe   = /^[…\.]{1,3}more$/i;

  const lines = raw.split('\n').map(l => l.trim());
  const out   = [];
  let inOwnerBlock = false;
  let skipNextLine = false; // used to skip the service-list line after "Services"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Always-skip rules (apply even inside owner block) ──────────────────
    if (photoRe.test(line))  continue;
    if (expandRe.test(line)) continue;

    // ── Blank lines ────────────────────────────────────────────────────────
    if (!line) {
      if (!inOwnerBlock) {
        // Avoid double blanks in output
        if (out.length && out[out.length - 1] !== '') out.push('');
      }
      continue;
    }

    // ── Services block ─────────────────────────────────────────────────────
    if (servicesRe.test(line)) { skipNextLine = true; continue; }
    if (skipNextLine)           { skipNextLine = false; continue; }

    // ── Owner reply block starts ───────────────────────────────────────────
    if (ownerRe.test(line)) { inOwnerBlock = true; continue; }

    // ── Inside owner block ─────────────────────────────────────────────────
    if (inOwnerBlock) {
      // Skip the time-ago line that immediately follows the owner name
      if (timeAgoRe.test(line)) continue;

      // Skip the review-count / badge line (shouldn't appear here, but be safe)
      if (countBadge.test(line)) { inOwnerBlock = false; out.push(line); continue; }

      // Check: does this line look like the START of a new reviewer entry?
      // A reviewer name is reliably followed (within the next 2 non-empty lines)
      // by a count/badge line OR a time-ago line.
      const upcoming = lines.slice(i + 1).filter(l => l.trim()).slice(0, 2);
      const looksLikeReviewerName =
        upcoming.some(l => timeAgoRe.test(l) || countBadge.test(l));

      if (looksLikeReviewerName) {
        // End the owner block — this line is the next reviewer's name
        inOwnerBlock = false;
        if (out.length && out[out.length - 1] !== '') out.push('');
        out.push(line);
      }
      // else: this is owner reply body text — silently drop it
      continue;
    }

    // ── Normal lines (not in owner block) ─────────────────────────────────

    // Drop review-count / badge lines ("2 reviews", "Local Guide·22 reviews", etc.)
    if (countBadge.test(line)) continue;

    out.push(line);
  }

  // Collapse 3+ consecutive blank lines → 1
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

module.exports = { cleanGoogleReviews };
