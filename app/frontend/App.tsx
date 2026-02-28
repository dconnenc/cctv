import { Suspense, lazy, useEffect, useState } from 'react';

import { Outlet, Route, useLocation } from 'react-router-dom';

import { BackgroundStatic, RouteWink, TopNav } from '@cctv/components';
import { ExperienceProvider } from '@cctv/contexts/ExperienceContext';
import { UserProvider } from '@cctv/contexts/UserContext';
import Create from '@cctv/pages/Create/Create';
import Avatar from '@cctv/pages/Experience/Avatar';
import Experience from '@cctv/pages/Experience/Experience';
import Monitor from '@cctv/pages/Monitor/Monitor';
import Playbill from '@cctv/pages/Playbill/Playbill';
import Register from '@cctv/pages/Register';
import About from '@cctv/pages/about';
import Home from '@cctv/pages/home';
import Join from '@cctv/pages/join';
import Stylesheet from '@cctv/pages/stylesheet';

import {
  AllowRegisterRoute,
  RequireAdmin,
  RequireExperienceHostOrAdmin,
  RequireExperienceParticipantOrAdmin,
} from './RouteRules';

import styles from './App.module.scss';

const BlockPage = lazy(() =>
  import('@cctv/pages/Block/Block').then((m) => ({ default: m.BlockPage })),
);
const ManageCreateBlock = lazy(() => import('@cctv/pages/ManageCreateBlock/ManageCreateBlock'));
const ManageViewer = lazy(() => import('@cctv/pages/Manage/Viewer/ManageViewer'));

function App() {
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(t);
  }, []);

  const currentRoute = useLocation();

  return (
    <UserProvider>
      <div className={`app${booting ? ' app--booting' : ''}`}>
        <BackgroundStatic />
        {!currentRoute.pathname.includes('/monitor') && <TopNav />}
        <div className={styles.root}>
          <Suspense fallback={<div className="flex-centered">Loading…</div>}>
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

                {/* Public/unauthenticated Monitor view */}
                <Route path="monitor" element={<Monitor />} />

                <Route element={<RequireExperienceParticipantOrAdmin />}>
                  <Route index element={<Experience />} />
                  <Route path="avatar" element={<Avatar />} />
                  <Route path="playbill" element={<Playbill />} />

                  <Route element={<RequireExperienceHostOrAdmin />}>
                    <Route path="manage" element={<ManageViewer />} />
                    <Route path="manage/blocks/new" element={<ManageCreateBlock />} />
                    <Route path="manage/blocks/:blockId" element={<BlockPage />} />
                  </Route>
                </Route>
              </Route>
            </RouteWink>
          </Suspense>
        </div>
      </div>
    </UserProvider>
  );
}

export default App;
