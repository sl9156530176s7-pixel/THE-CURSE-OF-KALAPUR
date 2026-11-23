import React from 'react';
import { X, Share, PlusSquare, Smartphone, Monitor, ShieldCheck, MoreVertical } from 'lucide-react';

interface PWAInstallModalProps {
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ open, isIOS, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-guide-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-stone-800 bg-[#0d0c0f] p-6 sm:p-7 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-400">
              Official Web App Installation
            </p>
            <h2 id="pwa-install-guide-title" className="mt-1 text-xl font-serif font-bold tracking-wide text-white">
              Install The Curse of Kalapur
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
            aria-label="Close installation guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm text-stone-300">
          {isIOS ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/15 p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Smartphone className="w-4 h-4 text-red-400" />
                <span>iPhone &amp; iPad (Safari)</span>
              </div>
              <ol className="space-y-2.5 text-xs sm:text-sm text-stone-300">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-red-400 font-bold">01.</span>
                  <span>
                    Tap the <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline text-red-400" /> Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-red-400 font-bold">02.</span>
                  <span>
                    Scroll down the share sheet and tap <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline text-red-400" /> Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-red-400 font-bold">03.</span>
                  <span>
                    Tap <strong className="text-white">Add</strong> in the upper right. Launch the <strong className="text-white">Kalapur</strong> icon from your home screen in standalone mode.
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-stone-800 bg-stone-950/80 p-4 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Smartphone className="w-4 h-4 text-red-400" />
                  <span>Android (Chrome, Edge, Brave, Samsung Internet)</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  If the automatic prompt did not appear (for example, inside an in-app browser like WhatsApp or Instagram),
                  open this page in <strong className="text-white">Google Chrome</strong>, tap the{' '}
                  <strong className="text-white inline-flex items-center gap-0.5"><MoreVertical className="w-3.5 h-3.5 inline text-red-400" /> Menu</strong> icon, and select{' '}
                  <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.
                </p>
              </div>

              <div className="rounded-lg border border-stone-800 bg-stone-950/80 p-4 space-y-2.5">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Monitor className="w-4 h-4 text-red-400" />
                  <span>Windows / macOS / Linux Desktop</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  In Chrome or Microsoft Edge, click the <strong className="text-white">Install</strong> icon on the right side of the address bar,
                  or open the browser menu and click <strong className="text-white">Cast, save, and share → Install The Curse of Kalapur</strong>.
                </p>
              </div>
            </>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-emerald-900/40 bg-emerald-950/15 p-3.5 text-xs text-stone-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Delivered safely over HTTPS directly from our official GitHub Pages host as a standard W3C Progressive Web App — no APK downloads, no third-party stores, and no extra permissions required.
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
