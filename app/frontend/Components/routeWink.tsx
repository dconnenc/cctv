import { useEffect, useState } from 'react';

import { Routes, useLocation } from 'react-router-dom';

type WinkRoutesProps = {
  children: React.ReactNode;
};

// Controls route rendering order to wink-out old content, then wink-in new content
export const RouteWink: React.FC<WinkRoutesProps> = ({ children }) => {
  const location = useLocation();
  const [displayedLocation, setDisplayedLocation] = useState(location);

  // Only animate on first load via .app--booting styles.
  // For route changes, swap immediately without wink animations.
  useEffect(() => {
    if (location.pathname !== displayedLocation.pathname) {
      setDisplayedLocation(location);
    }
  }, [location, displayedLocation.pathname]);

  const cls = 'wink-container';

  return (
    <div className={cls}>
      <Routes location={displayedLocation}>{children}</Routes>
    </div>
  );
};
