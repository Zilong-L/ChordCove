import { Link } from "react-router-dom";
import SimpleSheetDisplay from "../components/SimpleEditor/SimpleSheetDisplay";
import ReadOnlyMetadataForm from "../components/basic/ReadOnlyMetadataForm";
import { PencilIcon } from "@heroicons/react/20/solid";



export default function SheetEditor() {

    return (
        <div className="h-[calc(100vh-4rem)] overflow-ys-scroll overflow-x-hidden xl:max-w-[90rem] mx-auto px-2 md:px-8 ">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="order-2 lg:order-[-1] lg:w-1/4 flex flex-col ">
                    <ReadOnlyMetadataForm />

                </div>

                <div className="lg:w-3/4 flex flex-col relative  h-[90vh]">
                    <SimpleSheetDisplay />
                    <Link to="/edit" className="absolute right-8 top-4 text-gray-600 hover:text-gray-200">
                        <PencilIcon className="w-6 h-6" />
                    </Link>
                </div>
            </div>
        </div>
    );
}