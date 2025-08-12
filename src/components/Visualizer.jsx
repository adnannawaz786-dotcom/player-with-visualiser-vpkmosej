
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const Visualizer = ({ 
  audioRef, 
  isPlaying, 
  visualizerType = 'bars',
  color = '#3b82f6',
  sensitivity = 1
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Web Audio API
  const initializeAudioContext = useCallback(async () => {
    if (!audioRef?.current || isInitialized) return;

    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;

      // Create source from audio element
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      
      // Connect nodes
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      // Create data array
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }, [audioRef, isInitialized]);

  // Resume audio context if suspended
  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Draw frequency bars visualization
  const drawBars = useCallback((canvas, ctx, dataArray) => {
    const width = canvas.width;
    const height = canvas.height;
    const barCount = dataArray.length;
    const barWidth = width / barCount;

    ctx.clearRect(0, 0, width, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(0.5, color + '80');
    gradient.addColorStop(1, color);

    ctx.fillStyle = gradient;

    for (let i = 0; i < barCount; i++) {
      const barHeight = (dataArray[i] / 255) * height * sensitivity;
      const x = i * barWidth;
      const y = height - barHeight;

      // Draw bar with rounded top
      ctx.beginPath();
      ctx.roundRect(x + 1, y, barWidth - 2, barHeight, [2, 2, 0, 0]);
      ctx.fill();

      // Add glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [color, sensitivity]);

  // Draw circular visualization
  const drawCircular = useCallback((canvas, ctx, dataArray) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    ctx.clearRect(0, 0, width, height);

    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 20, 0, 2 * Math.PI);
    ctx.strokeStyle = color + '20';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw frequency bars in circle
    const barCount = dataArray.length;
    const angleStep = (2 * Math.PI) / barCount;

    for (let i = 0; i < barCount; i++) {
      const angle = i * angleStep;
      const barHeight = (dataArray[i] / 255) * 60 * sensitivity;
      
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Add glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = color + '60';
    ctx.fill();
  }, [color, sensitivity]);

  // Draw waveform visualization
  const drawWaveform = useCallback((canvas, ctx, dataArray) => {
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, color + '60');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, color + '60');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] / 255) * sensitivity;
      const y = centerY + (v * height / 2) - (height / 4);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [color, sensitivity]);

  // Animation loop
  const animate = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Draw visualization based on type
    switch (visualizerType) {
      case 'circular':
        drawCircular(canvas, ctx, dataArrayRef.current);
        break;
      case 'waveform':
        drawWaveform(canvas, ctx, dataArrayRef.current);
        break;
      case 'bars':
      default:
        drawBars(canvas, ctx, dataArrayRef.current);
        break;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, visualizerType, drawBars, drawCircular, drawWaveform]);

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }, []);

  // Initialize audio context when audio starts playing
  useEffect(() => {
    if (isPlaying && audioRef?.current) {
      initializeAudioContext();
      resumeAudioContext();
    }
  }, [isPlaying, audioRef, initializeAudioContext, resumeAudioContext]);

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && isInitialized) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isInitialized, animate]);

  // Handle window resize
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <motion.div
      className="relative w-full h-full min-h-[200px] rounded-xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          background: 'transparent',
          filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.1))'
        }}
      />
      
      {!isPlaying && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 opacity-60" />
            </div>
            <p className="text-white/60 text-sm">
              Play music to see visualization
            </p>
          </div>
        </motion.div>
      )}

      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-8 right-8 w-1 h-1 bg-blue-400/40 rounded-full animate-pulse delay-300" />
        <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-pulse delay-700" />
      </div>
    </motion.div>
  );
};
export default Visualizer;
```