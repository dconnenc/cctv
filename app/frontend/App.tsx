import { useEffect, useState } from 'react';

import { Outlet, Route, useLocation } from 'react-router-dom';

import { BackgroundStatic, RouteWink, TopNav } from '@cctv/components';
import { ExperienceProvider, UserProvider } from '@cctv/contexts';
import {
  About,
  Block,
  Calendar,
  Create,
  CreateEvent,
  CreatePerformer,
  EditEvent,
  EditPerformer,
  EventDetail,
  Experience,
  Home,
  Join,
  Manage,
  ManageCreateBlock,
  Monitor,
  PerformerProfile,
  PerformersList,
  Playbill,
  Register,
  Stylesheet,
} from '@cctv/pages';

import { BlockPage } from './Pages/Block/Block';
import Avatar from './Pages/Experience/Avatar';
import ManageViewer from './Pages/Manage/Viewer/ManageViewer';
import {
  AllowRegisterRoute,
  RequireAdmin,
  RequireAuth,
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

  const currentRoute = useLocation();

  return (
    <UserProvider>
      <div className={`app${booting ? ' app--booting' : ''}`}>
        <BackgroundStatic />
        {!currentRoute.pathname.includes('/monitor') && <TopNav />}
        <div className={styles.root}>
          <RouteWink>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/join" element={<Join />} />
            <Route path="/stylesheet" element={<Stylesheet />} />

            {/* Public event & performer pages */}
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/performers" element={<PerformersList />} />
            <Route path="/performers/:slug" element={<PerformerProfile />} />

            {/* Logged-in user routes */}
            <Route element={<RequireAuth />}>
              <Route path="/performers/new" element={<CreatePerformer />} />
              <Route path="/performers/:slug/edit" element={<EditPerformer />} />
            </Route>

            {/* Admin-only */}
            <Route element={<RequireAdmin />}>
              <Route path="/create" element={<Create />} />
              <Route path="/events/new" element={<CreateEvent />} />
              <Route path="/events/:slug/edit" element={<EditEvent />} />
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
                  <Route path="manage/old" element={<Manage />} />
                  <Route path="manage/blocks/new" element={<ManageCreateBlock />} />
                  <Route path="manage/blocks/:blockId" element={<BlockPage />} />
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
