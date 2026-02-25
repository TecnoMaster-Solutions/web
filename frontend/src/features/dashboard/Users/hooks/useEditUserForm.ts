import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react";
import {
  EditUserModalProps,
  EditUser,
  FormErrors,
  FormTouched,
  User,
} from "../types/typesUser";
import {
  validateField,
  validateFormWithNotification,
} from "../Validations/UserValidations";
import { showWarning } from "@/shared/utils/notifications";
import { useRoles } from "./useRoles";
import { uploadImage } from "../helpers/uploadImage";
import { uploadFile } from "../helpers/uploadFile";

// ----------------- UTILS -----------------

const normalizeRoleName = (name: string) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const applyNitDefaults = (
  typeid: number,
  roles: { roleid: number; name: string }[],
  setFormData: React.Dispatch<React.SetStateAction<EditUser>>,
  setIsNit: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const isNit = typeid === 4;
  setIsNit(isNit);

  if (!isNit) return;

  const clienteRole = roles.find(
    (r) => normalizeRoleName(r.name) === "cliente",
  );

  setFormData((prev) => {
    const nextRoleid = clienteRole?.roleid ?? prev.roleid;

    // Evitar bucles / renders innecesarios
    if (prev.lastname === "" && prev.roleid === nextRoleid) {
      return prev;
    }

    return {
      ...prev,
      lastname: "",
      roleid: nextRoleid,
    };
  });
};

const initialErrors: FormErrors = {
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
};

const initialTouched: FormTouched = {
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
};

// ----------------- HOOK -----------------

export const useEditUserForm = ({
  isOpen,
  onClose,
  onSave,
  user,
  users,
}: EditUserModalProps) => {
  const { roles } = useRoles();

  const [originalCV, setOriginalCV] = useState<string | null>(null);
  const [isNit, setIsNit] = useState<boolean>(false);

  const [formData, setFormData] = useState<EditUser>({
    userid: 0,
    name: "",
    lastname: "",
    email: "",
    phone: "",
    documentnumber: "",
    typeid: 0,
    image: null,
    stateid: 1,
    roleid: 0,
    CV: null,
    techniciantypeids: [],
    customercity: "",
    customerzipcode: "",
  });

  const [errors, setErrors] = useState<FormErrors>(() => initialErrors);
  const [touched, setTouched] = useState<FormTouched>(() => initialTouched);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCV, setPreviewCV] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRoleName = useCallback(
    (roleId: number): string => {
      const found = roles.find((r) => r.roleid === roleId);
      return normalizeRoleName(found?.name || "");
    },
    [roles],
  );

  // Contexto de validación memoizado
  const validationUser = useMemo(
    () =>
    ({
      ...formData,
      roles: {
        roleid: formData.roleid,
        name: getRoleName(formData.roleid),
      },
    } as unknown as User),
    [formData, getRoleName],
  );

  const validateFieldOnChange = useCallback(
    (field: string, value: string) => {
      // Para NIT ignoramos validación de apellido
      if (isNit && field === "lastname") return;

      const error = validateField(
        field,
        value,
        validationUser,
        users,
        true, // edit mode
      );

      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [isNit, validationUser, users],
  );

  const handleInputChange = useCallback(
    (
      field: keyof EditUser,
      value: string | number | File | null,
    ): void => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (touched[field]) {
        const strValue = typeof value === "string" ? value : String(value ?? "");
        validateFieldOnChange(field as string, strValue);
      }
    },
    [touched, validateFieldOnChange],
  );

  const handleTechnicianTypeChange = useCallback(
    (typeId: number, checked: boolean) => {
      setFormData((prev) => {
        const current = prev.techniciantypeids || [];
        return {
          ...prev,
          techniciantypeids: checked
            ? [...current, typeId]
            : current.filter((id) => id !== typeId),
        };
      });
    },
    [],
  );

  const handleImageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        setFormData((prev) => ({ ...prev, image: file }));
        setPreviewImage(URL.createObjectURL(file));
      }
    },
    [],
  );

  const handleCVChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({ ...prev, CV: file }));
      setPreviewCV(file.name);
    }
  }, []);

  const removeImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewImage(null);
  }, []);

  const removeCV = useCallback(() => {
    setFormData((prev) => ({ ...prev, CV: null }));
    setPreviewCV(null);
  }, []);

  const handleBlur = useCallback(
    (field: keyof FormTouched) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const value = formData[field as keyof EditUser];
      if (typeof value === "string" || typeof value === "number") {
        validateFieldOnChange(field as string, String(value));
      }
    },
    [formData, validateFieldOnChange],
  );

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();

      const valid = validateFormWithNotification(
        validationUser,
        users,
        setErrors,
        setTouched,
        true, // edit
      );

      if (!valid) return;

      try {
        setIsSubmitting(true);
        onClose();

        // IMAGEN
        let imageUrl: string | null = null;
        if (formData.image instanceof File) {
          imageUrl = await uploadImage(formData.image);
        } else if (typeof formData.image === "string") {
          imageUrl = formData.image;
        }

        // CV
        let cvUrl: string | null = originalCV;
        if (formData.CV instanceof File) {
          cvUrl = await uploadFile(formData.CV);
        } else if (typeof formData.CV === "string") {
          cvUrl = formData.CV;
        }

        const payload: EditUser = {
          ...formData,
          lastname: isNit ? null : formData.lastname,
          image: imageUrl,
          CV: cvUrl,
        };

        await onSave(payload);
      } catch (error) {
        console.error("Error al actualizar usuario:", error);
        showWarning("Error al actualizar el usuario.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      validationUser,
      users,
      onClose,
      formData,
      originalCV,
      isNit,
      onSave,
    ],
  );

  // Efecto para aplicar lógica de NIT (rol cliente + limpiar apellido)
  useEffect(() => {
    if (!isOpen) return;
    applyNitDefaults(formData.typeid, roles, setFormData, setIsNit);
  }, [formData.typeid, roles, isOpen]);

  // Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (isOpen && user) {
      const technician = user.technicians?.[0];
      const customer = user.customers?.[0];
      const currentCV = technician?.CV || null;

      setOriginalCV(currentCV);
      setIsNit(user.typeid === 4);

      setFormData({
        userid: user.userid!,
        name: user.name,
        lastname: user.lastname || "",
        email: user.email,
        phone: user.phone,
        documentnumber: user.documentnumber,
        typeid: user.typeid,
        image: user.image ?? null,
        stateid: user.stateid,
        roleid: user.roleid,
        CV: currentCV,
        techniciantypeids:
          technician?.technicianTypeMaps?.map((tm) => Number(tm.techniciantypeid)) || [],
        customercity: customer?.customercity || "",
        customerzipcode: customer?.customerzipcode || "",
      });

      // Reset errores/touched
      setErrors(initialErrors);
      setTouched(initialTouched);

      // Preview imagen
      if (typeof user.image === "string") {
        setPreviewImage(user.image);
      } else {
        setPreviewImage(null);
      }

      // Preview CV
      setPreviewCV(currentCV || null);
    }
  }, [isOpen, user]);


  return {
    formData,
    errors,
    touched,
    isNit,
    previewImage,
    previewCV,
    isSubmitting,
    handleInputChange,
    handleImageChange,
    handleCVChange,
    handleBlur,
    handleSubmit,
    removeImage,
    removeCV,
    handleTechnicianTypeChange,
  };
};
