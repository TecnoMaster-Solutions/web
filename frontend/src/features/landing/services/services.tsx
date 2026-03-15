"use client";

import React, { useEffect, useMemo, useState } from "react";
import Nav from "../layout/Nav";
import Footer from "../layout/Footer";
import Banner from "./components/Banner";
import LayoutServicios from "./components/LayoutServicios";
import FilterBar, { FilterItem } from "./components/FilterBar";
import SearchBar from "./components/SearchBar";
import CardServices from "./components/CardServices";
import Pagination from "./components/Pagination";
import { useServices, Service } from "./hooks/useServices";
import { useDebounce } from "./hooks/useDebounce";
import {
  fetchLandingServices,
  fetchLandingServiceTypes,
  ServiceTypeFromApi,
} from "./api/servicesLanding.api";
import { useAuth } from "@/features/auth/authcontext";

interface ServicesProps {
  className?: string;
}

type AuthUserLike = {
  customerid?: number | null;
  clientId?: number | null;
  clientid?: number | null;
  customer?: { customerid?: number | null } | null;
  name?: string | null;
  lastname?: string | null;
} | null;

type AuthProfileLike = {
  customerid?: number | null;
  clientId?: number | null;
  clientid?: number | null;
  customer?: { customerid?: number | null } | null;
  name?: string | null;
  lastname?: string | null;
  users?: {
    name?: string | null;
    lastname?: string | null;
  } | null;
} | null;

function extractClientId(user: AuthUserLike, profile: AuthProfileLike): number {
  const candidates = [
    user?.customerid,
    user?.clientId,
    user?.clientid,
    user?.customer?.customerid,
    profile?.customerid,
    profile?.clientId,
    profile?.clientid,
    profile?.customer?.customerid,
  ];

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}

function buildClientLabel(user: AuthUserLike, profile: AuthProfileLike): string {
  const name = profile?.users?.name ?? profile?.name ?? user?.name ?? "";
  const lastname = profile?.users?.lastname ?? profile?.lastname ?? user?.lastname ?? "";
  return [name, lastname].filter(Boolean).join(" ").trim();
}

export default function ServicesLanding({ className = "" }: ServicesProps) {
  const { selectedFilters, handleToggleFilter, searchTerm, setSearchTerm } = useServices();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeFromApi[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  const { user, profile } = useAuth();
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const clientId = useMemo(() => extractClientId(user, profile), [user, profile]);
  const clientLabel = useMemo(() => buildClientLabel(user, profile), [user, profile]);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await fetchLandingServiceTypes();
        setServiceTypes(Array.isArray(types) ? types : []);
      } catch {
        setServiceTypes([]);
      }
    };

    loadTypes();
  }, []);

  const filters: FilterItem[] = useMemo(() => {
    const unique = Array.from(
      new Map(
        serviceTypes.map((t) => [
          Number(t.typeofserviceid),
          {
            id: String(t.typeofserviceid),
            label: (t.name ?? "").trim(),
          },
        ]),
      ).values(),
    ).sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

    return [{ id: "all", label: "Todos" }, ...unique];
  }, [serviceTypes]);

  const selectedTypeId = useMemo(() => {
    const valid = selectedFilters.find((f) => f !== "all");
    const n = Number(valid);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [selectedFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedTypeId]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchLandingServices({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm.trim() || undefined,
          typeofserviceid: selectedTypeId,
          stateid: 1,
        });

        setServices(Array.isArray(response.data) ? response.data : []);
        setTotalPages(Number(response.meta?.totalPages ?? 1));
      } catch {
        setServices([]);
        setTotalPages(1);
      }
    };

    load();
  }, [currentPage, debouncedSearchTerm, selectedTypeId]);

  return (
    <div className={className}>
      <Nav />
      <Banner />

      <LayoutServicios>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <FilterBar
            filters={filters}
            selectedFilters={selectedFilters}
            handleToggle={handleToggleFilter}
            className="w-full lg:w-64 flex-shrink-0"
          />

          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const sid = Number(service.id);
                const safeServiceId = Number.isFinite(sid) && sid > 0 ? sid : 0;

                return (
                  <CardServices
                    key={service.id ?? `${service.title}-${service.category}`}
                    title={service.title}
                    description={service.description || "Sin descripción"}
                    category={service.category}
                    image={service.image}
                    serviceId={safeServiceId}
                    clientId={clientId}
                    clientLabel={clientLabel || undefined}
                  />
                );
              })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      </LayoutServicios>

      <Footer />
    </div>
  );
}
