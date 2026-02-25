import { useState } from "react";
import { Column } from "../../types/column.types";
import { motion } from "framer-motion";
import { ChevronDownIcon } from "../../icons/ChevronDownIcon";
import { ActionButtons } from "../../DataTable";

// Componente de tarjeta para mobile
export function MobileCardComponent<T>({
  row,
  columns,
  onView,
  onEdit,
  onDelete,
  onCancel,
  onCheck,
  actionGuard,
  renderActions,
  renderExtraActions,
  renderTail,
  tailHeader,
}: {
  row: T;
  columns: Column<T>[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onCancel?: (row: T) => void;
  onCheck?: (row: T) => void;
  actionGuard?: (
    row: T,
  ) => {
    disableEdit?: boolean;
    disableDelete?: boolean;
    editTitle?: string;
    deleteTitle?: string;
  };
  renderActions?: (row: T) => React.ReactNode;
  renderExtraActions?: (row: T) => React.ReactNode;
  renderTail?: (row: T) => React.ReactNode;
  tailHeader?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const priorityColumns = columns.filter(
    (c) => c.priority === "high" || !c.priority
  );
  const otherColumns = columns.filter(
    (c) => c.priority === "medium" || c.priority === "low"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
    >
      {/* Información principal */}
      <div className="space-y-2">
        {priorityColumns.slice(0, 3).map((column) => (
          <div
            key={String(column.key)}
            className="flex justify-between items-start"
          >
            <span className="text-xs text-gray-500 font-medium min-w-0 mr-2">
              {column.header}:
            </span>
            <span className="text-sm text-gray-900 text-right break-words">
              {column.render ? column.render(row) : String(row[column.key])}
            </span>
          </div>
        ))}
      </div>

      {/* Información expandible */}
      {otherColumns.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {expanded ? "Ver menos" : "Ver más"}
            <ChevronDownIcon
              className={`h-3 w-3 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 space-y-2 border-t border-gray-100 pt-2"
            >
              {otherColumns.map((column) => (
                <div
                  key={String(column.key)}
                  className="flex justify-between items-start"
                >
                  <span className="text-xs text-gray-500 font-medium min-w-0 mr-2">
                    {column.header}:
                  </span>
                  <span className="text-sm text-gray-900 text-right break-words">
                    {column.render
                      ? column.render(row)
                      : String(row[column.key])}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Acciones */}
      {(onView || onEdit || onDelete || onCancel || renderActions) && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div className="flex-1">
            {renderTail && (
              <div className="text-xs text-gray-500">
                {tailHeader ?? "Imprimir"}: {renderTail(row)}
              </div>
            )}
          </div>
          <div>
            {renderActions ? (
              renderActions(row)
            ) : (
              <ActionButtons
                row={row}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onCancel={onCancel}
                onCheck={onCheck}
                actionGuard={actionGuard}
                renderExtraActions={renderExtraActions}
                compact={true}
              />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
