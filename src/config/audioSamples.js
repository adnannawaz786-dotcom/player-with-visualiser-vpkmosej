// Audio sample configuration and player settings
// Contains demo tracks, player configuration, and audio processing settings

export const audioSamples = [
  {
    id: 1,
    title: "Ethereal Dreams",
    artist: "Digital Harmony",
    duration: "3:45",
    url: "https://pub-a4a7ff546cda456c97a2cf017c996af6.r2.dev/1a3fdb3c-b58f-4eea-9053-8e7e0f9f302e_Eesah_Junior_Dread_Little_Lion_Sound_808_Delavega_-_Rise_My_People_Official_Audio.mp3",
    cover: "https://via.placeholder.com/300x300/667eea/ffffff?text=Ethereal+Dreams",
    genre: "Ambient",
    year: 2024
  },
  {
    id: 2,
    title: "Neon Nights",
    artist: "Synthwave Collective",
    duration: "4:12",
    url: "https://pub-a4a7ff546cda456c97a2cf017c996af6.r2.dev/b5646358-1fb6-4685-834b-b4aba17f453e_2Pac_-_Broken_Oaths_ft_DMX_2025.mp3",
    cover: "https://via.placeholder.com/300x300/764ba2/ffffff?text=Neon+Nights",
    genre: "Synthwave",
    year: 2024
  },
  {
    id: 3,
    title: "Ocean Waves",
    artist: "Nature Sounds",
    duration: "5:30",
    url: "https://pub-a4a7ff546cda456c97a2cf017c996af6.r2.dev/1faf6891-f33b-4722-b124-2eff7da0d7cf_2Pac_-_Real_Talk_ft_Outlawz_2025_Young_Noble_Hussein_Fatal_Yaki_Kadafi.mp3",
    cover: "https://via.placeholder.com/300x300/667eea/ffffff?text=Ocean+Waves",
    genre: "Nature",
    year: 2024
  },
  {
    id: 4,
    title: "Urban Pulse",
    artist: "City Beats",
    duration: "3:28",
    url: "https://pub-a4a7ff546cda456c97a2cf017c996af6.r2.dev/d9df99ae-451d-4ab7-9e0e-5df1bb55442a_Chezidek_-_Dubplate_-_Little_Lion_Sound_-_Next_Episode_Official_Audio.mp3",
    cover: "https://via.placeholder.com/300x300/f093fb/ffffff?text=Urban+Pulse",
    genre: "Electronic",
    year: 2024
  },
  {
    id: 5,
    title: "Cosmic Journey",
    artist: "Space Explorers",
    duration: "6:15",
    url: "https://pub-a4a7ff546cda456c97a2cf017c996af6.r2.dev/d9df99ae-451d-4ab7-9e0e-5df1bb55442a_Chezidek_-_Dubplate_-_Little_Lion_Sound_-_Next_Episode_Official_Audio.mp3",
    cover: "https://via.placeholder.com/300x300/4facfe/ffffff?text=Cosmic+Journey",
    genre: "Ambient",
    year: 2024
  }
];

// Player configuration settings
export const playerConfig = {
  // Audio context settings
  audioContext: {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10
  },
  
  // Visualizer settings
  visualizer: {
    barCount: 64,
    barWidth: 4,
    barSpacing: 2,
    minBarHeight: 2,
    maxBarHeight: 200,
    colorScheme: 'rainbow', // 'rainbow', 'blue', 'purple', 'green'
    animationSpeed: 0.1,
    sensitivity: 1.5
  },
  
  // Player UI settings
  ui: {
    showPlaylist: true,
    showVisualizer: true,
    autoPlay: false,
    shuffle: false,
    repeat: 'none', // 'none', 'one', 'all'
    volume: 0.7,
    crossfade: false
  },
  
  // Color schemes for visualizer
  colorSchemes: {
    rainbow: [
      '#ff0000', '#ff4000', '#ff8000', '#ffbf00', '#ffff00',
      '#bfff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40',
      '#00ff80', '#00ffbf', '#00ffff', '#00bfff', '#0080ff',
      '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#bf00ff'
    ],
    blue: [
      '#000080', '#0000a0', '#0000c0', '#0000e0', '#0000ff',
      '#2020ff', '#4040ff', '#6060ff', '#8080ff', '#a0a0ff'
    ],
    purple: [
      '#4a0080', '#6000a0', '#7000c0', '#8000e0', '#9000ff',
      '#a020ff', '#b040ff', '#c060ff', '#d080ff', '#e0a0ff'
    ],
    green: [
      '#004000', '#006000', '#008000', '#00a000', '#00c000',
      '#20ff20', '#40ff40', '#60ff60', '#80ff80', '#a0ffa0'
    ]
  }
};

// Audio processing utilities
export const audioUtils = {
  // Convert frequency data to decibels
  frequencyToDecibels: (frequency) => {
    return 20 * Math.log10(frequency / 255);
  },
  
  // Apply smoothing to frequency data
  smoothFrequencyData: (currentData, previousData, smoothing = 0.8) => {
    if (!previousData) return currentData;
    
    return currentData.map((value, index) => {
      return previousData[index] * smoothing + value * (1 - smoothing);
    });
  },
  
  // Get dominant frequency
  getDominantFrequency: (frequencyData) => {
    let maxValue = 0;
    let dominantIndex = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        dominantIndex = i;
      }
    }
    
    return dominantIndex;
  },
  
  // Calculate RMS (Root Mean Square) for volume level
  calculateRMS: (frequencyData) => {
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    return Math.sqrt(sum / frequencyData.length);
  },
  
  // Format time duration
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  // Generate demo audio using Web Audio API (for fallback)
  generateDemoTone: (audioContext, frequency = 440, duration = 1) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
    
    return oscillator;
  }
};

// Preset visualizer themes
export const visualizerThemes = {
  cosmic: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    barColors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
    glowEffect: true,
    particleEffect: true
  },
  
  ocean: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    barColors: ['#00c9ff', '#92fe9d', '#00b4db', '#0083b0'],
    glowEffect: true,
    particleEffect: false
  },
  
  sunset: {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    barColors: ['#fa709a', '#fee140', '#ff6b6b', '#feca57'],
    glowEffect: true,
    particleEffect: true
  },
  
  neon: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    barColors: ['#00ff88', '#00ccff', '#ff0088', '#ffaa00'],
    glowEffect: true,
    particleEffect: true
  }
};

// Default export with all configurations
export default {
  audioSamples,
  playerConfig,
  audioUtils,
  visualizerThemes
};