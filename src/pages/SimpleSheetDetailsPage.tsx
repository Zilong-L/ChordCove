import { Link } from "react-router-dom";
import SimpleSheetDisplay from "../components/SimpleEditor/SimpleSheetDisplay";
import ReadOnlyMetadataForm from "../components/basic/sheet/ReadOnlyMetadataForm";
import { PencilIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";
import LikeButton from "@components/basic/sheet/LikeButton";

export default function SheetEditor() {
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] overflow-y-hidden px-2 md:px-8 xl:max-w-[90rem]">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="order-2 flex flex-col lg:order-[-1] lg:w-1/4">
          <ReadOnlyMetadataForm />
        </div>

        <div className="relative flex h-[90vh] flex-col overflow-x-hidden lg:w-3/4">
          <SimpleSheetDisplay />
          <div className="absolute right-8 top-4 flex flex-col gap-2 text-[var(--text-tertiary)]">
            <Link
              to={`/edit/${sheetMetadata.id}`}
              className="rounded-full p-2 transition-colors duration-150 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:bg-gray-700"
            >
              <PencilIcon className="h-6 w-6" />
            </Link>
            {sheetMetadata.id && <LikeButton sheetId={sheetMetadata.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
