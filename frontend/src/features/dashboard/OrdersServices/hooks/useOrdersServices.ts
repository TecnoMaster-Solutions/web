"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AddOrderFileDto,
  AddProductToOrderDto,
  AssignTechniciansDto,
  CreateOrdersServiceDto,
  FinishOrderDto,
  OrderServiceDTO,
  OrdersServiceHistoryItem,
  ReprogramOrderDto,
} from "../types/ordersServices.types";
import {
  addOrderFile,
  addProductToOrderService,
  assignTechniciansToOrderService,
  createOrderService,
  deleteOrderService,
  fetchOrderServiceById,
  fetchOrderServiceHistory,
  fetchOrdersServices,
  finishOrderService,
  reprogramOrderService,
  removeOrderFileByIndex,
  removeOrderFileByUrl,
  removeProductFromOrderService,
  updateOrderService,
} from "../api/ordersServices.api";

type Mode = "admin" | "client";
type UpdateOrderServiceDto = Partial<OrderServiceDTO>;
type RemoveOrderFileDto = { url: string };

export function useOrdersServices(mode: Mode = "admin") {
  const [orders, setOrders] = useState<OrderServiceDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<OrderServiceDTO | null>(null);
  const [history, setHistory] = useState<OrdersServiceHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOrdersServices();
      setOrders(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadById = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const data = await fetchOrderServiceById(id);
      setSelected(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (payload: CreateOrdersServiceDto) => {
      setLoading(true);
      try {
        const created = await createOrderService(payload);
        await refresh();
        return created;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const update = useCallback(
    async (id: number, payload: UpdateOrderServiceDto) => {
      setLoading(true);
      try {
        const updated = await updateOrderService(id, payload);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        await deleteOrderService(id);
        if (selected?.ordersservicesid === id) setSelected(null);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh, selected?.ordersservicesid]
  );

  const addProduct = useCallback(
    async (id: number, dto: AddProductToOrderDto) => {
      setLoading(true);
      try {
        const updated = await addProductToOrderService(id, dto);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const removeProduct = useCallback(
    async (id: number, productId: number) => {
      setLoading(true);
      try {
        const updated = await removeProductFromOrderService(id, productId);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const assignTechnicians = useCallback(
    async (id: number, dto: AssignTechniciansDto) => {
      setLoading(true);
      try {
        const updated = await assignTechniciansToOrderService(id, dto);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const reprogram = useCallback(
    async (id: number, dto: ReprogramOrderDto) => {
      setLoading(true);
      try {
        const updated = await reprogramOrderService(id, dto);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const finish = useCallback(
    async (id: number, dto: FinishOrderDto) => {
      setLoading(true);
      try {
        const updated = await finishOrderService(id, dto);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const addFile = useCallback(
    async (id: number, dto: AddOrderFileDto) => {
      setLoading(true);
      try {
        const updated = await addOrderFile(id, dto);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const removeFileIndex = useCallback(
    async (id: number, index: number) => {
      setLoading(true);
      try {
        const updated = await removeOrderFileByIndex(id, index);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const removeFileUrl = useCallback(
    async (id: number, dto: RemoveOrderFileDto) => {
      setLoading(true);
      try {
        const updated = await removeOrderFileByUrl(id, dto.url);
        setSelected(updated);
        await refresh();
        return updated;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const openHistory = useCallback(async (orderId: number) => {
    setHistoryOpen(true);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const [order, hist] = await Promise.all([fetchOrderServiceById(orderId), fetchOrderServiceHistory(orderId)]);
      setSelected(order);
      setHistory(Array.isArray(hist) ? hist : []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    setHistory([]);
  }, []);

  const isAdmin = useMemo(() => mode === "admin", [mode]);

  return {
    isAdmin,
    orders,
    selected,
    loading,
    refresh,
    loadById,
    create,
    update,
    remove,
    addProduct,
    removeProduct,
    assignTechnicians,
    reprogram,
    finish,
    addFile,
    removeFileIndex,
    removeFileUrl,
    historyOpen,
    history,
    historyLoading,
    openHistory,
    closeHistory,
  };
}
