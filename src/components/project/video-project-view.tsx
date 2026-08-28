import type { MediaItem } from "@/types/projects";
import { VideoProjectStage } from "@/src/components/project/video-project-stage";

type VideoProjectViewProps = {
  title: string;
  summary: string;
  media: MediaItem[];
  cover: MediaItem;
};

export function VideoProjectView({
  title,
  summary,
  media,
  cover,
}: VideoProjectViewProps) {
  const video = media.find((item) => item.type === "video");
  const poster = video?.posterSrc ?? cover.src;
  const description = video?.caption?.trim() || summary.trim();

  return (
    <div className="video-project relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-black">
      <div className="video-project-stage grid min-h-0 flex-1 place-items-center">
        <div className="video-project-frame relative h-full w-full overflow-hidden bg-black">
          <VideoProjectStage
            title={title}
            description={description}
            alt={video?.alt ?? cover.alt}
            muxPlaybackId={video?.muxPlaybackId}
            src={video?.src || undefined}
            poster={poster || undefined}
          />
        </div>
      </div>
    </div>
  );
}
