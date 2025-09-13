import { Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './Pages/home';
import About from './Pages/about';
import Join from './Pages/join';
import Lobby from './Pages/lobby';
import Experience from './Pages/Experience';
import Stylesheet from './Pages/stylesheet';
import { TopNav } from './Components/topnav';
import { BackgroundStatic } from './Components/BackgroundStatic';
import { RouteWink } from './Components/routeWink';
import Create from './Pages/Create/Create';

import styles from './App.module.scss';

function App() {
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`app${booting ? ' app--booting' : ''}`}>
      <BackgroundStatic />
      <TopNav />
      <div className={styles.root}>
        <RouteWink>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/join" element={<Join />} />
          <Route path="/create" element={<Create />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/experience/:code" element={<Experience />} />
          <Route path="/stylesheet" element={<Stylesheet />} />
        </RouteWink>
      </div>
    </div>
  );
}

export default App;
