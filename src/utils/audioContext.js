```javascript
// Web Audio API setup and analyzer utilities
let audioContext = null;
let analyser = null;
let dataArray = null;
let source = null;
let gainNode = null;

/**
 * Initialize Web Audio API context and analyzer
 * @param {HTMLAudioElement} audioElement - The audio element to connect
 * @returns {Object} Audio context utilities
 */
export const initializeAudioContext = (audioElement) => {
  try {
    // Create audio context if it doesn't exist
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume context if suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create analyzer node
    if (!analyser) {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Higher values = more frequency data
      analyser.smoothingTimeConstant = 0.8; // Smoothing between frames
    }

    // Create gain node for volume control
    if (!gainNode) {
      gainNode = audioContext.createGain();
    }

    // Connect audio element to analyzer if not already connected
    if (!source && audioElement) {
      source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
    }

    // Initialize data array for frequency data
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    return {
      audioContext,
      analyser,
      dataArray,
      gainNode,
      isInitialized: true
    };
  } catch (error) {
    console.error('Error initializing audio context:', error);
    return {
      audioContext: null,
      analyser: null,
      dataArray: null,
      gainNode: null,
      isInitialized: false,
      error: error.message
    };
  }
};

/**
 * Get current frequency data for visualization
 * @returns {Uint8Array|null} Frequency data array
 */
export const getFrequencyData = () => {
  if (!analyser || !dataArray) {
    return null;
  }

  try {
    analyser.getByteFrequencyData(dataArray);
    return dataArray;
  } catch (error) {
    console.error('Error getting frequency data:', error);
    return null;
  }
};

/**
 * Get current time domain data (waveform)
 * @returns {Uint8Array|null} Time domain data array
 */
export const getTimeDomainData = () => {
  if (!analyser || !dataArray) {
    return null;
  }

  try {
    analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  } catch (error) {
    console.error('Error getting time domain data:', error);
    return null;
  }
};

/**
 * Set the volume using gain node
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
export const setVolume = (volume) => {
  if (!gainNode) {
    console.warn('Gain node not initialized');
    return;
  }

  try {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    gainNode.gain.setValueAtTime(clampedVolume, audioContext.currentTime);
  } catch (error) {
    console.error('Error setting volume:', error);
  }
};

/**
 * Get average frequency for beat detection
 * @returns {number} Average frequency value (0-255)
 */
export const getAverageFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;

  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) {
    sum += frequencyData[i];
  }
  return sum / frequencyData.length;
};

/**
 * Get bass frequencies (low-end spectrum)
 * @returns {number} Average bass frequency value
 */
export const getBassFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;

  // Bass frequencies are typically in the first 1/8 of the spectrum
  const bassRange = Math.floor(frequencyData.length / 8);
  let sum = 0;
  for (let i = 0; i < bassRange; i++) {
    sum += frequencyData[i];
  }
  return sum / bassRange;
};

/**
 * Get mid frequencies
 * @returns {number} Average mid frequency value
 */
export const getMidFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;

  // Mid frequencies are in the middle portion of the spectrum
  const start = Math.floor(frequencyData.length / 8);
  const end = Math.floor(frequencyData.length * 5 / 8);
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += frequencyData[i];
  }
  return sum / (end - start);
};

/**
 * Get treble frequencies (high-end spectrum)
 * @returns {number} Average treble frequency value
 */
export const getTrebleFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;

  // Treble frequencies are in the last 3/8 of the spectrum
  const start = Math.floor(frequencyData.length * 5 / 8);
  let sum = 0;
  for (let i = start; i < frequencyData.length; i++) {
    sum += frequencyData[i];
  }
  return sum / (frequencyData.length - start);
};

/**
 * Detect beats based on frequency analysis
 * @param {number} threshold - Beat detection threshold (0-255)
 * @returns {boolean} Whether a beat is detected
 */
export const detectBeat = (threshold = 200) => {
  const bassLevel = getBassFrequency();
  return bassLevel > threshold;
};

/**
 * Clean up audio context resources
 */
export const cleanupAudioContext = async () => {
  try {
    if (source) {
      source.disconnect();
      source = null;
    }
    
    if (analyser) {
      analyser.disconnect();
      analyser = null;
    }
    
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close();
      audioContext = null;
    }
    
    dataArray = null;
  } catch (error) {
    console.error('Error cleaning up audio context:', error);
  }
};

/**
 * Check if audio context is supported
 * @returns {boolean} Whether Web Audio API is supported
 */
export const isAudioContextSupported = () => {
  return !!(window.AudioContext || window.webkitAudioContext);
};

/**
 * Get audio context state
 * @returns {string} Current audio context state
 */
export const getAudioContextState = () => {
  return audioContext ? audioContext.state : 'not-initialized';
};

/**
 * Resume audio context (required after user interaction)
 */
export const resumeAudioContext = async () => {
  if (audioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      return true;
    } catch (error) {
      console.error('Error resuming audio context:', error);
      return false;
    }
  }
  return true;
};

// Export audio context instance for direct access if needed
export const getAudioContext = () => audioContext;
export const getAnalyser = () => analyser;
export const getGainNode = () => gainNode;
```