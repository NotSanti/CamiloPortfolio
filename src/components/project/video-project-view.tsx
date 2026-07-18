import Image from "next/image";
import type { MediaItem } from "@/types/projects";

type VideoProjectViewProps = {
  title: string;
  media: MediaItem[];
  cover: MediaItem;
};

export function VideoProjectView({ title, media, cover }: VideoProjectViewProps) {
  const video = media.find((item) => item.type === "video");
  const poster = video?.posterSrc ?? cover.src;
  const src = video?.src;

  return (
    <div className="relative flex min-h-screen items-start justify-center bg-background px-8 pb-40 pt-[77px]">
      <div className="relative aspect-[1317/781] w-full max-w-[1317px] overflow-hidden bg-media-placeholder">
        {src ? (
          <video
            className="size-full object-cover"
            controls
            playsInline
            poster={poster}
            aria-label={video?.alt ?? title}
          >
            <source src={src} />
          </video>
        ) : (
          <Image
            src={poster}
            alt={video?.alt ?? cover.alt}
            width={video?.width ?? cover.width}
            height={video?.height ?? cover.height}
            className="size-full object-cover"
            priority
          />
        )}
      </div>
    </div>
  );
}
