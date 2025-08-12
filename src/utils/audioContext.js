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
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (!analyser) {
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
    }

    if (!gainNode) {
      gainNode = audioContext.createGain();
    }

    if (!source && audioElement) {
      source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(audioContext.destination);
    }

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
 * Connect an audio element to the analyser
 * @param {HTMLAudioElement} audioElement - The audio element to connect
 * @returns {AnalyserNode} The connected analyser node
 */
export const connectAnalyzer = (audioElement) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (!analyser) {
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
  }

  if (!gainNode) {
    gainNode = audioContext.createGain();
  }

  const newSource = audioContext.createMediaElementSource(audioElement);
  newSource.connect(analyser);
  analyser.connect(gainNode);
  gainNode.connect(audioContext.destination);

  source = newSource;
  return analyser;
};

/**
 * Get current frequency data for visualization
 */
export const getFrequencyData = () => {
  if (!analyser || !dataArray) return null;
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
 */
export const getTimeDomainData = () => {
  if (!analyser || !dataArray) return null;
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
 */
export const getAverageFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) sum += frequencyData[i];
  return sum / frequencyData.length;
};

/**
 * Get bass frequencies (low-end spectrum)
 */
export const getBassFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;
  const bassRange = Math.floor(frequencyData.length / 8);
  let sum = 0;
  for (let i = 0; i < bassRange; i++) sum += frequencyData[i];
  return sum / bassRange;
};

/**
 * Get mid frequencies
 */
export const getMidFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;
  const start = Math.floor(frequencyData.length / 8);
  const end = Math.floor(frequencyData.length * 5 / 8);
  let sum = 0;
  for (let i = start; i < end; i++) sum += frequencyData[i];
  return sum / (end - start);
};

/**
 * Get treble frequencies (high-end spectrum)
 */
export const getTrebleFrequency = () => {
  const frequencyData = getFrequencyData();
  if (!frequencyData) return 0;
  const start = Math.floor(frequencyData.length * 5 / 8);
  let sum = 0;
  for (let i = start; i < frequencyData.length; i++) sum += frequencyData[i];
  return sum / (frequencyData.length - start);
};

/**
 * Detect beats based on frequency analysis
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
 */
export const isAudioContextSupported = () =>
  !!(window.AudioContext || window.webkitAudioContext);

/**
 * Get audio context state
 */
export const getAudioContextState = () =>
  audioContext ? audioContext.state : 'not-initialized';

/**
 * Resume audio context
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

export const getAudioContext = () => audioContext;
export const getAnalyser = () => analyser;
export const getGainNode = () => gainNode;
