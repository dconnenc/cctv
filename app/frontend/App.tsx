import { useEffect, useState } from 'react';

import { Route } from 'react-router-dom';

import { BackgroundStatic, RouteWink, TopNav } from '@cctv/components';
import { Home, About, Join, Experience, Stylesheet, Create, Register, Manage } from '@cctv/pages';
import { UserProvider, useUser } from '@cctv/contexts/UserContext';
import { ExperienceProvider } from '@cctv/contexts/ExperienceContext';

import { Outlet, useNavigate } from "react-router-dom"

export const RequireAdminUserSignedIn = () => {
  const navigate = useNavigate()
  const { user, isAdmin, isLoading } = useUser()

  console.log(user)
  useEffect(() => {
    console.log("user: ", user)
    console.log("isAdmin: ", isAdmin)
    console.log("isLoading: ", isLoading)
    if (isLoading) {
      return
    }

    if (!user || (user && !isAdmin)) {
      window.location.href = "/"
    }
  }, [user, isLoading])

  if (!user) {
    return null
  }

  return <Outlet />
}


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
            <Route path="/create" element={<Create />} />
            <Route path="/stylesheet" element={<Stylesheet />} />

            <Route
              path="/experiences/:code"
              element={
                <ExperienceProvider>
                  <Experience />
                </ExperienceProvider>
              }
            />
            <Route
              path="/experiences/:code/register"
              element={
                <ExperienceProvider>
                  <Register />
                </ExperienceProvider>
              }
            />
            <Route element={<RequireAdminUserSignedIn />}>
              <Route
                path="/experiences/:code/manage"
                element={
                  <ExperienceProvider>
                    <Manage />
                  </ExperienceProvider>
                }
              />
            </Route>
          </RouteWink>
        </div>
      </div>
    </UserProvider>
  );
}

export default App;
