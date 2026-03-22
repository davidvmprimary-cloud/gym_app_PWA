import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Workout from './pages/Workout.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';
import BottomNav from './components/BottomNav.jsx';

/**
 * Simple Generic Error Boundary
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#f0f0f0' }}>
          <h2>Something went wrong.</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '10px', 
              padding: '10px 20px', 
              backgroundColor: '#4a7c59', 
              color: 'white',
              borderRadius: '5px'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </ErrorBoundary>
  );
}

export default App;
