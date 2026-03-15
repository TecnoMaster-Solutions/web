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
import {
  fetchLandingServices,
  fetchLandingServiceTypes,
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
  const currentUser = user as AuthUserLike;
  const currentProfile = profile as AuthProfileLike;
  const name =
    currentProfile?.users?.name ??
    currentProfile?.name ??
    currentUser?.name ??
    "";
  const lastname =
    currentProfile?.users?.lastname ??
    currentProfile?.lastname ??
    currentUser?.lastname ??
    "";
  return [name, lastname].filter(Boolean).join(" ").trim();
}

export default function ServicesLanding({ className = "" }: ServicesProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [typeNames, setTypeNames] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const { user, profile } = useAuth();

  const clientId = useMemo(() => extractClientId(user, profile), [user, profile]);
  const clientLabel = useMemo(() => buildClientLabel(user, profile), [user, profile]);

  useEffect(() => {
    const load = async () => {
      const [servicesResult, typesResult] = await Promise.allSettled([
        fetchLandingServices({ page: 1, limit: 100, stateid: 1 }),
        fetchLandingServiceTypes(),
      ]);

      setServices(
        servicesResult.status === "fulfilled" && Array.isArray(servicesResult.value)
          ? servicesResult.value
          : []
      );
      setTypeNames(
        typesResult.status === "fulfilled" && Array.isArray(typesResult.value)
          ? typesResult.value
          : []
      );
    };

    load();
  }, []);

  const filters: FilterItem[] = useMemo(() => {
    const unique = Array.from(new Set(typeNames)).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );

    return [{ id: "all", label: "Todos" }, ...unique.map((n) => ({ id: n, label: n }))];
  }, [typeNames]);

  const { selectedFilters, handleToggleFilter, searchTerm, setSearchTerm, filteredServices } =
    useServices(services);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilters, services]);

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

  const displayedServices = filteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              {displayedServices.map((service) => {
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
