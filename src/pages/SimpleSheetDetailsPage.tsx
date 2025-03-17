import { Link } from "react-router-dom";
import SimpleSheetDisplay from "../components/SimpleEditor/SimpleSheetDisplay";
import ReadOnlyMetadataForm from "../components/basic/ReadOnlyMetadataForm";
import { PencilIcon } from "@heroicons/react/20/solid";
import { useSelector } from "react-redux";
import { RootState } from "@stores/store";

export default function SheetEditor() {
  const sheetMetadata = useSelector((state: RootState) => state.sheetMetadata);
  return (
    <div className="overflow-ys-scroll mx-auto h-[calc(100vh-4rem)] overflow-x-hidden px-2 md:px-8 xl:max-w-[90rem]">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="order-2 flex flex-col lg:order-[-1] lg:w-1/4">
          <ReadOnlyMetadataForm />
        </div>

        <div className="relative flex h-[90vh] flex-col lg:w-3/4">
          <SimpleSheetDisplay />
          <Link
            to={`/edit/${sheetMetadata.id}`}
            className="absolute right-8 top-4 text-gray-600 hover:text-gray-200"
          >
            <PencilIcon className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
