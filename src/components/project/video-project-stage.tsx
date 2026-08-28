"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ProjectMuxVideo } from "@/src/components/media/project-mux-video";

type VideoProjectStageProps = {
  title: string;
  description: string;
  alt: string;
  muxPlaybackId?: string;
  src?: string;
  poster?: string;
};

export function VideoProjectStage({
  title,
  description,
  alt,
  muxPlaybackId,
  src,
  poster,
}: VideoProjectStageProps) {
  const nativeRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const hasPlayer = Boolean(muxPlaybackId || src);

  useEffect(() => {
    const node = nativeRef.current;
    if (!node) {
      return;
    }

    node.muted = muted;
    if (paused) {
      node.pause();
      return;
    }

    const attempt = node.play();
    if (attempt) {
      void attempt.catch(() => {
        // Autoplay may be blocked; poster remains.
      });
    }
  }, [muted, paused]);

  function togglePaused() {
    if (!hasPlayer) {
      return;
    }
    setPaused((value) => !value);
  }

  function toggleMuted() {
    setMuted((value) => !value);
  }

  return (
    <>
      <div className="video-project-media">
        {muxPlaybackId ? (
          <ProjectMuxVideo
            playbackId={muxPlaybackId}
            title={alt || title}
            posterSrc={poster || undefined}
            variant="page"
            active
            paused={paused}
            muted={muted}
          />
        ) : src ? (
          <video
            ref={nativeRef}
            className="size-full object-contain"
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="metadata"
            poster={poster}
            aria-label={alt || title}
          >
            <source src={src} />
          </video>
        ) : poster ? (
          <Image
            src={poster}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        ) : (
          <span className="flex size-full items-center justify-center text-sm uppercase text-white/50">
            Video processing
          </span>
        )}
      </div>

      {hasPlayer ? (
        <div className="absolute inset-0 z-10">
          <button
            type="button"
            className="absolute inset-0 cursor-pointer"
            aria-label={paused ? "Play video" : "Pause video"}
            onClick={togglePaused}
          />
          {paused ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/60 px-8 py-16 text-center">
              <button
                type="button"
                className="pointer-events-auto mb-4 text-sm font-bold uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-70 md:text-base"
                onClick={toggleMuted}
              >
                {muted ? "Unmute" : "Mute"}
              </button>
              {description ? (
                <p className="max-h-[40vh] max-w-xl overflow-y-auto text-sm font-medium leading-relaxed text-accent md:text-base lg:text-lg">
                  {description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
