import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageBtn } from "./PageBtn";

export function PaginationComponent({
  page,
  totalPages,
  goTo,
}: {
  page: number;
  totalPages: number;
  goTo: (p: number) => void;
}) {
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages, start + 2);
    const adjustedStart = Math.max(1, end - 2);

    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  };

  return (
    <div className="border-t border-[#E6E6E6] bg-white px-3 py-3">
      <div className="relative flex items-center justify-center">
        <div className="inline-flex items-center gap-1 px-2 py-1">
          <PageBtn
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            variant="arrow"
            aria-label="Pagina anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </PageBtn>

          {getVisiblePages().map((p) => (
            <PageBtn key={p} onClick={() => goTo(p)} active={p === page}>
              {p}
            </PageBtn>
          ))}

          <PageBtn
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            variant="arrow"
            aria-label="Pagina siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </PageBtn>
        </div>
        <span className="absolute right-0 text-xs text-gray-500">
          Pagina {page} de {totalPages}
        </span>
      </div>
    </div>
  );
}
