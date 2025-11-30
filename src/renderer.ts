/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import playSvg from './assets/ui/PlayButton.svg';
import playPressedSvg from './assets/ui/PlayButtonPressed.svg';
import rewindSvg from './assets/ui/RewindButton.svg';
import rewindPressedSvg from './assets/ui/RewindButtonPressed.svg';
import forwardSvg from './assets/ui/FastFowardButton.svg';
import forwardPressedSvg from './assets/ui/FastFowardButtonPressed.svg';
import pauseSvg from './assets/ui/PauseButton.svg';
import pausePressedSvg from './assets/ui/PauseButtonPressed.svg';
import sourceButtonSvg from './assets/ui/WideButtonReleased.svg';
import sourceButtonPressedSvg from './assets/ui/WideButtonPressed.svg';
import volumeTrackSvg from './assets/ui/VolumeSliderTrack.svg';
import volumeThumbSvg from './assets/ui/VolumeSliderThumb.svg';
import pressSoundUrl from './assets/sounds/ButtonPress.wav';
import releaseSoundUrl from './assets/sounds/ButtonRelease.wav';

// Shared press/release sounds for all controls
const pressAudio = new Audio(pressSoundUrl);
pressAudio.preload = 'auto';
const releaseAudio = new Audio(releaseSoundUrl);
releaseAudio.preload = 'auto';
const playPressSound = () => {
  try { pressAudio.currentTime = 0; } catch {}
  void pressAudio.play().catch(() => {});
};
const playReleaseSound = () => {
  try { releaseAudio.currentTime = 0; } catch {}
  void releaseAudio.play().catch(() => {});
};

// Audio player state
let musicSourcePath: string | null = null;
let mp3FilesList: string[] = [];
let currentTrackIndex = 0;
let validMusicSource = false;
let musicAudio: HTMLAudioElement | null = null;

// Initialize audio player
const initAudioPlayer = () => {
  if (!musicAudio) {
    musicAudio = new Audio();
    musicAudio.preload = 'metadata';
    // Set initial volume from slider
    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;
    if (volumeSlider) {
      musicAudio.volume = parseInt(volumeSlider.value) / 100;
    }
  }
};

// Update file list highlight to show currently playing track
const updateFileListHighlight = () => {
  const fileList = document.getElementById('file-list') as HTMLDivElement | null;
  if (!fileList) return;

  // Remove active class from all items
  const allItems = fileList.querySelectorAll('.file-item');
  allItems.forEach((item) => item.classList.remove('active'));

  // Add active class to current track
  const currentItem = fileList.querySelector(
    `#file-item-${currentTrackIndex}`
  ) as HTMLDivElement | null;
  if (currentItem) {
    currentItem.classList.add('active');
  }
};

// Momentary press behavior: show pressed icon while held, revert on release
const playIcon = document.getElementById('play-icon') as HTMLImageElement | null;
const playToggle = document.getElementById('play-toggle') as HTMLButtonElement | null;
const rewindIcon = document.getElementById('rewind-icon') as HTMLImageElement | null;
const rewindBtn = document.getElementById('rewind') as HTMLButtonElement | null;
const forwardIcon = document.getElementById('forward-icon') as HTMLImageElement | null;
const forwardBtn = document.getElementById('forward') as HTMLButtonElement | null;

if (playIcon) {
  // Set initial icon
  playIcon.src = playSvg;
}
if (rewindIcon) {
  rewindIcon.src = rewindSvg;
}
if (forwardIcon) {
  forwardIcon.src = forwardSvg;
}

// Play state tracking
let isPlaying = false;

// Helper function to update play icon
const setUpIcon = () => {
  if (playIcon) {
    playIcon.src = isPlaying ? pauseSvg : playSvg;
  }
};

if (playToggle && playIcon) {
  let isDown = false;

  const setDownIcon = () => {
    playIcon.src = isPlaying ? pausePressedSvg : playPressedSvg;
  };

  // Ensure initial state shows Play
  setUpIcon();

  const handlePlayToggle = async () => {
    if (!validMusicSource) {
      // Button does nothing until valid music source is set
      return;
    }

    initAudioPlayer();
    
    // Check if we have a loaded audio file
    if (musicAudio && musicAudio.src) {
      // Audio is already loaded, just toggle play/pause
      if (musicAudio.paused) {
        void musicAudio.play().catch(() => {});
        isPlaying = true;
      } else {
        musicAudio.pause();
        isPlaying = false;
      }
    } else if (!isPlaying && mp3FilesList.length > 0) {
      // No file loaded yet, load and play the first song
      if (musicAudio && musicSourcePath) {
        const filePath = `${musicSourcePath}/${mp3FilesList[currentTrackIndex]}`;
        // Read file as base64 and create blob URL
        const base64Data = await (window as any).api.readMp3File(filePath);
        if (base64Data) {
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const blobUrl = URL.createObjectURL(blob);
          musicAudio.src = blobUrl;
          void musicAudio.play().catch(() => {});
          isPlaying = true;
        }
      }
    }
    setUpIcon();
  };

  playToggle.addEventListener('pointerdown', (e: PointerEvent) => {
    try { playToggle.setPointerCapture(e.pointerId); } catch {}
    if (!isDown) {
      isDown = true;
      setDownIcon();
      playPressSound();
    }
  });

  // Toggle state only on actual release
  playToggle.addEventListener('pointerup', () => {
    if (!isDown) return;
    isDown = false;
    if (validMusicSource) {
      void handlePlayToggle();
    }
    playReleaseSound();
    setUpIcon();
  });

  // Cancel/leave/blur should just revert visual without toggling
  const cancelVisual = () => {
    if (!isDown) return;
    isDown = false;
    setUpIcon();
  };
  playToggle.addEventListener('pointercancel', cancelVisual);
  playToggle.addEventListener('pointerleave', cancelVisual);
  playToggle.addEventListener('blur', cancelVisual);

  // Keyboard support
  playToggle.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter') {
      if (!isDown) {
        isDown = true;
        setDownIcon();
        playPressSound();
      }
    }
  });
  playToggle.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter') {
      if (!isDown) return;
      isDown = false;
      if (validMusicSource) {
        void handlePlayToggle();
      }
      playReleaseSound();
      setUpIcon();
    }
  });
}

// Reusable helper for momentary-press behavior
const wireMomentaryButton = (
  btn: HTMLButtonElement | null,
  img: HTMLImageElement | null,
  upSrc: string,
  downSrc: string,
  requiresValidSource: boolean = false,
) => {
  if (!btn || !img) return;
  const setPressed = (pressed: boolean) => {
    img.src = pressed ? downSrc : upSrc;
  };
  let isDown = false;
  btn.addEventListener('pointerdown', (e: PointerEvent) => {
    if (requiresValidSource && !validMusicSource) return;
    try { btn.setPointerCapture(e.pointerId); } catch {}
    if (!isDown) {
      isDown = true;
      setPressed(true);
      playPressSound();
    }
  });
  const release = () => {
    if (isDown) {
      isDown = false;
      setPressed(false);
      playReleaseSound();
    }
  };
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('blur', release);
  btn.addEventListener('keydown', (e: KeyboardEvent) => {
    if (requiresValidSource && !validMusicSource) return;
    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter') {
      if (!isDown) {
        isDown = true;
        setPressed(true);
        playPressSound();
      }
    }
  });
  btn.addEventListener('keyup', (e: KeyboardEvent) => {
    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter') {
      release();
    }
  });
};

wireMomentaryButton(rewindBtn, rewindIcon, rewindSvg, rewindPressedSvg);
wireMomentaryButton(forwardBtn, forwardIcon, forwardSvg, forwardPressedSvg);

// Rewind button functionality
let rewindClickCount = 0;
let rewindClickTimeout: ReturnType<typeof setTimeout> | null = null;

const handleRewindClick = async () => {
  if (!validMusicSource || !musicAudio || !musicSourcePath) return;

  // Check if music is currently playing
  const wasPlaying = isPlaying;

  rewindClickCount++;

  if (rewindClickCount === 1) {
    // Single click - check if song is less than 1 second in
    rewindClickTimeout = setTimeout(async () => {
      if (rewindClickCount === 1) {
        if (musicAudio && musicAudio.currentTime < 1) {
          // Less than 1 second into the song - go back a song
          if (currentTrackIndex > 0) {
            currentTrackIndex--;
            updateFileListHighlight();
            const filePath = `${musicSourcePath}/${mp3FilesList[currentTrackIndex]}`;

            // Read file as base64 and create blob URL
            const base64Data = await (window as any).api.readMp3File(filePath);
            if (base64Data) {
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'audio/mpeg' });
              const blobUrl = URL.createObjectURL(blob);
              musicAudio.src = blobUrl;
              // Only auto-play if music was already playing
              if (wasPlaying) {
                void musicAudio.play().catch(() => {});
                isPlaying = true;
              }
              setUpIcon();
            }
          } else {
          }
        } else {
          // More than 1 second in - restart current song
          if (musicAudio) {
            musicAudio.currentTime = 0;
          }
        }
      }
      rewindClickCount = 0;
    }, 300);
  } else if (rewindClickCount === 2) {
    // Double click - go to previous song
    if (rewindClickTimeout) clearTimeout(rewindClickTimeout);
    rewindClickCount = 0;

    if (currentTrackIndex > 0) {
      currentTrackIndex--;
      updateFileListHighlight();
      const filePath = `${musicSourcePath}/${mp3FilesList[currentTrackIndex]}`;

      // Read file as base64 and create blob URL
      const base64Data = await (window as any).api.readMp3File(filePath);
      if (base64Data) {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        musicAudio.src = blobUrl;
        // Only auto-play if music was already playing
        if (wasPlaying) {
          void musicAudio.play().catch(() => {});
          isPlaying = true;
        }
        setUpIcon();
      }
    } else {
    }
  }
};

if (rewindBtn) {
  rewindBtn.addEventListener('pointerup', () => {
    // Only trigger on valid music source
    if (validMusicSource) {
      void handleRewindClick();
    }
  });
}

// Forward button functionality
const handleForwardClick = async () => {
  if (!validMusicSource || !musicAudio || !musicSourcePath) return;

  // Check if music is currently playing
  const wasPlaying = isPlaying;

  if (currentTrackIndex < mp3FilesList.length - 1) {
    // Skip to next song
    currentTrackIndex++;
    updateFileListHighlight();
    const filePath = `${musicSourcePath}/${mp3FilesList[currentTrackIndex]}`;

    // Read file as base64 and create blob URL
    const base64Data = await (window as any).api.readMp3File(filePath);
    if (base64Data) {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      musicAudio.src = blobUrl;
      // Only auto-play if music was already playing
      if (wasPlaying) {
        void musicAudio.play().catch(() => {});
        isPlaying = true;
      }
      setUpIcon();
    }
  } else {
    // At last track, loop back to first song
    currentTrackIndex = 0;
    updateFileListHighlight();
    const filePath = `${musicSourcePath}/${mp3FilesList[currentTrackIndex]}`;

    // Read file as base64 and create blob URL
    const base64Data = await (window as any).api.readMp3File(filePath);
    if (base64Data) {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      musicAudio.src = blobUrl;
      // If music was playing, keep it paused when looping
      if (wasPlaying) {
        musicAudio.pause();
      }
      isPlaying = false;
      setUpIcon();
    }
  }
};

if (forwardBtn) {
  forwardBtn.addEventListener('pointerup', () => {
    // Only trigger on valid music source
    if (validMusicSource) {
      void handleForwardClick();
    }
  });
}

// Setup Source Button
const sourceIcon = document.getElementById('source-icon') as HTMLImageElement | null;
const sourceBtn = document.getElementById('source-button') as HTMLButtonElement | null;
const sourceText = document.getElementById('source-text') as HTMLSpanElement | null;

if (sourceIcon) {
  sourceIcon.src = sourceButtonSvg;
}

// Load saved source directory from localStorage
const savedSource = localStorage.getItem('musicSource');
if (savedSource && sourceText) {
  sourceText.textContent = `/${savedSource.split('/').pop()}`;
}

// Helper function to load and display MP3 files
const loadMp3Files = async (dirPath: string) => {
  const fileList = document.getElementById('file-list') as HTMLDivElement | null;
  if (!fileList) {
    return;
  }

  try {
    const mp3Files = await (window as any).api.findMp3Files(dirPath);
    
    // Update global state
    musicSourcePath = dirPath;
    mp3FilesList = mp3Files;
    currentTrackIndex = 0;
    validMusicSource = mp3Files.length > 0;
    
    fileList.innerHTML = '';
    
    if (mp3Files.length === 0) {
      // No valid music source
      validMusicSource = false;
      const emptyItem = document.createElement('div');
      emptyItem.className = 'file-item';
      emptyItem.textContent = 'No MP3 files found';
      emptyItem.style.color = '#999';
      fileList.appendChild(emptyItem);
    } else {
      // Valid music source - controls are now functional
      validMusicSource = true;
      
      // Automatically select and prepare the first song
      currentTrackIndex = 0;
      initAudioPlayer();
      if (musicAudio && musicSourcePath) {
        const filePath = `${musicSourcePath}/${mp3FilesList[currentTrackIndex]}`;
        // Read file as base64 and create blob URL
        (async () => {
          const base64Data = await (window as any).api.readMp3File(filePath);
          if (base64Data && musicAudio) {
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const blobUrl = URL.createObjectURL(blob);
            musicAudio.src = blobUrl;
          }
        })();
      }
      
      mp3Files.forEach((fileName: string, index: number) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = `file-item-${index}`;
        // Remove .mp3 extension from display
        fileItem.textContent = fileName.replace(/\.mp3$/i, '');
        // Set current track as active
        if (index === currentTrackIndex) {
          fileItem.classList.add('active');
        }
        fileList.appendChild(fileItem);
      });
    }
  } catch (error) {
    validMusicSource = false;
  }
};

// Store reference to handle directory selection
let isSourceButtonPressed = false;

// Enhanced source button handler
if (sourceBtn) {
  sourceBtn.addEventListener('pointerup', async () => {
    if (isSourceButtonPressed) {
      isSourceButtonPressed = false;
      // Access the API exposed in preload.ts
      const selectedDir = await (window as any).api.selectDirectory();
      if (selectedDir && sourceText) {
        // Save to localStorage
        localStorage.setItem('musicSource', selectedDir);
        // Display just the directory name with leading slash
        sourceText.textContent = `/${selectedDir.split('/').pop()}`;
        // Load and display MP3 files
        await loadMp3Files(selectedDir);
      }
    }
  });

  sourceBtn.addEventListener('pointerdown', () => {
    isSourceButtonPressed = true;
  });
}

// Load MP3 files on app startup if a source is already set
if (savedSource) {
  loadMp3Files(savedSource);
}

wireMomentaryButton(sourceBtn, sourceIcon, sourceButtonSvg, sourceButtonPressedSvg);

// Volume Slider Setup
const volumeTrack = document.getElementById('volume-track') as HTMLImageElement | null;
const volumeThumb = document.getElementById('volume-thumb') as HTMLImageElement | null;
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement | null;

if (volumeTrack) {
  volumeTrack.src = volumeTrackSvg;
}
if (volumeThumb) {
  volumeThumb.src = volumeThumbSvg;
}

// Update thumb position based on slider value
const updateVolumeThumbPosition = () => {
  if (!volumeSlider || !volumeThumb) return;
  
  const value = parseInt(volumeSlider.value);
  const percentage = value / 100;
  
  // Calculate thumb position (accounting for thumb width and edge padding)
  const sliderWidth = volumeSlider.offsetWidth;
  const thumbWidth = 24;
  const edgePadding = 4; // Pixels of padding from each edge
  const availableWidth = sliderWidth - thumbWidth - (edgePadding * 2);
  const thumbPosition = (availableWidth * percentage) + (thumbWidth / 2) + edgePadding;
  
  volumeThumb.style.left = `${thumbPosition}px`;
};

// Set initial thumb position
if (volumeSlider) {
  // Load saved volume from localStorage
  const savedVolume = localStorage.getItem('musicVolume');
  if (savedVolume) {
    volumeSlider.value = savedVolume;
  }
  
  updateVolumeThumbPosition();
  
  // Update music volume when slider changes
  volumeSlider.addEventListener('input', () => {
    updateVolumeThumbPosition();
    
    const volume = parseInt(volumeSlider.value) / 100;
    
    // Only affect music audio, not button sounds
    if (musicAudio) {
      musicAudio.volume = volume;
    }
    
    // Save volume preference
    localStorage.setItem('musicVolume', volumeSlider.value);
  });
  
  // Update thumb position on window resize
  window.addEventListener('resize', updateVolumeThumbPosition);
}
