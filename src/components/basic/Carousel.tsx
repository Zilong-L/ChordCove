import { ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface CarouselProps {
  currentIndex: number;
  onScroll: (direction: "left" | "right") => void;
  children: ReactNode;
  itemWidth: number; // width of each item in rem
  gapWidth?: number; // gap between items in rem
  showLeftGradient?: boolean;
}

export default function Carousel({
  currentIndex,
  onScroll,
  children,
  itemWidth,
  gapWidth = 0,
  showLeftGradient = true,
}: CarouselProps) {
  const totalItemWidth = itemWidth + gapWidth; // Total width including gap

  return (
    <div className="relative">
      {showLeftGradient && (
        <div className="pointer-events-none absolute left-0 z-[99] h-full w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent blur-[1px]" />
      )}
      <div className="pointer-events-none absolute right-0 z-[99] h-full w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent blur-[1px]" />
      <div className="width-[100%] overflow-x-visible">
        <button
          className="absolute left-4 top-1/2 z-[100] flex h-12 w-12 -translate-y-1/2 translate-x-0 items-center justify-center rounded-full bg-transparent opacity-0 transition-all duration-500 ease-in-out group-hover:translate-x-1/3 group-hover:opacity-100"
          disabled={currentIndex === 0}
          onClick={() => onScroll("left")}
        >
          <span className="sr-only">Left</span>
          <ChevronRightIcon className="h-12 w-12 rotate-180" />
        </button>
        <button
          className="absolute right-4 top-1/2 z-[100] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-transparent opacity-0 transition-all duration-500 ease-in-out group-hover:-translate-x-1/3 group-hover:opacity-100"
          onClick={() => onScroll("right")}
        >
          <span className="sr-only">Right</span>
          <ChevronRightIcon className="h-12 w-12" />
        </button>

        <div
          className="width-[99999px] relative flex gap-[1rem] transition-transform duration-300 ease-in-out"
          style={{
            gap: `${gapWidth}rem`,
            transform: `translateX(calc(${currentIndex} * -${totalItemWidth}rem + 1.5rem))`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
