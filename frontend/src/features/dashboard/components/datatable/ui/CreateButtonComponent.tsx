import Colors from "@/shared/theme/colors";
import { PlusIcon } from "../icons/PlusIcon";

export function CreateButtonComponent({
  onCreate,
  createButtonText,
}: {
  onCreate: () => void;
  createButtonText?: string;
}) {
  return (
    <button
      onClick={onCreate}
      style={{ background: Colors.buttons.primary }}
      className="relative cursor-pointer inline-flex h-9 transition-transform duration-200 hover:scale-105 items-center gap-2 rounded-md px-4 text-sm font-semibold text-white overflow-hidden group"
    >
      <span className="absolute inset-0 bg-red-800 scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
      <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
        <PlusIcon className="h-4 w-4" />
        {createButtonText || "Crear"}
      </span>
    </button>
  );
}
