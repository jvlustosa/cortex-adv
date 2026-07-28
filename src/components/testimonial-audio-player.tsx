"use client";

import Image from "next/image";
import { ExternalLink, Pause, Play, Volume2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import styles from "./testimonial-audio-player.module.css";

const BAR_COUNT = 80;

export type TestimonialSpeaker = {
  name: string;
  photo: string;
  photoAlt: string;
  credential?: string;
  officeName: string;
  officeUrl: string;
};

type TestimonialAudioPlayerProps = {
  src: string;
  title: string;
  subtitle?: string;
  speaker: TestimonialSpeaker;
};

function formatOfficeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function fallbackBars(): number[] {
  return Array.from({ length: BAR_COUNT }, (_, index) => {
    const wave =
      Math.abs(Math.sin(index * 0.62) * Math.cos(index * 0.28)) * 0.72;
    const envelope = 0.35 + Math.sin((index / BAR_COUNT) * Math.PI) * 0.25;
    return Math.max(0.14, Math.min(1, wave + envelope));
  });
}

async function extractWaveform(src: string, bars: number): Promise<number[]> {
  const response = await fetch(src);
  const arrayBuffer = await response.arrayBuffer();
  const context = new AudioContext();
  const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
  await context.close();

  const channel = audioBuffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / bars));
  const peaks: number[] = [];

  for (let index = 0; index < bars; index += 1) {
    const start = index * blockSize;
    let max = 0;

    for (let offset = 0; offset < blockSize; offset += 1) {
      const value = Math.abs(channel[start + offset] ?? 0);
      if (value > max) max = value;
    }

    peaks.push(max);
  }

  const peakMax = Math.max(...peaks, 0.001);
  return peaks.map((peak) => Math.max(0.12, peak / peakMax));
}

export function TestimonialAudioPlayer({
  src,
  title,
  subtitle,
  speaker,
}: TestimonialAudioPlayerProps) {
  const officeHost = formatOfficeHost(speaker.officeUrl);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(() => fallbackBars());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    extractWaveform(src, BAR_COUNT)
      .then((peaks) => {
        if (!cancelled) setWaveform(peaks);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play();
      setPlaying(true);
      return;
    }

    audio.pause();
    setPlaying(false);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    setCurrentTime(audio.currentTime);
    setProgress(audio.currentTime / audio.duration);
  }, []);

  const handleLoaded = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.duration) return;

    setDuration(audio.duration);
    setReady(true);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );

    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
    setCurrentTime(audio.currentTime);
  }, []);

  const handleWaveformKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      toggle();
    },
    [toggle],
  );

  return (
    <article className={styles.player} aria-label={title}>
      <div className={styles.glow} aria-hidden />

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
      />

      <div className={styles.header}>
        <span className={styles.badge}>
          <Volume2 size={14} aria-hidden />
          Depoimento em áudio
        </span>

        <div className={styles.speakerCard}>
          <div className={styles.speakerPhotoWrap}>
            <Image
              src={speaker.photo}
              alt={speaker.photoAlt}
              width={88}
              height={88}
              className={styles.speakerPhoto}
            />
          </div>

          <div className={styles.speakerInfo}>
            <p className={styles.speakerName}>{speaker.name}</p>
            {speaker.credential ? (
              <p className={styles.speakerCredential}>{speaker.credential}</p>
            ) : null}
            <a
              href={speaker.officeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.speakerOfficeLink}
            >
              <span className={styles.speakerOfficeName}>{speaker.officeName}</span>
              <ExternalLink size={14} aria-hidden className={styles.speakerOfficeIcon} />
              <span className={styles.speakerOfficeHost}>{officeHost}</span>
            </a>
          </div>
        </div>

        <h3 className={styles.title}>{title}</h3>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={toggle}
          aria-label={playing ? "Pausar depoimento" : "Ouvir depoimento"}
        >
          {playing ? (
            <Pause size={24} fill="currentColor" aria-hidden />
          ) : (
            <Play
              size={24}
              fill="currentColor"
              className={styles.playIcon}
              aria-hidden
            />
          )}
        </button>

        <div className={styles.waveWrap}>
          <div
            className={styles.waveform}
            role="slider"
            aria-label="Progresso do áudio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            tabIndex={0}
            onClick={seek}
            onKeyDown={handleWaveformKeyDown}
          >
            {waveform.map((height, index) => {
              const played = index / waveform.length <= progress;

              return (
                <span
                  key={index}
                  className={`${styles.bar} ${played ? styles.barPlayed : ""} ${
                    playing ? styles.barActive : ""
                  }`}
                  style={{ height: `${height * 100}%` }}
                  aria-hidden
                />
              );
            })}
          </div>

          <div className={styles.timeRow}>
            <span>{formatTime(currentTime)}</span>
            <span>{ready ? formatTime(duration) : "—"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
