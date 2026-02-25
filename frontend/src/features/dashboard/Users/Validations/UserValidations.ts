import { showError } from "@/shared/utils/notifications";
import { User, FormErrors, FormTouched } from "../types/typesUser";

const normalizeRoleName = (name: string) =>
  (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const validateField = (
  fieldName: string,
  value: string,
  formData: User,
  users: User[],
  isEditMode: boolean = false
): string => {
  let error = "";
  const specialChars = /[@,.;:_\{\[\}^\]`+*~¡¿?\\'=)(/&%$#"|<>]/;

  const roleName = normalizeRoleName(formData.roles?.name || "");
  const trimmedValue = String(value).trim().toLowerCase();

  const isNit = Number(formData.typeid) === 4;

  switch (fieldName) {
    case "typeid":
      if (!String(value).trim()) error = "El tipo de documento es obligatorio";
      break;

    case "documentnumber":
      if (!value.trim()) {
        error = "El número de documento es obligatorio";
      } else if (isNit) {
        if (!/^\d{5,12}-\d{1}$/.test(value)) {
          error = "El NIT debe tener formato válido (Ejemplo: 900123456-7)";
        } else if (!value.includes("-")) {
          error = "El NIT debe incluir un guion (-)";
        }
      } else if (Number(formData.typeid) === 2) {
        if (!/^\d{7}$/.test(value)) {
          error = "El número de PPT debe tener exactamente 7 dígitos numéricos";
        }
      } else if (Number(formData.typeid) === 3) {
        if (!/^[A-Za-z]{2}\d{6}$/.test(value)) {
          error =
            "El pasaporte debe tener 2 letras seguidas de 6 números (Ejemplo: AB123456)";
        }
      } else if (Number(formData.typeid) === 5) {
        if (!/^\d{9}$/.test(value)) {
          error =
            "La Cédula de Extranjería debe tener exactamente 9 dígitos numéricos";
        }
      } else if (Number(formData.typeid) === 6) {
        if (!/^\d{12}$/.test(value)) {
          error = "El número de Visa (VI) debe tener exactamente 12 dígitos numéricos";
        }
      } else {
        if (!/^\d+$/.test(value)) {
          error = "El documento solo puede contener números";
        } else if (value.length > 10) {
          error = "El número de documento no puede tener más de 10 caracteres";
        }
      }

      if (!error) {
        const duplicate = users.find(
          (u) =>
            u.documentnumber.toLowerCase() === trimmedValue &&
            (!isEditMode || u.userid !== formData.userid)
        );
        if (duplicate)
          error = "Ya existe un usuario con este número de documento";
      }
      break;

    case "name":
      if (!value.trim()) {
        error = isNit
          ? "El nombre de la empresa es obligatorio"
          : "El nombre es obligatorio";
      } else if (/[0-9]/.test(value) && !isNit) {
        error = "El nombre no puede contener números";
      } else if (specialChars.test(value)) {
        error = "El nombre no puede contener caracteres especiales";
      }
      break;

    case "lastname":
      if (isNit) break;
      if (!value.trim()) {
        error = "El apellido es obligatorio";
      } else if (/[0-9]/.test(value)) {
        error = "El apellido no puede contener números";
      } else if (specialChars.test(value)) {
        error = "El apellido no puede contener caracteres especiales";
      }
      break;

    case "phone":
      if (!value.trim()) {
        error = isNit
          ? "El teléfono de la empresa es obligatorio"
          : "El teléfono es obligatorio";
      } else if (!/^\d+$/.test(value)) {
        error = "El teléfono solo puede contener números";
      } else if (value.length !== 10) {
        error = "El teléfono debe tener exactamente 10 dígitos";
      } else {
        const duplicate = users.find(
          (u) => u.phone === value && (!isEditMode || u.userid !== formData.userid)
        );
        if (duplicate)
          error = "Ya existe un usuario con este número de teléfono";
      }
      break;

    case "email":
      if (!value.trim()) {
        error = isNit
          ? "El correo de la empresa es obligatorio"
          : "El correo electrónico es obligatorio";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "El formato del correo no es válido";
      } else {
        const duplicate = users.find(
          (u) =>
            u.email.toLowerCase() === trimmedValue &&
            (!isEditMode || u.userid !== formData.userid)
        );
        if (duplicate)
          error = "Ya existe un usuario con este correo electrónico";
      }
      break;

    case "password":
    case "confirmPassword":
      if (isEditMode && value.trim()) {
        if (value.length < 6) {
          error = "La contraseña debe tener al menos 6 caracteres";
        } else if (
          value &&
          formData.confirmPassword &&
          value !== formData.confirmPassword
        ) {
          error = "Las contraseñas no coinciden";
        }
      }
      break;

    case "stateid":
      if (!String(value).trim()) error = "El estado es obligatorio";
      break;

    case "roleid":
      if (!String(value).trim() || value === "0") {
        error = "El rol es obligatorio";
      }
      break;

    case "CV":
      if (roleName === "tecnico") {
        const cvValue =
          (formData as any).CV || formData.technicians?.[0]?.CV || "";
        const hasFile =
          cvValue instanceof File ||
          (typeof cvValue === "string" && cvValue.trim() !== "");
        if (!hasFile) {
          error = "El CV es obligatorio para técnicos";
        }
      }
      break;

    case "techniciantypeids":
      if (roleName === "tecnico") {
        const typeIds =
          (formData as any).techniciantypeids ||
          formData.technicians?.[0]?.technicianTypeMaps?.map(
            (tm) => tm.techniciantypeid
          ) ||
          [];
        if (!typeIds || typeIds.length === 0) {
          error = "Debe seleccionar al menos un tipo de técnico";
        }
      }
      break;

    case "customercity":
      if (roleName === "cliente") {
        const city =
          formData.customers?.[0]?.customercity ??
          (formData as any).customercity ??
          "";
        if (!city.trim()) {
          error = "La ciudad es obligatoria para clientes";
        }
      }
      break;

    case "customerzipcode":
      if (roleName === "cliente") {
        const zip =
          formData.customers?.[0]?.customerzipcode ??
          (formData as any).customerzipcode ??
          "";
        if (!zip.trim()) {
          error = "El código postal es obligatorio para clientes";
        } else if (!/^\d+$/.test(zip)) {
          error = "El código postal debe contener solo números";
        }
      }
      break;

    default:
      break;
  }

  return error;
};

export const validateAllFields = (
  formData: User,
  users: User[],
  isEditMode: boolean = false
): FormErrors => {
  const withDefaults = {
    ...formData,
    lastname: formData.lastname || "",
    password: formData.password || "",
    confirmPassword: formData.confirmPassword || "",
    CV: (formData as any).CV || formData.technicians?.[0]?.CV || "",
    customercity:
      (formData as any).customercity ||
      formData.customers?.[0]?.customercity ||
      "",
    customerzipcode:
      (formData as any).customerzipcode ||
      formData.customers?.[0]?.customerzipcode ||
      "",
  };

  return {
    userid: "",
    name: validateField("name", withDefaults.name, withDefaults, users, isEditMode),
    lastname: validateField("lastname", withDefaults.lastname, withDefaults, users, isEditMode),
    email: validateField("email", withDefaults.email, withDefaults, users, isEditMode),
    password: validateField("password", withDefaults.password, withDefaults, users, isEditMode),
    confirmPassword: validateField("confirmPassword", withDefaults.confirmPassword, withDefaults, users, isEditMode),
    phone: validateField("phone", withDefaults.phone, withDefaults, users, isEditMode),
    documentnumber: validateField("documentnumber", withDefaults.documentnumber, withDefaults, users, isEditMode),
    typeid: validateField("typeid", String(withDefaults.typeid || ""), withDefaults, users, isEditMode),
    stateid: validateField("stateid", String(withDefaults.stateid || ""), withDefaults, users, isEditMode),
    image: "",
    roleid: validateField("roleid", String(withDefaults.roleid || ""), withDefaults, users, isEditMode),
    CV: validateField("CV", withDefaults.CV, withDefaults, users, isEditMode),
    techniciantypeids: validateField("techniciantypeids", "", withDefaults, users, isEditMode),
    customercity: validateField("customercity", withDefaults.customercity, withDefaults, users, isEditMode),
    customerzipcode: validateField("customerzipcode", withDefaults.customerzipcode, withDefaults, users, isEditMode),
  };
};

export const hasErrors = (errors: FormErrors): boolean =>
  Object.values(errors).some((e) => e !== "");

export const validateFormWithNotification = (
  formData: User,
  users: User[],
  setErrors: (errors: FormErrors) => void,
  setTouched: (touched: FormTouched) => void,
  isEditMode: boolean = false
): boolean => {
  const newErrors = validateAllFields(formData, users, isEditMode);
  setErrors(newErrors);

  const allTouched: FormTouched = Object.keys(newErrors).reduce(
    (acc, key) => ({ ...acc, [key]: true }),
    {} as FormTouched
  );
  setTouched(allTouched);

  if (hasErrors(newErrors)) {
    showError("Por favor complete los campos correctamente");
    return false;
  }

  return true;
};
