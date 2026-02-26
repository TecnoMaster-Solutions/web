"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/shared/utils/apiClient";
import { showSuccess, showError } from "@/shared/utils/notifications";


interface CreateServiceModalProps {
    onClose: () => void;
    onSaved: (newService: any) => void;
}

export default function CreateServiceModal({ onClose, onSaved }: CreateServiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [types, setTypes] = useState<{ typeofserviceid: number; name: string }[]>([]);

    // Form
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(""); // Service doesn't have fixed price in backend, but user mockup has it?
    // Backend service entity: name, description, image, typeofserviceid, stateid. NO PRICE.
    // The mockup shows "Precio". Maybe user intends to set a default price?
    // Since backend doesn't store it, we can't save it. I'll disable or warn.

    const [typeId, setTypeId] = useState("");
    const [image, setImage] = useState("");

    useEffect(() => {
        // Load Service Types
        apiClient.get<any[]>("/services/types").then(data => {
            setTypes(data);
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async () => {
        if (!name || !typeId) {
            showError("Nombre y Categoría son obligatorios");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name,
                description,
                typeofserviceid: Number(typeId),
                image: image || "https://via.placeholder.com/150",
                stateid: 1 // Active
            };

            const newService = await apiClient.post("/services", payload);
            showSuccess("Servicio creado correctamente");
            onSaved(newService);
            onClose();
        } catch (err: any) {
            console.error(err);
            showError(err.message || "Error al crear servicio");
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

            <div>
                <label className="block text-sm font-medium mb-1">Precio Referencial</label>
                <input
                    type="number"
                    className="w-full p-2 border rounded-lg bg-gray-100"
                    value={price} onChange={e => setPrice(e.target.value)}
                    disabled
                    placeholder="No aplica (se define en venta)"
                    title="Los servicios no tienen precio fijo en el sistema"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Categoría *</label>
                <select
                    className="w-full p-2 border rounded-lg"
                    value={typeId} onChange={e => setTypeId(e.target.value)}
                >
                    <option value="">Seleccione...</option>
                    {types.map(t => (
                        <option key={t.typeofserviceid} value={t.typeofserviceid}>{t.name}</option>
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
                    Guardar
                </button>
            </div>
        </div>
    );
}