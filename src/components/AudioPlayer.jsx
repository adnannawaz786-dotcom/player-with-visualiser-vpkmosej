import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';
import { audioSamples } from '../config/audioSamples';

const AudioPlayer = ({ onAudioAnalyzer }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize audio context and analyzer
  useEffect(() => {
    const initAudioContext = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          analyzerRef.current = audioContextRef.current.createAnalyser();
          analyzerRef.current.fftSize = 256;
          analyzerRef.current.smoothingTimeConstant = 0.8;
        }
      } catch (err) {
        console.error('Error initializing audio context:', err);
        setError('Audio context initialization failed');
      }
    };

    initAudioContext();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Connect audio element to analyzer when track changes
  useEffect(() => {
    if (audioRef.current && audioContextRef.current && analyzerRef.current) {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContextRef.current.destination);
        
        // Pass analyzer to parent for visualizer
        if (onAudioAnalyzer) {
          onAudioAnalyzer(analyzerRef.current);
        }
      } catch (err) {
        // Source might already be connected, ignore error
        console.warn('Audio source connection warning:', err);
      }
    }
  }, [currentTrack, onAudioAnalyzer]);

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        await audioRef.current.play();
        setIsLoading(false);
      }
      setIsPlaying(!isPlaying);
      setError(null);
    } catch (err) {
      console.error('Playback error:', err);
      setError('Playback failed');
      setIsLoading(false);
    }
  };

  // Handle track navigation
  const playPrevious = () => {
    const newTrack = currentTrack > 0 ? currentTrack - 1 : audioSamples.length - 1;
    setCurrentTrack(newTrack);
    setCurrentTime(0);
  };

  const playNext = () => {
    if (isShuffled) {
      const randomTrack = Math.floor(Math.random() * audioSamples.length);
      setCurrentTrack(randomTrack);
    } else {
      const newTrack = currentTrack < audioSamples.length - 1 ? currentTrack + 1 : 0;
      setCurrentTrack(newTrack);
    }
    setCurrentTime(0);
  };

  // Handle volume changes
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Handle progress bar
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    } else if (repeatMode === 'all' || currentTrack < audioSamples.length - 1) {
      playNext();
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 100);
    }
  };

  const handleError = (e) => {
    console.error('Audio error:', e);
    setError('Failed to load audio track');
    setIsPlaying(false);
    setIsLoading(false);
  };

  // Format time display
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Toggle repeat mode
  const toggleRepeat = () => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const currentSample = audioSamples[currentTrack];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl"
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentSample?.url}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {/* Track Info */}
      <div className="text-center mb-6">
        <motion.h3
          key={currentSample?.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-semibold text-white mb-2"
        >
          {currentSample?.title || 'Unknown Track'}
        </motion.h3>
        <motion.p
          key={currentSample?.artist}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-white/70"
        >
          {currentSample?.artist || 'Unknown Artist'}
        </motion.p>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 text-center text-red-200 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/70 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                duration ? (currentTime / duration) * 100 : 0
              }%, rgba(255,255,255,0.2) ${
                duration ? (currentTime / duration) * 100 : 0
              }%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsShuffled(!isShuffled)}
          className={`p-2 rounded-full transition-colors ${
            isShuffled ? 'bg-blue-500 text-white' : 'bg-white/20 text-white/70 hover:text-white'
          }`}
        >
          <Shuffle size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={playPrevious}
          className="p-3 bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <SkipBack size={24} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          disabled={isLoading}
          className="p-4 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause size={28} />
          ) : (
            <Play size={28} className="ml-1" />
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={playNext}
          className="p-3 bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <SkipForward size={24} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleRepeat}
          className={`p-2 rounded-full transition-colors relative ${
            repeatMode !== 'none' ? 'bg-blue-500 text-white' : 'bg-white/20 text-white/70 hover:text-white'
          }`}
        >
          <Repeat size={20} />
          {repeatMode === 'one' && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full text-xs flex items-center justify-center text-white font-bold">
              1
            </span>
          )}
        </motion.button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className="p-2 bg-white/20 rounded-full text-white/70 hover:text-white transition-colors"
        >
          {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </motion.button>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                (isMuted ? 0 : volume) * 100
              }%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>
      </div>

      {/* Track List */}
      <div className="mt-6 max-h-32 overflow-y-auto">
        <div className="space-y-1">
          {audioSamples.map((sample, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCurrentTrack(index);
                setCurrentTime(0);
              }}
              className={`w-full text-left p-2 rounded-lg transition-colors ${
                index === currentTrack
                  ? 'bg-blue-500/30 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              <div className="text-sm font-medium truncate">{sample.title}</div>
              <div className="text-xs opacity-70 truncate">{sample.artist}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;
