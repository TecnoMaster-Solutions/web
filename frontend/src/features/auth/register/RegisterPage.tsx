"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Nav from "@/features/landing/layout/Nav";
import { useAuth } from "@/features/auth/authcontext";
import { showError, showSuccess } from "@/shared/utils/notifications";
import { useDocumentTypes } from "@/features/dashboard/Users/hooks/useDocumentTypes";
import { useRoles } from "@/features/dashboard/Users/hooks/useRoles";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type FormState = {
  name: string;
  lastname: string;
  typeid: string;
  documentnumber: string;
  phone: string;
  city: string;
  zipcode: string;
  email: string;
};

type FormErrors = Record<keyof FormState, string>;
type FormTouched = Record<keyof FormState, boolean>;

const emptyErrors: FormErrors = {
  name: "",
  lastname: "",
  typeid: "",
  documentnumber: "",
  phone: "",
  city: "",
  zipcode: "",
  email: "",
};

const emptyTouched: FormTouched = {
  name: false,
  lastname: false,
  typeid: false,
  documentnumber: false,
  phone: false,
  city: false,
  zipcode: false,
  email: false,
};

const sanitize = (v: unknown) => String(v ?? "").trim();

const hasSpecialChars = (value: string) =>
  /[@,.;:_{}\[\}^\]`+*~¡¿?\\'=)(/&%$#"|<>]/.test(value);

function validateField(field: keyof FormState, value: string, form: FormState): string {
  const v = sanitize(value);
  const typeIdNum = Number(form.typeid || 0);
  const isNit = typeIdNum === 4;

  switch (field) {
    case "name": {
      if (!v) return isNit ? "El nombre de la empresa es obligatorio" : "El nombre es obligatorio";
      if (!isNit && /[0-9]/.test(v)) return "El nombre no puede contener números";
      if (hasSpecialChars(v)) return "El nombre no puede contener caracteres especiales";
      return "";
    }

    case "lastname": {
      if (isNit) return "";
      if (!v) return "El apellido es obligatorio";
      if (/[0-9]/.test(v)) return "El apellido no puede contener números";
      if (hasSpecialChars(v)) return "El apellido no puede contener caracteres especiales";
      return "";
    }

    case "typeid": {
      if (!v) return "El tipo de documento es obligatorio";
      return "";
    }

    case "documentnumber": {
      if (!v) return "El número de documento es obligatorio";
      if (!typeIdNum) return "Seleccione el tipo de documento antes de digitar el número";

      if (isNit) {
        if (!/^\d{5,12}-\d{1}$/.test(v)) return "El NIT debe tener formato válido (Ejemplo: 900123456-7)";
        if (!v.includes("-")) return "El NIT debe incluir un guion (-)";
        return "";
      }

      if (typeIdNum === 2) {
        if (!/^\d{7}$/.test(v)) return "El número de PPT debe tener exactamente 7 dígitos numéricos";
        return "";
      }

      if (typeIdNum === 3) {
        if (!/^[A-Za-z]{2}\d{6}$/.test(v))
          return "El pasaporte debe tener 2 letras seguidas de 6 números (Ejemplo: AB123456)";
        return "";
      }

      if (typeIdNum === 5) {
        if (!/^\d{9}$/.test(v)) return "La Cédula de Extranjería debe tener exactamente 9 dígitos numéricos";
        return "";
      }

      if (typeIdNum === 6) {
        if (!/^\d{12}$/.test(v)) return "El número de Visa (VI) debe tener exactamente 12 dígitos numéricos";
        return "";
      }

      if (!/^\d+$/.test(v)) return "El documento solo puede contener números";
      if (v.length > 10) return "El número de documento no puede tener más de 10 caracteres";
      return "";
    }

    case "phone": {
      if (!v) return isNit ? "El teléfono de la empresa es obligatorio" : "El teléfono es obligatorio";
      if (!/^\d+$/.test(v)) return "El teléfono solo puede contener números";
      if (v.length !== 10) return "El teléfono debe tener exactamente 10 dígitos";
      return "";
    }

    case "city": {
      if (!v) return "La ciudad es obligatoria";
      if (/[0-9]/.test(v)) return "La ciudad no puede contener números";
      if (hasSpecialChars(v)) return "La ciudad no puede contener caracteres especiales";
      return "";
    }

    case "zipcode": {
      if (!v) return "El código postal es obligatorio";
      if (!/^\d+$/.test(v)) return "El código postal debe contener solo números";
      if (v.length < 4 || v.length > 10) return "El código postal debe tener entre 4 y 10 dígitos";
      return "";
    }

    case "email": {
      if (!v) return isNit ? "El correo de la empresa es obligatorio" : "El correo electrónico es obligatorio";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "El formato del correo no es válido";
      return "";
    }

    default:
      return "";
  }
}

function validateAll(form: FormState): FormErrors {
  return {
    name: validateField("name", form.name, form),
    lastname: validateField("lastname", form.lastname, form),
    typeid: validateField("typeid", form.typeid, form),
    documentnumber: validateField("documentnumber", form.documentnumber, form),
    phone: validateField("phone", form.phone, form),
    city: validateField("city", form.city, form),
    zipcode: validateField("zipcode", form.zipcode, form),
    email: validateField("email", form.email, form),
  };
}

function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((e) => e !== "");
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { documentTypes } = useDocumentTypes();
  const { roles } = useRoles();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    lastname: "",
    typeid: "",
    documentnumber: "",
    phone: "",
    city: "",
    zipcode: "",
    email: "",
  });

  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [touched, setTouched] = useState<FormTouched>(emptyTouched);
  const [checking, setChecking] = useState({
    documentnumber: false,
    phone: false,
    email: false,
  });

  const latestCheckRef = useRef({
    documentnumber: "",
    phone: "",
    email: "",
  });

  const clientRole = useMemo(
    () => roles.find((r: any) => String(r?.name ?? "").toLowerCase() === "cliente"),
    [roles]
  );

  const setField = (name: keyof FormState, value: string) => {
    let nextForm: FormState = { ...form, [name]: value };

    if (name === "typeid") {
      const typeIdNum = Number(value || 0);
      const isNit = typeIdNum === 4;
      if (isNit) {
        nextForm = { ...nextForm, lastname: "" };
      }
    }

    setForm(nextForm);

    const nextTouched: FormTouched = { ...touched, [name]: true };
    if (name === "typeid") nextTouched.documentnumber = true;
    setTouched(nextTouched);

    const nextErrors: FormErrors = {
      ...errors,
      [name]: validateField(name, nextForm[name], nextForm),
    };

    if (name === "typeid") {
      nextErrors.documentnumber = validateField("documentnumber", nextForm.documentnumber, nextForm);
      nextErrors.lastname = validateField("lastname", nextForm.lastname, nextForm);
      nextErrors.name = validateField("name", nextForm.name, nextForm);
      nextErrors.phone = validateField("phone", nextForm.phone, nextForm);
      nextErrors.email = validateField("email", nextForm.email, nextForm);
    }

    setErrors(nextErrors);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof FormState;
    setField(name, e.target.value);
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const name = e.target.name as keyof FormState;
    const nextTouched = { ...touched, [name]: true };
    setTouched(nextTouched);

    const nextError = validateField(name, form[name], form);
    setErrors((prev) => ({ ...prev, [name]: nextError }));

    if (name === "typeid") {
      const docErr = validateField("documentnumber", form.documentnumber, form);
      setErrors((prev) => ({ ...prev, documentnumber: docErr }));
    }
  };

  const runDuplicateCheck = async (
    field: "documentnumber" | "phone" | "email",
    value: string
  ) => {
    const cleanValue = sanitize(value);
    if (!cleanValue) return;

    latestCheckRef.current[field] = cleanValue;
    setChecking((prev) => ({ ...prev, [field]: true }));

    try {
      const params: Record<string, string> = { [field]: cleanValue };
      const res = await api.get("/users/check", { params });
      const payload = (res.data?.data ?? res.data) as any;
      const exists = Boolean(payload?.[field]);

      const currentError = validateField(field, form[field], form);
      const nextError =
        currentError ||
        (exists
          ? `Ya existe un usuario con este ${
              field === "documentnumber" ? "numero de documento" : field === "phone" ? "telefono" : "correo"
            }`
          : "");

      if (latestCheckRef.current[field] !== cleanValue) return;
      setErrors((prev) => ({ ...prev, [field]: nextError }));
    } catch {
      // Ignorar errores de red en validacion en vivo
    } finally {
      setChecking((prev) => ({ ...prev, [field]: false }));
    }
  };

  useEffect(() => {
    const localError = validateField("documentnumber", form.documentnumber, form);
    if (!form.documentnumber || localError) return;
    const handle = setTimeout(() => runDuplicateCheck("documentnumber", form.documentnumber), 450);
    return () => {
      clearTimeout(handle);
      setChecking((prev) => ({ ...prev, documentnumber: false }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.documentnumber, form.typeid]);

  useEffect(() => {
    const localError = validateField("phone", form.phone, form);
    if (!form.phone || localError) return;
    const handle = setTimeout(() => runDuplicateCheck("phone", form.phone), 450);
    return () => {
      clearTimeout(handle);
      setChecking((prev) => ({ ...prev, phone: false }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.phone]);

  useEffect(() => {
    const localError = validateField("email", form.email, form);
    if (!form.email || localError) return;
    const handle = setTimeout(() => runDuplicateCheck("email", form.email), 450);
    return () => {
      clearTimeout(handle);
      setChecking((prev) => ({ ...prev, email: false }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!clientRole) {
      showError("No se encontró el rol de cliente.");
      return;
    }

    const newErrors = validateAll(form);
    setErrors(newErrors);

    const allTouched = Object.keys(emptyTouched).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as FormTouched
    );
    setTouched(allTouched);

    if (hasErrors(newErrors)) {
      showError("Por favor complete los campos correctamente");
      return;
    }

    const payload = {
      name: sanitize(form.name),
      lastname: sanitize(form.lastname),
      typeid: Number(form.typeid),
      documentnumber: sanitize(form.documentnumber),
      phone: sanitize(form.phone),
      email: sanitize(form.email),
      roleid: clientRole.roleid,
      stateid: 1,
      customercity: sanitize(form.city),
      customerzipcode: sanitize(form.zipcode),
    };

    setLoading(true);
    const res = await register(payload);
    setLoading(false);

    if (res.ok) {
      showSuccess("Cuenta creada correctamente, revise su correo");
      router.push("/auth/login");
    } else {
      showError(res.message || "Error al registrar");
    }
  };

  const inputClass = (name: keyof FormState) => {
    const base = "w-full h-11 mt-1 px-3 rounded-lg border bg-white outline-none";
    const err =
      touched[name] && errors[name]
        ? " border-red-600 focus:border-red-600"
        : " border-gray-300 focus:border-gray-400";
    return base + err;
  };

  const errorText = (name: keyof FormState) =>
    touched[name] && errors[name] ? <p className="mt-1 text-xs text-red-700">{errors[name]}</p> : null;

  const checkingText = (name: "documentnumber" | "phone" | "email") =>
    checking[name] ? <p className="mt-1 text-xs text-gray-500">Verificando...</p> : null;

  const isNit = Number(form.typeid || 0) === 4;

  return (
    <div className="min-h-screen w-full bg-[#f6f3f3] flex flex-col overflow-hidden">
      <Nav />

      <div className="flex flex-col lg:flex-row flex-1 px-6 lg:px-20 items-center justify-center gap-10 py-10">
        <div className="w-full lg:w-[55%] max-w-3xl">
          <h2 className="text-3xl font-black mb-2">Crear cuenta</h2>
          <p className="text-gray-600 mb-6">Regístrate para continuar.</p>

          <form
            noValidate
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
          >
            <div>
              <label className="text-sm font-semibold">Tipo de Documento</label>
              <select
                name="typeid"
                value={form.typeid}
                onChange={onChange}
                onBlur={onBlur}
                className={inputClass("typeid")}
                aria-invalid={!!(touched.typeid && errors.typeid)}
              >
                <option value="">Seleccionar...</option>
                {documentTypes.map((t: any) => (
                  <option key={t.typeofdocumentid} value={t.typeofdocumentid}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errorText("typeid")}
            </div>

            <div>
              <label className="text-sm font-semibold">Numero</label>
              <input
                name="documentnumber"
                value={form.documentnumber}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Numero de documento"
                className={inputClass("documentnumber")}
                aria-invalid={!!(touched.documentnumber && errors.documentnumber)}
                inputMode="text"
                autoComplete="off"
              />
              {errorText("documentnumber")}
              {checkingText("documentnumber")}
            </div>

            <div>
              <label className="text-sm font-semibold">{isNit ? "Nombre de empresa" : "Nombre"}</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={isNit ? "Nombre de la empresa" : "Tu nombre"}
                className={inputClass("name")}
                aria-invalid={!!(touched.name && errors.name)}
                autoComplete="given-name"
              />
              {errorText("name")}
            </div>

            <div>
              <label className="text-sm font-semibold">Apellido</label>
              <input
                name="lastname"
                value={form.lastname}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Tu apellido"
                className={inputClass("lastname")}
                aria-invalid={!!(touched.lastname && errors.lastname)}
                autoComplete="family-name"
                disabled={isNit}
              />
              {errorText("lastname")}
            </div>

            <div>
              <label className="text-sm font-semibold">Telefono</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Telefono"
                className={inputClass("phone")}
                aria-invalid={!!(touched.phone && errors.phone)}
                inputMode="numeric"
                autoComplete="tel"
              />
              {errorText("phone")}
              {checkingText("phone")}
            </div>

            <div>
              <label className="text-sm font-semibold">Email</label>
              <input
                type="text"
                inputMode="email"
                name="email"
                value={form.email}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="correo@empresa.com"
                className={inputClass("email")}
                aria-invalid={!!(touched.email && errors.email)}
                autoComplete="email"
              />
              {errorText("email")}
              {checkingText("email")}
            </div>

            <div>
              <label className="text-sm font-semibold">Ciudad</label>
              <input
                name="city"
                value={form.city}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Ciudad"
                className={inputClass("city")}
                aria-invalid={!!(touched.city && errors.city)}
                autoComplete="address-level2"
              />
              {errorText("city")}
            </div>

            <div>
              <label className="text-sm font-semibold">Código Postal</label>
              <input
                name="zipcode"
                value={form.zipcode}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Código postal"
                className={inputClass("zipcode")}
                aria-invalid={!!(touched.zipcode && errors.zipcode)}
                inputMode="numeric"
                autoComplete="postal-code"
              />
              {errorText("zipcode")}
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>

              <p className="text-sm text-center text-gray-600 mt-3">
                ¿Ya tienes cuenta?{" "}
                <a href="/auth/login" className="text-red-700 font-medium hover:underline">
                  Iniciar sesión
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="hidden lg:flex w-[40%] justify-center">
          <Image
            src="/assets/imgs/previewSinFondo.png"
            alt="preview"
            width={420}
            height={420}
            className="rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}
