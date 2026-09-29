import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LandingPage } from './components/LandingPage';
import './index.css';

function Root() {
  const hasRoomInvite = new URLSearchParams(window.location.search).has('room');
  const [showGame, setShowGame] = useState(hasRoomInvite);

  if (showGame) return <App />;

  return (
    <LandingPage
      onStartGame={(mode) => {
        if (mode === 'vs_ai') setShowGame(true);
      }}
      onJoinRoom={(roomId) => {
        window.location.href = `${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
      }}
    />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
