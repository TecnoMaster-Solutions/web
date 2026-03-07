import {
  isDuplicateName,
  validateAllFields,
  validateField,
  validateFormWithNotification,
} from "./categoryValidations";
import { showError } from "@/shared/utils/notifications";

jest.mock("@/shared/utils/notifications", () => ({
  showError: jest.fn(),
  showWarning: jest.fn(),
}));

describe("categoryValidations", () => {
  it("isDuplicateName detecta duplicado ignorando mayusculas/minusculas", () => {
    const categories = [{ id: 1, name: "Laptops" }];

    expect(isDuplicateName("laptops", categories)).toBe(true);
    expect(isDuplicateName("Monitores", categories)).toBe(false);
    expect(isDuplicateName("Laptops", categories, 1)).toBe(false);
  });

  it("validateField falla cuando el nombre esta vacio", () => {
    expect(validateField("name", "   ")).toBe("El nombre es obligatorio");
  });

  it("validateField falla cuando el nombre contiene numeros", () => {
    expect(validateField("name", "Categoria 123")).toBe(
      "El nombre no puede contener números",
    );
  });

  it("validateField falla cuando la descripcion supera 255 caracteres", () => {
    const longDescription = "a".repeat(256);
    expect(validateField("description", longDescription)).toBe(
      "La descripción no puede superar los 255 caracteres",
    );
  });

  it("validateAllFields devuelve errores por nombre invalido", () => {
    const result = validateAllFields({
      name: "",
      description: "Descripcion",
    });

    expect(result.name).toBe("El nombre es obligatorio");
    expect(result.description).toBe("");
  });

  it("validateFormWithNotification retorna false y dispara showError cuando hay errores", () => {
    const setErrors = jest.fn();
    const setTouched = jest.fn();

    const valid = validateFormWithNotification(
      { name: "", description: "" },
      setErrors,
      setTouched,
      [{ id: 1, name: "Laptops" }],
    );

    expect(valid).toBe(false);
    expect(setTouched).toHaveBeenCalledWith({ name: true, description: true });
    expect(showError).toHaveBeenCalledWith(
      "Por favor complete los campos correctamente",
    );
  });
});
