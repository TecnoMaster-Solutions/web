"use client";

import React from "react";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import Colors from "@/shared/theme/colors";
import { Role } from "../../types/typeRoles";

import {
  MODULE_BACK_TO_UI,
  privilegeNameToUiActions,
  ALL_MODULE_PERMISSIONS,
  RoleUiModule,
} from "../../constants/roleMatrix.constants";

interface ViewRoleModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}

export default function ViewRoleModal({ open, onClose, role }: ViewRoleModalProps) {
  if (!open || !role) return null;

  const isAdmin = Number((role as any)?.id) === 1; // admin por id=1

  // 1) Parsear tokens "Modulo-Accion" y construir Set por módulo con acciones asignadas
  const assignedByModule = new Map<RoleUiModule, Set<string>>();

  (role.permissions ?? []).forEach((token) => {
    const idx = token.lastIndexOf("-");
    if (idx === -1) return;

    const rawModule = token.slice(0, idx).trim();
    const rawPrivName = token.slice(idx + 1).trim();

    const moduleUi =
      (MODULE_BACK_TO_UI[rawModule] ??
        MODULE_BACK_TO_UI[String(rawModule).toLowerCase()] ??
        rawModule) as RoleUiModule;

    const actions = privilegeNameToUiActions(moduleUi, rawPrivName);

    if (!assignedByModule.has(moduleUi)) assignedByModule.set(moduleUi, new Set());
    const set = assignedByModule.get(moduleUi)!;

    actions.forEach((a) => set.add(a));
  });

  const rows: Array<{ module: RoleUiModule; actions: Array<{ name: string; checked: boolean }> }> =
    [];

  (Object.keys(ALL_MODULE_PERMISSIONS) as RoleUiModule[]).forEach((moduleUi) => {
    const allowed = ALL_MODULE_PERMISSIONS[moduleUi] ?? [];
    const assigned = assignedByModule.get(moduleUi) ?? new Set<string>();

    if (isAdmin) {
      // Admin: lista completa permitida por UI
      const actions = allowed.map((a) => ({
        name: a,
        checked: assigned.has(a),
      }));
      rows.push({ module: moduleUi, actions });
      return;
    }

    // No admin: solo lo asignado (y que esté permitido por constants)
    const onlyAssigned = allowed.filter((a) => assigned.has(a));
    if (onlyAssigned.length === 0) return;

    rows.push({
      module: moduleUi,
      actions: onlyAssigned.map((a) => ({ name: a, checked: true })),
    });
  });

  const Checkbox = ({ checked }: { checked: boolean }) => (
    <div
      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 ${
        checked ? "bg-[#04652c] scale-105" : "bg-white"
      }`}
      style={{ borderColor: Colors.table.lines }}
    >
      {checked && <CheckIcon className="w-3 h-3 text-white" />}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-lg relative w-full max-w-[800px] h-[88vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10 rounded-t-3xl">
              <h2 className="text-lg font-semibold" style={{ color: Colors.texts.primary }}>
                Ver Rol
              </h2>
              <button onClick={onClose} className="cursor-pointer text-gray-500 hover:text-black">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold mb-1" style={{ color: Colors.texts.primary }}>
                    Nombre del rol
                  </label>
                  <input
                    type="text"
                    value={role.name}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    style={{ borderColor: Colors.table.lines }}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1" style={{ color: Colors.texts.primary }}>
                    Estado
                  </label>
                  <input
                    type="text"
                    value={role.state === "Activo" ? "Activo" : "Inactivo"}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    style={{ borderColor: Colors.table.lines }}
                  />
                </div>
              </div>

              <h3 className="text-base font-semibold" style={{ color: Colors.texts.primary }}>
                Permisos Asignados
              </h3>

              <div className="overflow-hidden rounded-xl border max-h-64 overflow-y-auto custom-scroll">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10" style={{ backgroundColor: "#04652c" }}>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-white">Módulo</th>
                      <th className="px-4 py-3 text-center font-semibold text-white">
                        Permisos / Privilegios
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {rows.map((row) => (
                      <tr key={row.module}>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.module}</td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-center gap-4">
                            {row.actions.map((a) => (
                              <div
                                key={`${row.module}-${a.name}`}
                                className="flex items-center gap-2"
                              >
                                <Checkbox checked={a.checked} />
                                <span className="text-sm">{a.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-500" colSpan={2}>
                          Este rol no tiene permisos asignados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t flex justify-end gap-2 sm:gap-3 p-4 sticky bottom-0 bg-white z-10 rounded-b-3xl">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
