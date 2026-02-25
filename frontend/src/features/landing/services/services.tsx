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
import { APP_TOAST_ID } from "@/shared/utils/notifications";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ServicesProps {
  className?: string;
}

function extractClientId(user: any, profile: any): number {
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

function buildClientLabel(user: any, profile: any): string {
  const name = profile?.users?.name ?? profile?.name ?? user?.name ?? "";
  const lastname =
    profile?.users?.lastname ?? profile?.lastname ?? user?.lastname ?? "";
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
      try {
        const [list, types] = await Promise.all([
          fetchLandingServices({ page: 1, limit: 200, stateid: 1 }),
          fetchLandingServiceTypes(),
        ]);

        setServices(Array.isArray(list) ? list : []);
        setTypeNames(Array.isArray(types) ? types : []);
      } catch {
        setServices([]);
        setTypeNames([]);
      }
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
      <ToastContainer
        containerId={APP_TOAST_ID}
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

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
                const sid = Number((service as any)?.id);
                const safeServiceId = Number.isFinite(sid) && sid > 0 ? sid : 0;

                return (
                  <CardServices
                    key={(service as any).id ?? `${service.title}-${service.category}`}
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
