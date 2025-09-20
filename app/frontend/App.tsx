import { useEffect, useState, useMemo } from 'react';

import { Route } from 'react-router-dom';

import { BackgroundStatic, RouteWink, TopNav } from '@cctv/components';
import { Home, About, Join, Experience, Stylesheet, Create, Register, Manage } from '@cctv/pages';
import { UserProvider } from '@cctv/contexts/UserContext';
import { ExperienceProvider } from '@cctv/contexts/ExperienceContext';
import {
  AllowRegisterRoute,
  RequireAdmin,
  RequireExperienceParticipantOrAdmin,
  RequireExperienceHostOrAdmin
} from '@cctv/RouteRules';

import { Outlet } from "react-router-dom"

import styles from './App.module.scss';

function App() {
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(t);
  }, []);

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
