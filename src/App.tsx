import { Route, Routes } from 'react-router-dom';
import Home from './Pages/home';
import About from './Pages/about';
import { TopNav } from './Components/topnav';
import { Static } from './Components/static';

function App() {
  return (
    <>
      <Static />
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default App;
