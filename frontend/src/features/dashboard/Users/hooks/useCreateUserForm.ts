import { useState, useEffect, useCallback } from "react";
import { showWarning } from "@/shared/utils/notifications";
import {
  CreateUserModalProps,
  CreateUserData,
  FormErrors,
  FormTouched,
  User,
} from "../types/typesUser";
import {
  validateField,
  validateFormWithNotification,
} from "../Validations/UserValidations";
import { useRoles } from "./useRoles";

// Helpers externos
import { uploadFile } from "../helpers/uploadFile";
import { buildUserPayload } from "../helpers/buildUserPayload";

// ----------------------------
// Normalizador de roles
// ----------------------------
const normalizeRoleName = (name: string) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// =========================================================
// HOOK PRINCIPAL
// =========================================================
export const useCreateUserForm = ({
  isOpen,
  onClose,
  onSave,
  users,
}: CreateUserModalProps) => {
  const { roles } = useRoles();

  // ----------------------------
  // Estados base
  // ----------------------------
  const [formData, setFormData] = useState<CreateUserData>({
    name: "",
    lastname: "",
    email: "",
    phone: "",
    typeid: 0,
    documentnumber: "",
    image: null,
    stateid: 1,
    roleid: 0,
    CV: null,
    techniciantypeids: [],
    customercity: "",
    customerzipcode: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    userid: "",
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    documentnumber: "",
    typeid: "",
    stateid: "",
    image: "",
    roleid: "",
    CV: "",
    techniciantypeids: "",
    customercity: "",
    customerzipcode: "",
  });

  const [touched, setTouched] = useState<FormTouched>({
    userid: false,
    name: false,
    lastname: false,
    email: false,
    password: false,
    confirmPassword: false,
    phone: false,
    documentnumber: false,
    typeid: false,
    stateid: false,
    image: false,
    roleid: false,
    CV: false,
    techniciantypeids: false,
    customercity: false,
    customerzipcode: false,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCV, setPreviewCV] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNit, setIsNit] = useState(false);

  // --------------------------------------------------------
  // Obtener nombre del rol
  // --------------------------------------------------------
  const getRoleName = (roleId: number): string => {
    return normalizeRoleName(
      roles.find((r) => r.roleid === roleId)?.name ?? ""
    );
  };

  // --------------------------------------------------------
  // Efecto A: detectar si es NIT
  // --------------------------------------------------------
  useEffect(() => {
    setIsNit(formData.typeid === 4);
  }, [formData.typeid]);

  // --------------------------------------------------------
  // Efecto D: sincronizar NIT → apellido vacío + rol cliente
  // --------------------------------------------------------
  useEffect(() => {
    if (!isNit) return;

    const cliente = roles.find(
      (r) => normalizeRoleName(r.name) === "cliente"
    );

    setFormData((prev) => ({
      ...prev,
      lastname: "",
      roleid: cliente?.roleid || prev.roleid,
    }));
  }, [isNit, roles]);

  // =========================================================
  // C — Función unificada para actualizar campos
  // =========================================================
  const updateField = useCallback(
    (field: keyof CreateUserData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (touched[field]) {
        validateFieldOnChange(field, String(value ?? ""));
      }
    },
    [touched]
  );

  // Compatibilidad con el modal actual
  const handleInputChange = updateField;

  // =========================================================
  // Validación
  // =========================================================
  const validateFieldOnChange = (
    field: keyof FormErrors,
    value: string
  ) => {
    const error = validateField(
      field,
      value,
      {
        ...formData,
        roles: { roleid: formData.roleid, name: getRoleName(formData.roleid) },
      } as unknown as User,
      users,
      false
    );

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field: keyof FormTouched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = formData[field as keyof CreateUserData];
    validateFieldOnChange(field, String(val ?? ""));
  };

  // =========================================================
  // Subida de imagen
  // =========================================================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    updateField("image", file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    updateField("CV", file);
    setPreviewCV(file.name);
  };

  const removeImage = () => {
    updateField("image", null);
    setPreviewImage(null);
  };

  const removeCV = () => {
    updateField("CV", null);
    setPreviewCV(null);
  };

  // =========================================================
  // Tipos de técnico
  // =========================================================
  const handleTechnicianTypeChange = (
    typeId: number,
    checked: boolean
  ) => {
    updateField(
      "techniciantypeids",
      checked
        ? [...(formData.techniciantypeids ?? []), typeId]
        : (formData.techniciantypeids ?? []).filter((id) => id !== typeId)
    );
  };

  // =========================================================
  // Submit
  // =========================================================
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const valid = validateFormWithNotification(
      {
        ...formData,
        roles: { roleid: formData.roleid, name: getRoleName(formData.roleid) },
      } as unknown as User,
      users,
      setErrors,
      setTouched,
      false
    );

    if (!valid) return;

    try {
      setIsSubmitting(true);
      onClose();

      // Subir imagen
      let imageUrl = null;
      if (formData.image instanceof File) {
        imageUrl = await uploadFile(formData.image);
      }

      // Subir CV
      let cvUrl = null;
      if (formData.CV instanceof File) {
        cvUrl = await uploadFile(formData.CV);
      } else if (typeof formData.CV === "string") {
        cvUrl = formData.CV;
      }

      // B — Payload INMUTABLE
      const payload = buildUserPayload({
        formData,
        imageUrl,
        cvUrl,
      });

      await onSave(payload);
    } catch (err) {
      console.error("Error al crear usuario:", err);
      showWarning("Error al guardar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // Reset al abrir modal
  // =========================================================
  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      name: "",
      lastname: "",
      email: "",
      phone: "",
      typeid: 0,
      documentnumber: "",
      image: null,
      stateid: 1,
      roleid: 0,
      CV: null,
      techniciantypeids: [],
      customercity: "",
      customerzipcode: "",
    });

    setErrors({
      userid: "",
      name: "",
      lastname: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      documentnumber: "",
      typeid: "",
      stateid: "",
      image: "",
      roleid: "",
      CV: "",
      techniciantypeids: "",
      customercity: "",
      customerzipcode: "",
    });

    setTouched({
      userid: false,
      name: false,
      lastname: false,
      email: false,
      password: false,
      confirmPassword: false,
      phone: false,
      documentnumber: false,
      typeid: false,
      stateid: false,
      image: false,
      roleid: false,
      CV: false,
      techniciantypeids: false,
      customercity: false,
      customerzipcode: false,
    });

    setPreviewImage(null);
    setPreviewCV(null);
    setIsNit(false);
  }, [isOpen]);

  // =========================================================
  // RETURN API DEL HOOK
  // =========================================================
  return {
    formData,
    errors,
    touched,
    previewImage,
    previewCV,
    isSubmitting,
    isNit,

    // IMPORTANTE para tu modal
    handleInputChange,

    updateField,
    handleImageChange,
    handleCVChange,
    handleBlur,
    handleSubmit,
    removeImage,
    removeCV,
    handleTechnicianTypeChange,
  };
};
