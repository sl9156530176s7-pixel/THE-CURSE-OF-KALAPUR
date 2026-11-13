import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class GameErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="w-screen h-screen bg-black text-stone-200 flex flex-col items-center justify-center p-6 text-center font-sans">
          <h1 className="text-2xl font-bold text-red-500 mb-3">THE CURSE OF KALAPUR</h1>
          <p className="text-sm text-stone-400 max-w-md mb-4">
            A display error occurred while loading the 3D scene. Please refresh or enable WebGL in your browser.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-red-900 hover:bg-red-800 rounded text-white text-xs uppercase tracking-widest font-semibold cursor-pointer"
          >
            Reload Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GameErrorBoundary>
    <App />
  </GameErrorBoundary>
);
