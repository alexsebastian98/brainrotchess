/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SplicedMemeClip, TOP5_SPLICED_CLIPS, YOUTUBE_VIDEO_ID } from './VideoSplicedEngine';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type ClipPlayListener = (clip: SplicedMemeClip) => void;

class VideoAudioSplicerService {
  private player: any = null;
  private isPlayerReady: boolean = false;
  private currentStopTimer: any = null;
  private activeClip: SplicedMemeClip | null = null;
  private listeners: Set<ClipPlayListener> = new Set();
  private isIframeMounted: boolean = false;

  constructor() {
    this.initYouTubeAPI();
  }

  private initYouTubeAPI() {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        this.mountHiddenPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      this.mountHiddenPlayer();
    }
  }

  public mountHiddenPlayer() {
    if (this.isIframeMounted || typeof document === 'undefined') return;

    let container = document.getElementById('yt-splicer-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-splicer-container';
      container.style.position = 'fixed';
      container.style.bottom = '-9999px';
      container.style.right = '-9999px';
      container.style.width = '200px';
      container.style.height = '150px';
      container.style.opacity = '0.01';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '-999';
      document.body.appendChild(container);
    }

    const iframePlaceholder = document.createElement('div');
    iframePlaceholder.id = 'yt-splicer-iframe-host';
    container.appendChild(iframePlaceholder);

    try {
      this.player = new window.YT.Player('yt-splicer-iframe-host', {
        height: '150',
        width: '200',
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.isPlayerReady = true;
            this.isIframeMounted = true;
          },
          onError: (e: any) => {
            console.warn('[VideoAudioSplicer] YouTube API error:', e);
          },
        },
      });
    } catch (e) {
      console.warn('[VideoAudioSplicer] Could not create YT player:', e);
    }
  }

  public onClipPlay(fn: ClipPlayListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public playClip(clip: SplicedMemeClip, volumePercent = 85): boolean {
    this.activeClip = clip;
    this.listeners.forEach((fn) => fn(clip));

    if (this.currentStopTimer) {
      clearTimeout(this.currentStopTimer);
      this.currentStopTimer = null;
    }

    // Only attempt YouTube playback if clip is within the 0-8s window of the video
    // Otherwise procedural Web Audio FX provides the clean zero-latency audio
    if (this.isPlayerReady && this.player && typeof this.player.seekTo === 'function' && clip.startSec <= 7.5) {
      try {
        const targetVol = Math.min(100, Math.max(0, volumePercent));
        // Mute before seeking to prevent 0:00 buffer bleed
        if (typeof this.player.mute === 'function') {
          this.player.mute();
        }
        this.player.seekTo(clip.startSec, true);
        this.player.playVideo();

        // Unmute once playhead is on the requested timestamp (100ms delay)
        setTimeout(() => {
          try {
            if (this.player) {
              if (typeof this.player.unMute === 'function') this.player.unMute();
              if (typeof this.player.setVolume === 'function') this.player.setVolume(targetVol);
            }
          } catch {}
        }, 110);

        this.currentStopTimer = setTimeout(() => {
          try {
            if (this.player && typeof this.player.pauseVideo === 'function') {
              this.player.pauseVideo();
            }
          } catch {}
          this.activeClip = null;
        }, clip.duration * 1000 + 120);

        return true;
      } catch (err) {
        console.warn('[VideoAudioSplicer] Error playing video splice:', err);
      }
    }

    return false;
  }

  public getActiveClip(): SplicedMemeClip | null {
    return this.activeClip;
  }

  public stopAll() {
    if (this.currentStopTimer) {
      clearTimeout(this.currentStopTimer);
      this.currentStopTimer = null;
    }
    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch {}
    }
    this.activeClip = null;
  }
}

export const videoAudioSplicer = new VideoAudioSplicerService();
