import { Route, Routes } from 'react-router-dom';
import Home from './Pages/home';
import About from './Pages/about';
import { TopNav } from './Components/topnav';
import { Static } from './Components/static';

function App() {
  return (
    <div className="app">
      <Static />
      <TopNav />
      <div className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
