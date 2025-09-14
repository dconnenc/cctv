import { useEffect, useRef, useState } from 'react';

import { Routes, useLocation } from 'react-router-dom';

type WinkRoutesProps = {
  children: React.ReactNode;
};

// Controls route rendering order to wink-out old content, then wink-in new content
export const RouteWink: React.FC<WinkRoutesProps> = ({ children }) => {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);
  const pendingLocationRef = useRef(location);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');

  useEffect(() => {
    if (location.pathname !== displayedLocation.pathname) {
      pendingLocationRef.current = location;
      setPhase('out');
      const outT = setTimeout(() => {
        // Swap to the new route after wink-out completes
        setDisplayedLocation(pendingLocationRef.current);
        setPhase('in');
        const inT = setTimeout(() => setPhase('idle'), 220); // wink-in duration
        return () => clearTimeout(inT);
      }, 160); // wink-out duration
      return () => clearTimeout(outT);
    }
  }, [location, displayedLocation.pathname]);

  const cls = `wink-container${phase === 'out' ? ' is-wink-out' : ''}${
    phase === 'in' ? ' is-wink-in' : ''
  }`;

  return (
    <div className={cls}>
      <Routes location={displayedLocation}>{children}</Routes>
    </div>
  );
};
