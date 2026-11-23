import React from 'react';
import { Loader2 } from 'lucide-react';
import { GAME_VERSION } from '../game/version';
import officialLogoImg from '../assets/images/kalapur_official_logo_1793628694332.jpg';

interface AppSplashLoaderProps {
  message?: string;
}

export const AppSplashLoader: React.FC<AppSplashLoaderProps> = ({
  message = 'Preparing Kalapur Haveli & 3D Audio Engine...',
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#060810] flex flex-col items-center justify-center p-6 select-none text-stone-100">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
        <div className="w-56 sm:w-64 aspect-video rounded-xl overflow-hidden border border-red-900/60 shadow-[0_0_50px_rgba(185,28,28,0.4)] bg-black">
          <img
            src={officialLogoImg}
            alt="The Curse of Kalapur Logo"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase tracking-[0.26em] text-red-400">
            Strange Creation
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-white">
            THE CURSE OF KALAPUR
          </h2>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
            <div className="h-full w-2/3 bg-gradient-to-r from-red-700 via-red-500 to-amber-500 animate-pulse rounded-full" />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-stone-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
            <span>{message}</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-stone-500">
          v{GAME_VERSION} • Standalone Progressive Web App
        </div>
      </div>
    </div>
  );
};
