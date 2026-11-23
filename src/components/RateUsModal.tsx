import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2, ExternalLink, MessageSquare } from 'lucide-react';

const RATING_STORAGE_KEY = 'kalapur_player_rating_v1';

export interface SavedPlayerRating {
  stars: number;
  comment: string;
  updatedAt: string;
}

export function loadSavedRating(): SavedPlayerRating | null {
  try {
    const raw = localStorage.getItem(RATING_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedPlayerRating;
    if (typeof parsed.stars === 'number' && parsed.stars >= 1 && parsed.stars <= 5) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function savePlayerRating(rating: SavedPlayerRating): void {
  try {
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(rating));
  } catch {
    // Ignore storage quota errors
  }
}

const STAR_LABELS = ['', 'Needs Work', 'Fair', 'Good', 'Great Horror', 'Masterpiece'];

interface RateUsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (rating: SavedPlayerRating) => void;
}

export const RateUsModal: React.FC<RateUsModalProps> = ({ open, onClose, onSaved }) => {
  const [stars, setStars] = useState<number>(0);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    const existing = loadSavedRating();
    if (existing) {
      setStars(existing.stars);
      setComment(existing.comment);
    } else {
      setStars(0);
      setComment('');
    }
    setErrorMsg('');
    setSubmitted(false);
  }, [open]);

  if (!open) return null;

  const activeStars = hoverStars || stars;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1 || stars > 5) {
      setErrorMsg('Please select a star rating from 1 to 5 before submitting.');
      return;
    }
    const cleanComment = comment.trim().slice(0, 500);
    const saved: SavedPlayerRating = {
      stars,
      comment: cleanComment,
      updatedAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };
    savePlayerRating(saved);
    onSaved?.(saved);
    setErrorMsg('');
    setSubmitted(true);
  };

  const githubIssueUrl = `https://github.com/sl9156530176s7-pixel/THE-CURSE-OF-KALAPUR/issues/new?title=${encodeURIComponent(
    `Player Review (${stars || 5}/5 Stars) - The Curse of Kalapur`
  )}&body=${encodeURIComponent(
    `Rating: ${stars || 5} / 5 Stars\n\nFeedback:\n${comment.trim() || 'Enjoyed playing The Curse of Kalapur by Strange Creation!'}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-us-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-stone-800 bg-[#0d0c12] p-6 sm:p-7 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">
              Player Feedback
            </p>
            <h2 id="rate-us-modal-title" className="mt-1 text-xl font-serif font-bold text-white">
              Rate Strange Creation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
            aria-label="Close rating dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-6 space-y-5 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-lg font-serif font-bold text-white">
                Thank You for Your {stars}/5 Rating
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Your rating for <strong className="text-white">The Curse of Kalapur</strong> has been saved on your device.
              </p>
            </div>

            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`w-6 h-6 ${n <= stars ? 'text-amber-400 fill-amber-400' : 'text-stone-700'}`}
                />
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href={githubIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-lg border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Review to Developer on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div className="space-y-2 text-center">
              <p className="text-xs sm:text-sm text-stone-300">
                How was your experience playing <strong className="text-white">The Curse of Kalapur</strong>?
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverStars(n)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => {
                      setStars(n);
                      setErrorMsg('');
                    }}
                    className="p-1.5 rounded-lg hover:bg-stone-900 transition-transform active:scale-95 cursor-pointer"
                    aria-label={`Rate ${n} out of 5 stars`}
                  >
                    <Star
                      className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                        n <= activeStars
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.45)]'
                          : 'text-stone-700 hover:text-stone-500'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="h-5 text-xs font-mono text-amber-300 font-semibold">
                {activeStars > 0 ? `${activeStars}/5 — ${STAR_LABELS[activeStars]}` : 'Tap a star to rate'}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="kalapur-review-note" className="block text-xs font-medium text-stone-300">
                Optional Review or Suggestion
              </label>
              <textarea
                id="kalapur-review-note"
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what you liked or what Strange Creation should improve next..."
                className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-stone-800 bg-stone-950 hover:bg-stone-900 text-stone-300 text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Submit Rating
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
