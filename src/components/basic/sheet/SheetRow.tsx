import { useState } from "react";
import { SheetMetaData } from "#types/sheet";
import AlbumCard from "./SheetCard";
import Carousel from "../layout/Carousel";

interface SheetRowProps {
  title: string;
  sheets: SheetMetaData[] | null;
}

export default function SheetRow({ title, sheets }: SheetRowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  function handleScroll(direction: "left" | "right") {
    let nextIndex = currentIndex;
    if (direction === "left") {
      nextIndex -= 3;
    } else {
      nextIndex += 3;
    }
    setCurrentIndex(Math.max(0, Math.min(nextIndex, (sheets?.length || 0) - 1)));
  }

  if (!sheets) {
    return (
      <div className="mb-8">
        <h2 className="mb-6 text-3xl font-bold hover:cursor-pointer hover:underline">{title}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <AlbumCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative -mx-6">
      <h2 className="ml-6 text-3xl font-bold hover:cursor-pointer hover:underline">{title}</h2>
      <Carousel
        currentIndex={currentIndex}
        onScroll={handleScroll}
        showLeftGradient={currentIndex > 0}
        itemWidth={16}
        gapWidth={0}
        itemCounts={sheets.length}
      >
        {sheets.map((sheet) => (
          <AlbumCard key={sheet.id} sheet={sheet} widthClassName="w-[14rem]" />
        ))}
      </Carousel>
    </div>
  );
}
