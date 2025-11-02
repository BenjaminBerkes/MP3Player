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

if (playToggle && playIcon) {
  let isDown = false;
  let isPlaying = false;

  const setUpIcon = () => {
    playIcon.src = isPlaying ? pauseSvg : playSvg;
  };
  const setDownIcon = () => {
    playIcon.src = isPlaying ? pausePressedSvg : playPressedSvg;
  };

  // Ensure initial state shows Play
  setUpIcon();

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
    isPlaying = !isPlaying;
    setUpIcon();
    playReleaseSound();
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
      isPlaying = !isPlaying;
      setUpIcon();
      playReleaseSound();
    }
  });
}

// Reusable helper for momentary-press behavior
const wireMomentaryButton = (
  btn: HTMLButtonElement | null,
  img: HTMLImageElement | null,
  upSrc: string,
  downSrc: string,
) => {
  if (!btn || !img) return;
  const setPressed = (pressed: boolean) => {
    img.src = pressed ? downSrc : upSrc;
  };
  let isDown = false;
  btn.addEventListener('pointerdown', (e: PointerEvent) => {
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
