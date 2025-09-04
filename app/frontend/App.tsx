import { Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './Pages/home';
import About from './Pages/about';
import Join from './Pages/join';
import Lobby from './Pages/lobby';
import Admin from './Pages/admin';
import Stylesheet from './Pages/stylesheet';
import { TopNav } from './Components/topnav';
import { BackgroundStatic } from './Components/BackgroundStatic';
import { RouteWink } from './Components/route-wink';

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
      <div className="app__main">
        <RouteWink>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/join" element={<Join />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/lobby/:sessionKey" element={<Lobby />} />
          <Route path="/stylesheet" element={<Stylesheet />} />
        </RouteWink>
      </div>
    </div>
  );
}

export default App;
