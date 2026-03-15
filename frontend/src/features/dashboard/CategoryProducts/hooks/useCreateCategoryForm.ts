import { useState, useEffect, useCallback } from "react";
import {
  CategoryFieldName,
  CreateCategoryModalProps,
  CreateCategoryData,
  FormErrors,
  FormTouched,
} from "../types/typeCategoryProducts";
import {
  validateField,
  validateFormWithNotification,
} from "../validations/categoryValidations";
import { uploadImage } from "@/shared/services/uploadImage";
import { showWarning } from "@/shared/utils/notifications";

const initialFormState: CreateCategoryData = {
  name: "",
  description: "",
  icon: null,
};

const initialErrors: FormErrors = {
  name: "",
  description: "",
};

const initialTouched: FormTouched = {
  name: false,
  description: false,
};

type CategoryInputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
type CategoryInputBlurEvent = React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>;

export const useCreateCategoryForm = ({
  isOpen,
  onClose,
  onSave,
  categories,
}: CreateCategoryModalProps) => {
  const [formData, setFormData] = useState<CreateCategoryData>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>(initialErrors);
  const [touched, setTouched] = useState<FormTouched>(initialTouched);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors(initialErrors);
      setTouched(initialTouched);
    }
  }, [isOpen]);

  const handleInputChange = useCallback(
    (e: CategoryInputChangeEvent) => {
      const { name, value } = e.target;
      const fieldName = name as keyof CreateCategoryData;
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      if (name in touched && touched[name as CategoryFieldName]) {
        const error = validateField(name, value, categories);
        setErrors((prev) => ({ ...prev, [name as CategoryFieldName]: error }));
      }
    },
    [categories, touched],
  );

  const handleBlur = useCallback(
    (e: CategoryInputBlurEvent) => {
      const { name, value } = e.target;
      const fieldName = name as CategoryFieldName;
      setTouched((prev) => ({ ...prev, [fieldName]: true }));
      const error = validateField(name, value, categories);
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    },
    [categories],
  );

  const handleIconChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setFormData((prev) => ({ ...prev, icon: file }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const valid = validateFormWithNotification(
        formData,
        setErrors,
        setTouched,
        categories,
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
          name: formData.name.trim(),
          description: formData.description.trim(),
          icon: iconUrl,
        });
        onClose();
      } catch (error) {
        console.error(error);
        showWarning("Error al guardar la categoria");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, categories, onClose, onSave],
  );

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleInputChange,
    handleBlur,
    handleIconChange,
    handleSubmit,
  };
};
