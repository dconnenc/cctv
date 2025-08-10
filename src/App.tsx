import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app__header">
        <h1>React + TypeScript</h1>
        <p>Vite-powered single page app scaffold.</p>
      </header>
      <main className="app__main tv-static">
        <button className="btn" onClick={() => setCount((c) => c + 1)}>
          Count: {count}
        </button>
      </main>
    </div>
  )
}

export default App
