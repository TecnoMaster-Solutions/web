"use client";

import React, { useState, useEffect } from "react";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import Colors from "@/shared/theme/colors";
import { showWarning } from "@/shared/utils/notifications";
import { Role } from "../../types/typeRoles";
import { ALL_MODULE_PERMISSIONS } from "../../constants/roleMatrix.constants";

interface CreateRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; permissions: string[] }) => void;
  existingRoles: Role[];
  loading?: boolean;
}

export default function CreateRoleModal({
  open,
  onClose,
  onSubmit,
  existingRoles,
  loading = false,
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [errors, setErrors] = useState<{ name?: string; permissions?: string }>(
    {}
  );

  const allModulePermissions: Record<string, string[]> = ALL_MODULE_PERMISSIONS;

  useEffect(() => {
    if (open) {
      setRoleName("");
      setPermissions({});
      setErrors({});
    }
  }, [open]);

  const togglePermission = (module: string, permission: string) => {
    setPermissions((prev) => {
      const current = prev[module] || [];
      const updated = current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission];
      return { ...prev, [module]: updated };
    });
    setTimeout(validateForm, 0);
  };

  const toggleModuleAll = (module: string) => {
    if (module === "Dashboard") return;
    setPermissions((prev) => {
      const current = prev[module] || [];
      const allSelected = current.length === allModulePermissions[module].length;
      const updated = allSelected ? [] : [...allModulePermissions[module]];
      return { ...prev, [module]: updated };
    });
    setTimeout(validateForm, 0);
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; permissions?: string } = {};
    if (!roleName.trim()) {
      newErrors.name = "El nombre del rol es obligatorio";
    } else if (
      existingRoles.some(
        (r) => r.name.toLowerCase() === roleName.trim().toLowerCase()
      )
    ) {
      newErrors.name = "Ya existe un rol con ese nombre";
    }

    const selectedCount = Object.values(permissions).reduce(
      (acc, arr) => acc + arr.length,
      0
    );
    if (selectedCount === 0) {
      newErrors.permissions = "Debe asignar al menos un permiso";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      showWarning("Por favor completa los campos obligatorios correctamente");
      return;
    }

    const formatted: string[] = [];
    Object.entries(permissions).forEach(([module, perms]) =>
      perms.forEach((perm) => formatted.push(`${module}-${perm}`))
    );

    onSubmit({ name: roleName.trim(), permissions: formatted });
    onClose();
  };

  const Checkbox = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <button
      type="button"
      onClick={onChange}
      className={`w-5 h-5 rounded-md border border-gray-400 flex items-center justify-center transition-all duration-150 
        ${checked ? "bg-[#B20000] scale-110" : "bg-white"}`}
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
              <h2 className="text-lg font-semibold">Crear Rol</h2>
              <button
                onClick={onClose}
                className="cursor-pointer text-gray-500 hover:text-black"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex-1 space-y-6 overflow-hidden">
              <div>
                <label
                  className="block text-base font-semibold mb-1"
                  style={{ color: Colors.texts.primary }}
                >
                  Nombre del rol <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ingrese nombre de rol"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                  style={{
                    borderColor: errors.name ? "red" : Colors.table.lines,
                    color: Colors.texts.primary,
                  }}
                  onBlur={validateForm}
                />
                {errors.name && (
                  <span className="text-xs text-red-500">{errors.name}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3
                  className="text-base font-semibold"
                  style={{ color: Colors.texts.primary }}
                >
                  Asignar permisos y privilegios{" "}
                  <span className="text-red-500">*</span>
                </h3>
              </div>

              {errors.permissions && (
                <p className="text-left text-xs text-red-500">
                  {errors.permissions}
                </p>
              )}

              <div className="overflow-hidden rounded-xl border max-h-64 overflow-y-auto custom-scroll">
                <table className="min-w-full text-sm">
                  <thead
                    className="sticky top-0 z-10"
                    style={{ backgroundColor: "#B20000" }}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-white">
                        Módulo
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-white">
                        Permisos / Privilegios
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(allModulePermissions).map(
                      ([module, perms]) => {
                        const moduleAllSelected =
                          (permissions[module]?.length ?? 0) === perms.length;
                        return (
                          <tr key={module}>
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {module}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap justify-center gap-4">
                                {module !== "Dashboard" && (
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={moduleAllSelected}
                                      onChange={() => toggleModuleAll(module)}
                                    />
                                    <span className="text-sm">Todos</span>
                                  </div>
                                )}
                                {perms.map((perm) => {
                                  const isChecked =
                                    permissions[module]?.includes(perm);
                                  return (
                                    <div
                                      key={`${module}-${perm}`}
                                      className="flex items-center gap-2"
                                    >
                                      <Checkbox
                                        checked={!!isChecked}
                                        onChange={() =>
                                          togglePermission(module, perm)
                                        }
                                      />
                                      <span className="text-sm">{perm}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      }
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
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="cursor-pointer transition duration-300 hover:bg-black hover:text-white hover:scale-105 px-4 py-2 rounded-lg bg-black text-white w-full sm:w-auto disabled:opacity-60"
                disabled={loading}
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