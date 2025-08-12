import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'

// Initialize audio context on user interaction to comply with browser policies
let audioContextInitialized = false;

const initializeAudioContext = () => {
  if (!audioContextInitialized) {
    // This will be handled by the audioContext utility
    audioContextInitialized = true;
    document.removeEventListener('click', initializeAudioContext);
    document.removeEventListener('touchstart', initializeAudioContext);
  }
};

// Add event listeners for user interaction
document.addEventListener('click', initializeAudioContext);
document.addEventListener('touchstart', initializeAudioContext);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
