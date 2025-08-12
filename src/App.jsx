```jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AudioPlayer from './components/AudioPlayer';
import Visualizer from './components/Visualizer';
import { initializeAudioContext, connectAnalyzer } from './utils/audioContext';
import './styles/global.css';

const App = () => {
  const [audioContext, setAudioContext] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const sourceRef = useRef(null);

  // Initialize audio context on user interaction
  const initAudio = async () => {
    try {
      if (!audioContext) {
        const { context, analyser } = await initializeAudioContext();
        setAudioContext(context);
        setAnalyzer(analyser);
      }
    } catch (err) {
      setError('Failed to initialize audio context');
      console.error('Audio initialization error:', err);
    }
  };

  // Connect audio element to analyzer when track changes
  useEffect(() => {
    if (audioContext && analyzer && audioRef.current && !sourceRef.current) {
      try {
        sourceRef.current = connectAnalyzer(audioContext, analyzer, audioRef.current);
      } catch (err) {
        console.error('Failed to connect analyzer:', err);
      }
    }
  }, [audioContext, analyzer, currentTrack]);

  // Handle track loading
  const handleTrackLoad = async (track) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await initAudio();
      setCurrentTrack(track);
      
      if (audioRef.current) {
        audioRef.current.src = track.url;
        audioRef.current.volume = volume;
      }
    } catch (err) {
      setError('Failed to load track');
      console.error('Track loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      await initAudio();
      
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Playback failed');
      console.error('Playback error:', err);
    }
  };

  // Handle volume change
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Audio event handlers
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    setError('Audio playback error');
    setIsPlaying(false);
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
          animate={{
            rotate: [360, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl mx-auto"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Audio Visualizer
              </span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Experience your music like never before with stunning real-time visualizations
            </p>
          </motion.div>

          {/* Error notification */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-panel bg-red-500/20 border-red-400/30 text-red-200 p-4 rounded-lg mb-6 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Visualizer section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="glass-panel p-6 h-full min-h-[400px] lg:min-h-[500px]">
                <Visualizer
                  analyzer={analyzer}
                  isPlaying={isPlaying}
                  currentTrack={currentTrack}
                />
              </div>
            </motion.div>

            {/* Audio player section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="glass-panel p-6 h-full">
                <AudioPlayer
                  audioRef={audioRef}
                  isPlaying={isPlaying}
                  currentTrack={currentTrack}
                  volume={volume}
                  isLoading={isLoading}
                  onTrackLoad={handleTrackLoad}
                  onPlayPause={handlePlayPause}
                  onVolumeChange={handleVolumeChange}
                />
              </div>
            </motion.div>
          </div>

          {/* Footer info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-8 text-white/50 text-sm"
          >
            <p>Click play to start the audio visualization experience</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        crossOrigin="anonymous"
        preload="metadata"
      />
    </div>
  );
};

export default App;
```