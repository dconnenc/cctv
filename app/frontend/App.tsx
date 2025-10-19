import { useEffect, useState } from 'react';

import { Route } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

import { BackgroundStatic, RouteWink, TopNav } from '@cctv/components';
import { ExperienceProvider, UserProvider } from '@cctv/contexts';
import { About, Create, Experience, Home, Join, Manage, Register, Stylesheet } from '@cctv/pages';

import {
  AllowRegisterRoute,
  RequireAdmin,
  RequireExperienceHostOrAdmin,
  RequireExperienceParticipantOrAdmin,
} from './RouteRules';

import styles from './App.module.scss';

function App() {
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(t);
  }, []);

  {
    /*
====Routes structure===:
  - Public:
  - `/`: Home
  - `/about`: About
  - `/join`: Join by code >> /experiences/:code/register
  - `/stylesheet`: Style guide
- Admin-only:
  - `/create`: Guarded by `RequireAdmin` (session-based)
- Experience container: `/experiences/:code` wrapped by `ExperienceProvider`
  - `index`: Guarded by `RequireExperienceParticipantOrAdmin`
  - `register`: Open to all but wrapped by `AllowRegisterRoute` to skip if already has JWT
  - `manage`: Wrapped (nested) by `RequireExperienceParticipantOrAdmin` then `RequireExperienceHostOrAdmin`
*/
  }
  return (
    <UserProvider>
      <div className={`app${booting ? ' app--booting' : ''}`}>
        <BackgroundStatic />
        <TopNav />
        <div className={styles.root}>
          <RouteWink>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/join" element={<Join />} />
            <Route path="/stylesheet" element={<Stylesheet />} />

            {/* Admin-only */}
            <Route element={<RequireAdmin />}>
              <Route path="/create" element={<Create />} />
            </Route>

            <Route
              path="/experiences/:code"
              element={
                <ExperienceProvider>
                  <Outlet />
                </ExperienceProvider>
              }
            >
              <Route element={<AllowRegisterRoute />}>
                <Route path="register" element={<Register />} />
              </Route>

              <Route element={<RequireExperienceParticipantOrAdmin />}>
                <Route index element={<Experience />} />

                <Route element={<RequireExperienceHostOrAdmin />}>
                  <Route path="manage" element={<Manage />} />
                </Route>
              </Route>
            </Route>
          </RouteWink>
        </div>
      </div>
    </UserProvider>
  );
}

export default App;
