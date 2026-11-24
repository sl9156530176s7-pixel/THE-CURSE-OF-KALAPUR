import React, { useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  ShieldCheck,
  Lock,
  LogOut,
  X,
  Download,
  Smartphone,
  Monitor,
  Star,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { auth, googleProvider, OWNER_EMAIL } from '../firebase';
import {
  DownloadEventRecord,
  PlayerRatingRecord,
  DevicePlatform,
  subscribeOwnerDownloads,
  subscribeOwnerRatings,
  deleteOwnerRecord,
} from '../services/analyticsService';

interface OwnerDashboardModalProps {
  open: boolean;
  onClose: () => void;
}

class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { errorMessage: string | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { errorMessage: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { errorMessage: error.message || 'Failed to render Owner Dashboard.' };
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="p-6 text-center space-y-3 text-stone-200">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-white">Dashboard Data Error</h3>
          <p className="text-xs text-stone-400 break-words max-w-md mx-auto">
            {this.state.errorMessage}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatTimestamp(ms: number): string {
  try {
    return new Date(ms).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown time';
  }
}

function formatInstallType(t: DownloadEventRecord['installType']): string {
  switch (t) {
    case 'pwa_installed':
      return 'PWA Installed';
    case 'install_prompt_accepted':
      return 'Install Accepted';
    case 'standalone_launch':
      return 'Installed App Launch';
    case 'install_guide_opened':
      return 'Install Clicked';
    default:
      return t;
  }
}

function PlatformBadge({ platform }: { platform: DevicePlatform }) {
  if (platform === 'android') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-[11px] font-mono">
        <Smartphone className="w-3 h-3" />
        Android
      </span>
    );
  }
  if (platform === 'ios') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/60 text-sky-300 text-[11px] font-mono">
        <Smartphone className="w-3 h-3" />
        iPhone/iPad
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300 text-[11px] font-mono">
      <Monitor className="w-3 h-3" />
      {platform === 'desktop' ? 'Desktop' : 'Other'}
    </span>
  );
}

const OwnerDashboardContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [downloads, setDownloads] = useState<DownloadEventRecord[]>([]);
  const [ratings, setRatings] = useState<PlayerRatingRecord[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [activeTab, setActiveTab] = useState<'downloads' | 'ratings'>('downloads');
  const [platformFilter, setPlatformFilter] = useState<'all' | DevicePlatform>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const isVerifiedOwner = Boolean(
    user && user.email === OWNER_EMAIL && user.emailVerified
  );

  useEffect(() => {
    if (!isVerifiedOwner) {
      setDownloads([]);
      setRatings([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    setDataError(null);

    const unsubDownloads = subscribeOwnerDownloads(
      (rows) => {
        setDownloads(rows);
        setLoadingData(false);
      },
      (err) => {
        setDataError(err.message);
        setLoadingData(false);
      }
    );

    const unsubRatings = subscribeOwnerRatings(
      (rows) => {
        setRatings(rows);
      },
      (err) => {
        setDataError(err.message);
      }
    );

    return () => {
      unsubDownloads();
      unsubRatings();
    };
  }, [isVerifiedOwner]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In cancelled or blocked.';
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth).catch(() => {});
    setDataError(null);
  };

  const handleDelete = async (col: 'downloads' | 'ratings', docId: string) => {
    setDeletingId(docId);
    try {
      await deleteOwnerRecord(col, docId);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    const uniqueDevices = new Set(downloads.map((d) => d.deviceClientId)).size;
    const confirmedInstalls = downloads.filter(
      (d) =>
        d.installType === 'pwa_installed' ||
        d.installType === 'install_prompt_accepted' ||
        d.installType === 'standalone_launch'
    ).length;
    const androidCount = downloads.filter((d) => d.platform === 'android').length;
    const iosCount = downloads.filter((d) => d.platform === 'ios').length;
    const desktopCount = downloads.filter((d) => d.platform === 'desktop').length;
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length).toFixed(1)
        : '—';
    return {
      totalEvents: downloads.length,
      confirmedInstalls,
      uniqueDevices,
      androidCount,
      iosCount,
      desktopCount,
      avgRating,
    };
  }, [downloads, ratings]);

  const filteredDownloads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return downloads.filter((d) => {
      if (platformFilter !== 'all' && d.platform !== platformFilter) return false;
      if (!term) return true;
      return (
        d.browser.toLowerCase().includes(term) ||
        d.deviceClientId.toLowerCase().includes(term) ||
        d.installType.toLowerCase().includes(term) ||
        (d.playerTag || '').toLowerCase().includes(term) ||
        d.appVersion.toLowerCase().includes(term)
      );
    });
  }, [downloads, platformFilter, searchTerm]);

  const filteredRatings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ratings.filter((r) => {
      if (platformFilter !== 'all' && r.platform !== platformFilter) return false;
      if (!term) return true;
      return (
        r.comment.toLowerCase().includes(term) ||
        (r.playerTag || '').toLowerCase().includes(term) ||
        r.deviceClientId.toLowerCase().includes(term)
      );
    });
  }, [ratings, platformFilter, searchTerm]);

  return (
    <div className="w-full max-w-5xl rounded-2xl border border-stone-800 bg-[#0b0c12] shadow-2xl text-stone-100 max-h-[92vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-800 px-5 sm:px-7 py-4 bg-[#07080d]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/60 border border-red-700/60 text-red-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-red-400">
              Strange Creation Studio Admin
            </p>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-white">
              Owner Dashboard — Downloaders &amp; Reviews
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
            aria-label="Close Owner Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
        {!authReady ? (
          <div className="py-16 text-center text-sm text-stone-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-red-400" />
            <span>Checking Studio Owner Session...</span>
          </div>
        ) : !user ? (
          <div className="max-w-md mx-auto py-10 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-950/50 border border-red-700/60 flex items-center justify-center text-red-400">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-white">Owner Sign-In Required</h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
                Sign in with the official Strange Creation Google account ({' '}
                <code className="text-stone-200">{OWNER_EMAIL}</code> ) to inspect live app
                downloads, device platforms, and player ratings.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-700/70 text-xs text-red-200">
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={handleSignIn}
              disabled={authLoading}
              className="w-full py-3 px-5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60 transition-colors"
            >
              {authLoading ? 'Opening Google Sign-In...' : 'Sign In with Google (Owner)'}
            </button>
          </div>
        ) : !isVerifiedOwner ? (
          <div className="max-w-md mx-auto py-10 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-white">Access Restricted</h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Signed in as <strong className="text-stone-200">{user.email}</strong>. Only the
              verified studio owner (<code className="text-stone-200">{OWNER_EMAIL}</code>) can
              access downloader logs and player feedback.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-lg border border-stone-700 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Switch Google Account
            </button>
          </div>
        ) : (
          <>
            {/* Verified Owner Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/60 bg-emerald-950/25 px-4 py-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Verified Owner: <strong>{user.email}</strong> (Live Firestore Sync Active)
                </span>
              </div>
              <span className="text-[11px] text-stone-400">
                Note: Browsers log anonymous device IDs, OS &amp; install events — never private PII.
              </span>
            </div>

            {dataError && (
              <div className="p-3.5 rounded-xl border border-red-700/70 bg-red-950/50 text-xs text-red-200 break-words">
                {dataError}
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-xl border border-stone-800 bg-stone-950/80 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Unique Devices</span>
                  <Users className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-serif font-bold text-white tabular-nums">
                  {stats.uniqueDevices}
                </div>
                <div className="text-[11px] text-stone-500">
                  {stats.totalEvents} total install events
                </div>
              </div>

              <div className="rounded-xl border border-stone-800 bg-stone-950/80 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Confirmed Installs</span>
                  <Download className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-serif font-bold text-white tabular-nums">
                  {stats.confirmedInstalls}
                </div>
                <div className="text-[11px] text-stone-500">
                  PWA prompt / standalone launches
                </div>
              </div>

              <div className="rounded-xl border border-stone-800 bg-stone-950/80 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Platforms</span>
                  <Smartphone className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-sm sm:text-base font-mono font-bold text-white pt-1">
                  {stats.androidCount}A / {stats.iosCount}iOS / {stats.desktopCount}PC
                </div>
                <div className="text-[11px] text-stone-500">Android • iPhone • Desktop</div>
              </div>

              <div className="rounded-xl border border-stone-800 bg-stone-950/80 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Player Rating</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-2xl font-serif font-bold text-white tabular-nums">
                  {stats.avgRating} / 5
                </div>
                <div className="text-[11px] text-stone-500">
                  {ratings.length} submitted review{ratings.length === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            {/* Filter & Tab Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('downloads')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                    activeTab === 'downloads'
                      ? 'bg-red-700 border-red-500 text-white'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  Downloaders ({downloads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ratings')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                    activeTab === 'ratings'
                      ? 'bg-red-700 border-red-500 text-white'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  Player Ratings ({ratings.length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter browser, device, note..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-800 bg-stone-950 text-xs text-stone-100 placeholder:text-stone-600 focus:border-red-500 focus:outline-none w-48 sm:w-56"
                  />
                </div>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as 'all' | DevicePlatform)}
                  className="px-2.5 py-1.5 rounded-lg border border-stone-800 bg-stone-950 text-xs text-stone-200 focus:border-red-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Platforms</option>
                  <option value="android">Android</option>
                  <option value="ios">iPhone / iPad</option>
                  <option value="desktop">Desktop</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Tab Content */}
            {loadingData ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Loading real Firestore records...
              </div>
            ) : activeTab === 'downloads' ? (
              filteredDownloads.length === 0 ? (
                <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-10 text-center text-xs sm:text-sm text-stone-400">
                  No downloader records recorded yet. Once players install the PWA or open the
                  installed app while online, their real device activity appears here automatically.
                </div>
              ) : (
                <div className="rounded-xl border border-stone-800 overflow-x-auto bg-stone-950/60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-800 bg-stone-900/60 text-stone-400 font-mono uppercase text-[11px]">
                        <th className="py-3 px-4">Platform</th>
                        <th className="py-3 px-4">Event</th>
                        <th className="py-3 px-4">Browser</th>
                        <th className="py-3 px-4">Device ID</th>
                        <th className="py-3 px-4">Version</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/70">
                      {filteredDownloads.map((row) => (
                        <tr key={row.id} className="hover:bg-stone-900/40">
                          <td className="py-3 px-4">
                            <PlatformBadge platform={row.platform} />
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-200">
                            {formatInstallType(row.installType)}
                            {row.playerTag && (
                              <span className="ml-2 text-amber-300 font-mono text-[11px]">
                                ({row.playerTag})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-300">{row.browser}</td>
                          <td className="py-3 px-4 font-mono text-stone-400 text-[11px]">
                            {row.deviceClientId.slice(0, 14)}
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-300">v{row.appVersion}</td>
                          <td className="py-3 px-4 text-stone-400 whitespace-nowrap">
                            {formatTimestamp(row.createdAtMs)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => void handleDelete('downloads', row.id)}
                              disabled={deletingId === row.id}
                              className="p-1.5 rounded hover:bg-red-950 text-stone-500 hover:text-red-400 cursor-pointer disabled:opacity-40"
                              title="Remove entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredRatings.length === 0 ? (
              <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-10 text-center text-xs sm:text-sm text-stone-400">
                No player ratings synced yet. Ratings submitted via Rate Us while online appear here
                automatically.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRatings.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border border-stone-800 bg-stone-950/70 p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-4 h-4 ${
                                n <= row.stars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-stone-700'
                              }`}
                            />
                          ))}
                        </div>
                        <PlatformBadge platform={row.platform} />
                        {row.playerTag && (
                          <span className="text-xs font-semibold text-amber-200">
                            {row.playerTag}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-stone-500">
                          v{row.appVersion} • {formatTimestamp(row.createdAtMs)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                        {row.comment ? row.comment : <span className="text-stone-500 italic">No written comment</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete('ratings', row.id)}
                      disabled={deletingId === row.id}
                      className="self-start p-1.5 rounded hover:bg-red-950 text-stone-500 hover:text-red-400 cursor-pointer disabled:opacity-40"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const OwnerDashboardModal: React.FC<OwnerDashboardModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Strange Creation Owner Dashboard"
    >
      <DashboardErrorBoundary>
        <OwnerDashboardContent onClose={onClose} />
      </DashboardErrorBoundary>
    </div>
  );
};
