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
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="text-center border-t border-[#E6E6E6] bg-white px-2 sm:px-3 py-2">
      <div className="relative flex items-center justify-center">
        {/* Info en mobile (izquierda) */}
        <div className="absolute left-2 text-xs text-gray-500 sm:hidden">
          {page} de {totalPages}
        </div>

        {/* Controles de paginación */}
        <div className="flex items-center gap-1">
          <PageBtn
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            className="sm:inline-flex hidden"
          >
            {"<"}
          </PageBtn>

          {/* En mobile, solo mostrar página actual y botones prev/next */}
          <div className="flex items-center gap-1 sm:hidden">
            <PageBtn onClick={() => goTo(page - 1)} disabled={page === 1}>
              {"‹"}
            </PageBtn>
            <span className="px-2 py-1 text-xs font-medium">{page}</span>
            <PageBtn
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
            >
              {"›"}
            </PageBtn>
          </div>

          {/* En desktop, mostrar paginación completa */}
          <div className="hidden sm:flex items-center gap-1">
            {getVisiblePages().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 py-1 text-xs">
                  ...
                </span>
              ) : (
                <PageBtn
                  key={p}
                  onClick={() => goTo(Number(p))}
                  active={Number(p) === page}
                >
                  {p}
                </PageBtn>
              )
            )}
          </div>

          <PageBtn
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            className="sm:inline-flex hidden"
          >
            {">"}
          </PageBtn>
        </div>

        {/* Info en desktop (derecha) */}
        <div className="absolute right-2 hidden sm:block text-xs text-gray-500">
          Página {page} de {totalPages}
        </div>
      </div>
    </div>
  );
}
