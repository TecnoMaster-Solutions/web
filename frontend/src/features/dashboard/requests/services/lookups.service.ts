import { api } from "@/lib/api";
import type { Option } from "@/features/dashboard/requests/types/option.types";

type ServiceApi = {
  serviceid?: number;
  id?: number;
  name?: string;
  servicename?: string;
  typeofserviceid?: number;
  typeOfServiceId?: number;
  typeofservice?: {
    typeofserviceid?: number;
    name?: string;
    typeofservicename?: string;
    code?: string;
    serviceType?: string;
  } | null;
  typeofservicename?: string;
  serviceType?: string;
  servicetype?: string;
};

type CustomerApi = {
  customerid?: number;
  id?: number;
  documentnumber?: string | null;
  documentNumber?: string | null;
  document_number?: string | null;
  users?: {
    name?: string | null;
    lastname?: string | null;
    documentnumber?: string | null;
    documentNumber?: string | null;
    document_number?: string | null;
  } | null;
};

function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload) return (payload as any).data as T;
  return payload as T;
}

function unwrapList<T>(payload: any): T[] {
  const data = unwrap<any>(payload);
  return Array.isArray(data) ? (data as T[]) : [];
}

export async function getServiceOptions(): Promise<
  (Option & { typeofserviceid?: number | null; typeofservicename?: string | null; serviceTypeCode?: string | null })[]
> {
  const res = await api.get<any>("/services");
  const list = unwrapList<ServiceApi>(res.data);

  return list
    .map((s) => {
      const id = Number(s.serviceid ?? s.id);
      if (!Number.isFinite(id) || id <= 0) return null;

      const label = String(s.name ?? s.servicename ?? `Servicio #${id}`).trim();

      const rawTypeId =
        s.typeofserviceid ??
        s.typeOfServiceId ??
        s.typeofservice?.typeofserviceid ??
        null;

      const typeofserviceid =
        rawTypeId != null && Number.isFinite(Number(rawTypeId)) ? Number(rawTypeId) : null;

      const rawTypeName =
        s.typeofservicename ??
        s.typeofservice?.typeofservicename ??
        s.typeofservice?.name ??
        null;

      const typeofservicename = rawTypeName != null ? String(rawTypeName).trim() : null;

      const serviceTypeCode =
        s.serviceType ??
        s.servicetype ??
        s.typeofservice?.serviceType ??
        s.typeofservice?.code ??
        null;

      return {
        id,
        label,
        typeofserviceid,
        typeofservicename,
        serviceTypeCode: serviceTypeCode != null ? String(serviceTypeCode).trim() : null,
      } as Option & {
        typeofserviceid?: number | null;
        typeofservicename?: string | null;
        serviceTypeCode?: string | null;
      };
    })
    .filter(Boolean) as (Option & {
    typeofserviceid?: number | null;
    typeofservicename?: string | null;
    serviceTypeCode?: string | null;
  })[];
}

export async function getCustomerOptions(): Promise<Option[]> {
  const res = await api.get<any>("/customers", {
    params: { includeRelations: true },
  });
  const list = unwrapList<CustomerApi>(res.data);

  return list
    .map((c) => {
      const id = Number(c.customerid ?? c.id);
      if (!Number.isFinite(id) || id <= 0) return null;
      const u = c.users ?? {};
      const label = [u.name, u.lastname].filter(Boolean).join(" ").trim() || `Cliente #${id}`;
      const rawDoc =
        u.documentnumber ??
        u.documentNumber ??
        u.document_number ??
        c.documentnumber ??
        c.documentNumber ??
        c.document_number ??
        null;
      const documentnumber = rawDoc != null ? String(rawDoc).trim() : null;
      const searchText = [label, documentnumber].filter(Boolean).join(" ");
      return { id, label, documentnumber, searchText } as Option;
    })
    .filter(Boolean) as Option[];
}
