import Image from "next/image";
import { ProjectMuxVideo } from "@/src/components/media/project-mux-video";
import type { MediaItem } from "@/types/projects";

type VideoProjectViewProps = {
  title: string;
  media: MediaItem[];
  cover: MediaItem;
};

export function VideoProjectView({
  title,
  media,
  cover,
}: VideoProjectViewProps) {
  const video = media.find((item) => item.type === "video");
  const poster = video?.posterSrc ?? cover.src;
  const muxPlaybackId = video?.muxPlaybackId;
  const src = video?.src;

  return (
    <div className="video-project relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-black">
      <div className="video-project-stage grid min-h-0 flex-1 place-items-center">
        <div className="video-project-frame relative h-full w-full overflow-hidden bg-black">
          <div className="video-project-media">
            {muxPlaybackId ? (
              <ProjectMuxVideo
                playbackId={muxPlaybackId}
                title={video?.alt ?? title}
                posterSrc={poster || undefined}
                variant="page"
                active
              />
            ) : src ? (
              <video
                className="size-full object-contain"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={poster}
                aria-label={video?.alt ?? title}
              >
                <source src={src} />
              </video>
            ) : poster ? (
              <Image
                src={poster}
                alt={video?.alt ?? cover.alt}
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
        </div>
      </div>
    </div>
  );
}
