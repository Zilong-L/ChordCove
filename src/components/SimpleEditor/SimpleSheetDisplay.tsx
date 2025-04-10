import { useSelector } from "react-redux";
import { RootState } from "@stores/store";
import SheetLineDisplay from "./SheetLineDisplay";

export default function SheetDisplay() {
  const simpleScore = useSelector((state: RootState) => state.simpleScore);
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);

  const lines = simpleScore.content?.split("\n");

  return (
    <div className="min-h-[80%] overflow-scroll overflow-x-hidden rounded-md bg-gradient-to-b from-[var(--gradient-start)] to-[var(--gradient-end)] px-8 py-12 xl:px-24">
      <h2 className="mb-2 min-h-16 text-center text-3xl font-bold text-[var(--text-primary)]">
        {sheetMetadata.title}
      </h2>
      <div className="mb-6 flex items-center justify-between text-[var(--text-primary)]">
        <div className="text-lg">
          <div className="grid grid-flow-row grid-cols-[80px_50px]">
            <p>Key:</p>
            <p className="px-2">{simpleScore.key}</p>
          </div>
          <div className="grid grid-flow-row grid-cols-[80px_50px]">
            <p>Tempo:</p>
            <p className="px-2">{simpleScore.tempo}</p>{" "}
          </div>
        </div>
        <div className="grid grid-cols-[100px_100px] text-left">
          <p>Singer:</p>
          <p>
            {" "}
            {sheetMetadata.singers?.map((singer) => singer.name).join(", ") || "Unknown Singer"}
          </p>
          <p>Upload:</p>
          <p> {sheetMetadata.uploader}</p>
          <p>Composer:</p>
          <p>
            {" "}
            {sheetMetadata.composers?.map((composer) => composer.name).join(", ") ||
              "Unknown Composer"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 content-start gap-2 md:grid-cols-4">
        {lines.map((line, idx) => (
          <SheetLineDisplay key={idx} text={line} />
        ))}
      </div>
    </div>
  );
}
