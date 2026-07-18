import type { TextSegment } from "@/data/about";

type RichTextProps = {
  segments: TextSegment[];
  className?: string;
};

export function RichText({ segments, className = "" }: RichTextProps) {
  return (
    <p className={className}>
      {segments.map((segment, index) =>
        segment.accent ? (
          <span key={index} className="text-accent">
            {segment.text}
          </span>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}
