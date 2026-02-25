"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/features/dashboard/components/Modal";
import { useAuth } from "@/features/auth/authcontext";
import { uploadImageToCloudinary } from "@/shared/utils/cloudinary";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/shared/utils/notifications";

type Props = { isOpen: boolean; onClose: () => void };

type TechType = { techniciantypeid: number; name: string };

type FormState = {
  name: string;
  lastname: string;
  email: string;
  phone: string;
  documentnumber: string;
  image: string;
  customercity: string;
  customerzipcode: string;
  CV: string;
  technicianTypeIds: number[];
};

export default function ProfileModal({ isOpen, onClose }: Props) {
  const { user, refreshBasicUserData } = useAuth();
  const userId = user?.userid;

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [techTypesList, setTechTypesList] = useState<TechType[]>([]);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState<string>("");

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string>("");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    documentnumber: "",
    image: "",
    customercity: "",
    customerzipcode: "",
    CV: "",
    technicianTypeIds: [],
  });

  const initials = useMemo(() => {
    const n = form.name.trim();
    return n
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }, [form.name]);

  const displayedAvatar = avatarPreview || form.image;

  const resetLocalFiles = () => {
    setAvatarFile(null);
    setAvatarFileName("");
    setCvFile(null);
    setCvFileName("");
    setUploadingAvatar(false);
    setUploadingCV(false);

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);

    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (cvInputRef.current) cvInputRef.current.value = "";
  };

  async function loadTechnicianTypes() {
    try {
      const res = await api.get("/techniciantypes");
      setTechTypesList(res.data || []);
    } catch {
      setTechTypesList([]);
    }
  }

  async function loadUserData() {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await api.get(`/users/${userId}`);
      const u = res.data.data;

      setRoleName((u.roles?.name || "").toLowerCase());

      setForm({
        name: u.name || "",
        lastname: u.lastname || "",
        email: u.email || "",
        phone: u.phone || "",
        documentnumber: u.documentnumber || "",
        image: u.image || "",
        customercity: u.customers?.[0]?.customercity || "",
        customerzipcode: u.customers?.[0]?.customerzipcode || "",
        CV: u.technicians?.[0]?.CV || "",
        technicianTypeIds:
          u.technicians?.[0]?.technicianTypeMaps?.map(
            (m: any) => m.techniciantypeid
          ) || [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      resetLocalFiles();
      return;
    }
    resetLocalFiles();
    loadUserData();
    loadTechnicianTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setAvatarFile(f);
    setAvatarFileName(f.name);

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleCV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roleName !== "tecnico") return;

    const f = e.target.files?.[0];
    if (!f) return;

    setCvFile(f);
    setCvFileName(f.name);
  };

  const toggleTechType = (id: number) => {
    if (roleName !== "tecnico") return;
    setForm((prev) => {
      const selected = prev.technicianTypeIds.includes(id)
        ? prev.technicianTypeIds.filter((t) => t !== id)
        : [...prev.technicianTypeIds, id];
      return { ...prev, technicianTypeIds: selected };
    });
  };

  const onSave = async () => {
    if (!userId) return;

    setSaving(true);

    try {
      let imageUrl = form.image;
      let cvUrl = form.CV;

      if (avatarFile) {
        setUploadingAvatar(true);
        imageUrl = await uploadImageToCloudinary(avatarFile);
        setUploadingAvatar(false);
      }

      if (roleName === "tecnico" && cvFile) {
        setUploadingCV(true);
        cvUrl = await uploadImageToCloudinary(cvFile);
        setUploadingCV(false);
      }

      const payload: any = {
        name: form.name,
        lastname: form.lastname,
        phone: form.phone,
        email: form.email,
        documentnumber: form.documentnumber,
        image: imageUrl,
      };

      if (roleName === "cliente") {
        payload.customercity = form.customercity;
        payload.customerzipcode = form.customerzipcode;
      }

      if (roleName === "tecnico") {
        payload.CV = cvUrl;
        payload.techniciantypeids = form.technicianTypeIds;
      }

      const res = await api.patch(`/users/${userId}`, payload);

      if (res.data.success) {
        setForm((p) => ({ ...p, image: imageUrl, CV: cvUrl }));
        resetLocalFiles();
        await refreshBasicUserData(userId);
        showSuccess("Cambios guardados correctamente");
        onClose();
      } else {
        showError(res.data.message || "Error al guardar");
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || "Error al guardar los cambios");
    } finally {
      setUploadingAvatar(false);
      setUploadingCV(false);
      setSaving(false);
    }
  };

  const busy = saving || uploadingAvatar || uploadingCV;
  const avatarInputId = "profile-avatar-input";
  const cvInputId = "profile-cv-input";

  return (
    <Modal
      title="Editar perfil"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 border"
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            disabled={busy}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-white disabled:opacity-60"
          >
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="py-10 text-center text-gray-500">Cargando…</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-2xl bg-gray-200 grid place-content-center overflow-hidden">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-gray-600">
                  {initials || "?"}
                </span>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Cambiar foto
              </label>

              <div className="flex items-center gap-3">
                <input
                  ref={avatarInputRef}
                  id={avatarInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatar}
                  disabled={busy}
                  className="hidden"
                />

                <label
                  htmlFor={avatarInputId}
                  className={`inline-flex items-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white ${
                    busy ? "pointer-events-none opacity-60" : "cursor-pointer"
                  }`}
                >
                  Elegir archivo
                </label>

                <span className="text-sm text-gray-500 truncate max-w-[260px]">
                  {avatarFileName || "No se ha seleccionado ningún archivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <input
                value={form.lastname}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastname: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Documento</label>
              <input
                value={form.documentnumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, documentnumber: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Correo</label>
              <input
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {roleName === "cliente" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input
                    value={form.customercity}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customercity: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Código postal
                  </label>
                  <input
                    value={form.customerzipcode}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customerzipcode: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </>
            )}

            {roleName === "tecnico" && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">CV</label>

                  <div className="flex items-center gap-3">
                    <input
                      ref={cvInputRef}
                      id={cvInputId}
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleCV}
                      disabled={busy}
                      className="hidden"
                    />

                    <label
                      htmlFor={cvInputId}
                      className={`inline-flex items-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white ${
                        busy ? "pointer-events-none opacity-60" : "cursor-pointer"
                      }`}
                    >
                      Elegir archivo
                    </label>

                    <span className="text-sm text-gray-500 truncate max-w-[260px]">
                      {cvFileName || "No se ha seleccionado ningún archivo"}
                    </span>
                  </div>

                  {form.CV && (
                    <a
                      href={form.CV}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                    >
                      Ver CV actual
                    </a>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Tipos de técnico
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {techTypesList.map((t) => (
                      <button
                        key={t.techniciantypeid}
                        type="button"
                        onClick={() => toggleTechType(t.techniciantypeid)}
                        className={`rounded-xl border px-3 py-1.5 text-sm ${
                          form.technicianTypeIds.includes(t.techniciantypeid)
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-800 border-gray-300"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
