"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import Colors from "@/shared/theme/colors";
import { EditRoleData, PermissionGroup, Role } from "../../types/typeRoles";
import { showWarning } from "@/shared/utils/notifications";

import {
  ALL_MODULE_PERMISSIONS,
  MODULE_BACK_TO_UI,
  privilegeNameToUiActions,
} from "../../constants/roleMatrix.constants";

const permissionGroups: PermissionGroup[] = Object.entries(ALL_MODULE_PERMISSIONS).map(
  ([title, permissions]) => ({ title, permissions })
);

interface EditRoleModalProps {
  isOpen: boolean;
  role: EditRoleData | null;
  onClose: () => void;
  onSave: (id: number, data: EditRoleData) => void | Promise<void>;
  existingRoles: Role[];
  loading?: boolean;
}

export default function EditRoleModal({
  isOpen,
  role,
  onClose,
  onSave,
  existingRoles,
  loading = false,
}: EditRoleModalProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"Activo" | "Inactivo">("Activo");
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [errors, setErrors] = useState<{ name?: string; permissions?: string }>({});

  useEffect(() => {
    if (!role) return;

    setName(role.name);
    setStatus((role.state ?? "Activo") as "Activo" | "Inactivo");

    const normalized = (role.permissions ?? []).flatMap((token) => {
      const idx = token.lastIndexOf("-");
      if (idx === -1) return [token];

      const rawModule = token.slice(0, idx).trim();
      const rawPrivName = token.slice(idx + 1).trim();

      const modUI =
        MODULE_BACK_TO_UI[rawModule] ??
        MODULE_BACK_TO_UI[rawModule.toLowerCase()] ??
        (rawModule as any);

      const actions = privilegeNameToUiActions(modUI as any, rawPrivName);

      return actions.map((a) => `${modUI}-${a}`);
    });

    const mapped: Record<string, string[]> = {};
    permissionGroups.forEach((group) => {
      mapped[group.title] = group.permissions.filter((perm) =>
        normalized.includes(`${group.title}-${perm}`)
      );
    });

    setPermissions(mapped);
    setErrors({});
  }, [role]);

  if (!isOpen || !role) return null;

  const validateForm = (nameVal?: string, permsVal?: Record<string, string[]>) => {
    const newErrors: { name?: string; permissions?: string } = {};
    const nameToCheck = (nameVal ?? name).trim();
    const permsToCheck = permsVal ?? permissions;

    if (!nameToCheck) {
      newErrors.name = "El nombre del rol es obligatorio";
    } else {
      const isDuplicate = existingRoles.some(
        (r) => r.name.toLowerCase() === nameToCheck.toLowerCase() && r.id !== role.id
      );
      if (isDuplicate) newErrors.name = "Ya existe un rol con ese nombre";
    }

    const selectedCount = Object.values(permsToCheck).reduce((acc, arr) => acc + arr.length, 0);
    if (selectedCount === 0) newErrors.permissions = "Debe asignar al menos un permiso al rol";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTogglePermission = (module: string, permission: string) => {
    if (loading) return;

    setPermissions((prev) => {
      const current = prev[module] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      const newPermissions = { ...prev, [module]: updated };
      validateForm(undefined, newPermissions);
      return newPermissions;
    });
  };

  const handleToggleModuleAll = (module: string) => {
    if (module === "Dashboard" || loading) return;

    setPermissions((prev) => {
      const current = prev[module] || [];
      const total = permissionGroups.find((g) => g.title === module)?.permissions.length ?? 0;
      const allSelected = current.length === total;
      const updated = allSelected
        ? []
        : [...(permissionGroups.find((g) => g.title === module)?.permissions || [])];
      const newPermissions = { ...prev, [module]: updated };
      validateForm(undefined, newPermissions);
      return newPermissions;
    });
  };

  const handleSubmit = async () => {
    const formattedPermissions: string[] = [];
    Object.entries(permissions).forEach(([module, perms]) =>
      perms.forEach((perm) => formattedPermissions.push(`${module}-${perm}`))
    );

    if (!validateForm(name, permissions)) {
      showWarning("Por favor completa los campos obligatorios correctamente");
      return;
    }

    await onSave(role.id, {
      id: role.id,
      name: name.trim(),
      state: status,
      permissions: formattedPermissions,
    });
  };

  const Checkbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border border-gray-400 flex items-center justify-center transition-all duration-150 
        ${checked ? "bg-[#B20000] scale-110" : "bg-white"} ${loading ? "opacity-60" : ""}`}
      aria-pressed={checked}
      disabled={loading}
    >
      <CheckIcon
        className={`w-3 h-3 text-white transition-opacity duration-150 ${
          checked ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
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
              <h2 className="text-lg font-semibold">Editar Rol</h2>
              <button
                onClick={loading ? undefined : onClose}
                className="cursor-pointer text-gray-500 hover:text-black disabled:opacity-60"
                aria-label="Cerrar"
                disabled={loading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold mb-1" style={{ color: Colors.texts.primary }}>
                    Nombre del rol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    disabled={loading}
                    onChange={(e) => {
                      setName(e.target.value);
                      validateForm(e.target.value, permissions);
                    }}
                    placeholder="Ingrese nombre de rol"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
                    style={{ borderColor: errors.name ? "red" : Colors.table.lines }}
                  />
                  {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                </div>

                <div>
                  <label className="block text-base font-semibold mb-1" style={{ color: Colors.texts.primary }}>
                    Estado
                  </label>
                  <select
                    value={status}
                    disabled={loading}
                    onChange={(e) => setStatus(e.target.value as "Activo" | "Inactivo")}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
                    style={{ borderColor: Colors.table.lines }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold" style={{ color: Colors.texts.primary }}>
                  Permisos Asignados <span className="text-red-500">*</span>
                </h3>
              </div>

              {errors.permissions && (
                <p className="text-left text-xs text-red-500">{errors.permissions}</p>
              )}

              <div className="overflow-hidden rounded-xl border max-h-64 overflow-y-auto custom-scroll">
                <table className="min-w-full text-sm">
                  <thead style={{ backgroundColor: "#B20000" }} className="sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-white">Módulo</th>
                      <th className="px-4 py-3 text-center font-semibold text-white">
                        Permisos / Privilegios
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {permissionGroups.map((group) => {
                      const allSelected =
                        (permissions[group.title]?.length ?? 0) === group.permissions.length;

                      return (
                        <tr key={group.title}>
                          <td className="px-4 py-3 font-medium text-gray-800">{group.title}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap justify-center gap-4">
                              {group.title !== "Dashboard" && (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={allSelected}
                                    onChange={() => handleToggleModuleAll(group.title)}
                                  />
                                  <span className="text-sm">Todos</span>
                                </div>
                              )}

                              {group.permissions.map((perm) => {
                                const isChecked = permissions[group.title]?.includes(perm);
                                return (
                                  <div key={`${group.title}-${perm}`} className="flex items-center gap-2">
                                    <Checkbox
                                      checked={isChecked || false}
                                      onChange={() => handleTogglePermission(group.title, perm)}
                                    />
                                    <span className="text-sm">{perm}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t flex justify-end gap-2 sm:gap-3 p-4 sticky bottom-0 bg-white z-10 rounded-b-3xl">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="cursor-pointer transition duration-300 hover:bg-gray-200 hover:text-black hover:scale-105 px-4 py-2 rounded-lg bg-gray-300 text-black w-full sm:w-auto disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}