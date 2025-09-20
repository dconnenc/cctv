import { useEffect, useState } from 'react';

import { Route } from 'react-router-dom';

import { BackgroundStatic, RouteWink, TopNav } from '@cctv/components';
import { Home, About, Join, Experience, Stylesheet, Create, Register } from '@cctv/pages';
import { UserProvider } from '@cctv/contexts/UserContext';
import { ExperienceProvider } from '@cctv/contexts/ExperienceContext';


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
          </RouteWink>
        </div>
      </div>
    </UserProvider>
  );
}

export default App;
