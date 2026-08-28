import Link from "next/link";
import { SloganTextFlow } from "@/src/components/about/slogan-text-flow";

type WhyPageViewProps = {
  text: string;
  repeat: number;
};

const WHY_STACK_CLASS =
  "pointer-events-none absolute left-1/2 top-1/2 w-max max-w-[calc(100vw-5.5rem)] -translate-x-1/2 -translate-y-1/2";

export function WhyPageView({ text, repeat }: WhyPageViewProps) {
  return (
    <div className="fixed inset-0 z-0 touch-manipulation overflow-hidden bg-background">
      <h1 className="sr-only">{text}</h1>
      <Link
        href="/"
        className="absolute right-[15px] top-[26px] z-40 size-[30px] rounded-full bg-accent transition-opacity hover:opacity-80 lg:right-[23px]"
        aria-label="Back to home"
      />
      <SloganTextFlow
        text={text}
        repeat={repeat}
        stackClassName={WHY_STACK_CLASS}
        align="center"
      />
    </div>
  );
}
