"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/shared/utils/apiClient";
import { showSuccess, showError } from "@/shared/utils/notifications";
import { Loader } from "@/shared/components/loader";
import Colors from "@/shared/theme/colors";

interface CreateProductModalProps {
    onClose: () => void;
    onSaved: (newProduct: any) => void;
}

export default function CreateProductModal({ onClose, onSaved }: CreateProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    // Form States
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [image, setImage] = useState("");
    const [supplierCategory, setSupplierCategory] = useState("General"); // Default or input?

    useEffect(() => {
        // Load categories
        apiClient.get<any[]>("/products-categories").then(data => {
            // Assuming data is array of {id, name}
            setCategories(data);
        }).catch(err => console.error("Error loading categories", err));
    }, []);

    const handleSubmit = async () => {
        if (!name || !price || !stock || !categoryId) {
            showError("Complete los campos obligatorios (*)");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                productname: name,
                productdescription: description,
                productpriceofsale: Number(price),
                productstock: Number(stock), // Note: create dto might not take stock if it's derived? 
                // Backend `create` DTO: 
                // productname, productdescription, categoryid, suppliercategory, image, productcode, productpriceofsale, productpriceofsupplier, isactive
                // It DOES NOT seem to take `productstock`. Stock is usually managed via Purchases/Orders.
                // BUT user screenshot shows "Cantidad".
                // If backend doesn't support initial stock in create, we might need to separate or ignore.
                // Checking products.service.ts create method:
                /*
                  const entity = this.productsRepo.create({
                    productname: dto.productname.trim(),
                    ...
                    productpriceofsale: dto.productpriceofsale ?? null,
                    ...
                  });
                */
                // No stock field in create entity logic.
                // I will ignore stock for now or send it if DTO allows, but likely it won't be saved.
                // I will warn user "Stock must be added via Purchase" OR just don't send it if backend ignores.

                categoryid: Number(categoryId),
                suppliercategory: supplierCategory,
                image: image || "https://via.placeholder.com/150",
                productpriceofsupplier: 0, // Default
                isactive: true
            };

            const newProduct = await apiClient.post("/products", payload);
            showSuccess("Producto creado exitosamente");
            onSaved(newProduct);
            onClose();
        } catch (err: any) {
            console.error(err);
            showError(err.message || "Error al crear producto");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 p-2">
            <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                    className="w-full p-2 border rounded-lg"
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ingrese nombre"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                    className="w-full p-2 border rounded-lg"
                    value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Ingrese descripción"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Precio Venta *</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        value={price} onChange={e => setPrice(e.target.value)}
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Stock Inicial</label>
                    <input
                        type="number"
                        className="w-full p-2 border rounded-lg bg-gray-100"
                        value={stock} onChange={e => setStock(e.target.value)}
                        placeholder="Gestionado en Compras"
                        disabled
                        title="El stock se gestiona mediante compras o ajustes"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Categoría *</label>
                <select
                    className="w-full p-2 border rounded-lg"
                    value={categoryId} onChange={e => setCategoryId(e.target.value)}
                >
                    <option value="">Seleccione...</option>
                    {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Imagen URL</label>
                <input
                    className="w-full p-2 border rounded-lg"
                    value={image} onChange={e => setImage(e.target.value)}
                    placeholder="http://..."
                />
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-lg">Cancelar</button>
                <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2">
                    {loading && <Loader size="sm" />}
                    Guardar
                </button>
            </div>
        </div>
    );
}