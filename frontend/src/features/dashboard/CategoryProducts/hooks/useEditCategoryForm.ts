import { useState, useEffect, useCallback, useRef } from "react";
import {
  EditCategoryData,
  EditCategoryModalProps,
  FormErrors,
  FormTouched,
} from "../types/typeCategoryProducts";
import {
  validateField,
  validateFormWithNotification,
} from "../validations/categoryValidations";
import { uploadImage } from "@/shared/services/uploadImage";
import { showWarning } from "@/shared/utils/notifications";

const initialErrors: FormErrors = { name: "", description: "" };
const initialTouched: FormTouched = { name: false, description: false };

export const useEditCategoryForm = ({
  isOpen,
  category,
  onClose,
  onSave,
  categories,
}: EditCategoryModalProps) => {
  const [formData, setFormData] = useState<EditCategoryData>({
    id: 0,
    name: "",
    description: "",
    status: true,
    icon: null,
  });
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [touched, setTouched] = useState<FormTouched>(initialTouched);
  const [previewIcon, setPreviewIcon] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !category) return;

    setFormData({
      id: category.id,
      name: category.name,
      description: category.description,
      status: category.status,
      icon: category.icon ?? null,
    });

    setErrors(initialErrors);
    setTouched(initialTouched);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (category.icon) {
      if (typeof category.icon === "string") {
        setPreviewIcon(category.icon);
      } else {
        const url = URL.createObjectURL(category.icon);
        previewUrlRef.current = url;
        setPreviewIcon(url);
      }
    } else {
      setPreviewIcon(null);
    }
  }, [category, isOpen]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (touched[name as keyof FormTouched]) {
        const error = validateField(name, value, categories, formData.id);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [categories, formData.id, touched],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, value, categories, formData.id);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [categories, formData.id],
  );

  const handleIconChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFormData((prev) => ({ ...prev, icon: file }));

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      if (file) {
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;
        setPreviewIcon(url);
      } else {
        setPreviewIcon(null);
      }
    },
    [],
  );

  const removeIcon = useCallback(() => {
    setFormData((prev) => ({ ...prev, icon: null }));
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewIcon(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const valid = validateFormWithNotification(
        formData,
        setErrors,
        setTouched,
        categories,
        formData.id,
      );
      if (!valid) return;

      setIsSubmitting(true);
      try {
        let iconUrl: string | null = null;
        if (formData.icon instanceof File) {
          iconUrl = await uploadImage(formData.icon);
          if (!iconUrl) return;
        } else if (typeof formData.icon === "string") {
          iconUrl = formData.icon;
        }

        await onSave({
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: iconUrl,
        });
        onClose();
      } catch (error) {
        console.error(error);
        showWarning("Error al actualizar la categoria.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [categories, formData, onClose, onSave],
  );

  return {
    formData,
    errors,
    touched,
    previewIcon,
    isSubmitting,
    handleInputChange,
    handleIconChange,
    handleBlur,
    handleSubmit,
    removeIcon,
  };
};
