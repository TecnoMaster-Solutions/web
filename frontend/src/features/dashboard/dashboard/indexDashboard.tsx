"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Colors from "@/shared/theme/colors";
import { YearlyGraph } from "./components/BarChar/YearlySalesGraph";
import { MonthlyGraph } from "./components/BarChar/monthlySalesGraph";
import { YearlySalesPurchasesGraph } from "./components/BarChar/YearlySalesPurchasesGraph";
import { MonthlySalesPurchasesGraph } from "./components/BarChar/MonthlySalesPurchasesGraph";
import {
  PieChartCategoryAndProducts,
  CategoryData,
} from "./components/PieChart/pieChart";
import { CustomBarChart } from "./components/BarChar/barChart";
import { dashboardApi } from "./api/dashboardApi";
import { MonthSelection } from "./components/BarChar/monthUtils";

type CategoryProductsResponse = {
  category: string;
  value: number | string | null;
};

const normalizeStateKey = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

const translateDashboardState = (value: string) => {
  const key = normalizeStateKey(value);
  if (key === "cancel") return "Cancelados";
  if (key === "finished" || key === "finish") return "Finalizados";
  if (key === "inprocess" || key === "in-process") return "En-proceso";
  if (key === "pendient") return "pendintes";
  return value;
};

function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const formatCOP = (value: number | string) =>
  Number(value ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });


export const IndexDashboard = () => {
  // ESTADOS
  const [salesYear, setSalesYear] = useState([]);
  const [totalSales, setTotalSales] = useState(0);

  const [purchasesYear, setPurchasesYear] = useState([]);
  const [totalPurchases, setTotalPurchases] = useState(0);

  const [categoryProducts, setCategoryProducts] = useState<CategoryData[]>([]);

  const [ordersState, setOrdersState] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);

  const [serviceRequestsState, setServiceRequestsState] = useState([]);
  const [totalServiceRequests, setTotalServiceRequests] = useState(0);

  const [clientsYear, setClientsYear] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears] = useState(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  });

  const [selectedMonthSalesPurchases, setSelectedMonthSalesPurchases] = useState<MonthSelection | null>(null);
  const [selectedMonthClients, setSelectedMonthClients] = useState<MonthSelection | null>(null);
  const [loading, setLoading] = useState(true);

  // CARGAR TODA LA DATA DEL DASHBOARD
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // VENTAS
        setSalesYear(await dashboardApi.getSalesByYear(selectedYear));
        setTotalSales((await dashboardApi.getTotalSales(selectedYear)).total);

        // COMPRAS
        setPurchasesYear(await dashboardApi.getPurchasesByYear(selectedYear));
        setTotalPurchases((await dashboardApi.getTotalPurchases(selectedYear)).total);

        // PRODUCTOS POR CATEGORÃA
        const rawCategoryProducts =
          (await dashboardApi.getCategoryProducts(selectedYear)) as CategoryProductsResponse[];
        setCategoryProducts(
          rawCategoryProducts.map(({ category, value }) => ({
            category,
            value: Number(value ?? 0),
          }))
        );

        // Ã“RDENES
        const rawOrdersState = await dashboardApi.getOrdersByState(selectedYear);
        setOrdersState(
          (rawOrdersState ?? []).map((item: any) => ({
            ...item,
            state: typeof item?.state === "string" ? translateDashboardState(item.state) : item?.state,
          }))
        );
        setTotalOrders((await dashboardApi.getTotalOrders(selectedYear)).total);

        // SOLICITUDES
        const rawServiceRequestsState = await dashboardApi.getServiceRequestsByState(selectedYear);
        setServiceRequestsState(
          (rawServiceRequestsState ?? []).map((item: any) => ({
            ...item,
            state: typeof item?.state === "string" ? translateDashboardState(item.state) : item?.state,
          }))
        );
        setTotalServiceRequests((await dashboardApi.getTotalServiceRequests(selectedYear)).total);

        // CLIENTES
        setClientsYear(await dashboardApi.getClientsByYear(selectedYear));
        setTotalClients((await dashboardApi.getTotalClients(selectedYear)).total);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [selectedYear]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(event.target.value);
    setSelectedYear(year);
    setSelectedMonthSalesPurchases(null);
    setSelectedMonthClients(null);
  };

  return (
    <div className="w-full h-screen p-4">
      {loading && <Loader />}

      <div className="flex w-full justify-end mb-4">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
          <label htmlFor="year-selector" className="text-sm font-semibold text-gray-700">
            Año
          </label>
          <select
            id="year-selector"
            value={selectedYear}
            onChange={handleYearChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-red-200"
          >
            {availableYears.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRIMERA FILA: MÃ‰TRICAS PRINCIPALES */}
      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
        {/* Ventas */}
        <div className="p-3 w-full sm:w-[calc(50%-1rem)] md:w-[calc(25%-1rem)]">
          <div className="bg-[#F4F4F4] rounded-lg p-5 shadow-md h-full">
            <div className="bg-[#B20000] text-white rounded-lg p-4 sm:p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 min-h-10">
                <h2 className="text-sm sm:text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  Ventas
                </h2>
                <Image src="/icons/cash-stack.svg" alt="Ventas" width={32} height={32} className="w-8 h-8 object-contain filter brightness-0 invert" />
              </div>
              <p className="text-lg sm:text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{formatCOP(totalSales)}</p>
            </div>
          </div>
        </div>

        {/* Compras */}
        <div className="p-3 w-full sm:w-[calc(50%-1rem)] md:w-[calc(25%-1rem)]">
          <div className="bg-[#F4F4F4] rounded-lg p-5 shadow-md h-full">
            <div className="bg-[#B20000] text-white rounded-lg p-4 sm:p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 min-h-10">
                <h2 className="text-sm sm:text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  Compras
                </h2>
                <Image src="/icons/cart2.svg" alt="Compras" width={32} height={32} className="w-8 h-8 object-contain filter brightness-0 invert" />
              </div>
              <p className="text-lg sm:text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{formatCOP(totalPurchases)}</p>
            </div>
          </div>
        </div>

        {/* Solicitudes de servicio */}
        <div className="p-3 w-full sm:w-[calc(50%-1rem)] md:w-[calc(25%-1rem)]">
          <div className="bg-[#F4F4F4] rounded-lg p-5 shadow-md h-full">
            <div className="bg-[#B20000] text-white rounded-lg p-4 sm:p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 min-h-10">
                <h2 className="text-sm sm:text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  Solicitud de servicio
                </h2>
                <Image src="/icons/calendar.svg" alt="SolicitudServicio" width={32} height={32} className="w-8 h-8 object-contain filter brightness-0 invert" />
              </div>
              <p className="text-lg sm:text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{totalServiceRequests}</p>
            </div>
          </div>
        </div>

        {/* Ã“rdenes */}
        <div className="p-3 w-full sm:w-[calc(50%-1rem)] md:w-[calc(25%-1rem)]">
          <div className="bg-[#F4F4F4] rounded-lg p-5 shadow-md h-full">
            <div className="bg-[#B20000] text-white rounded-lg p-4 sm:p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 min-h-10">
                <h2 className="text-sm sm:text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                  Orden de servicio
                </h2>
                <Image src="/icons/box.svg" alt="Ã“rdenes" width={32} height={32} className="w-8 h-8 object-contain filter brightness-0 invert" />
              </div>
              <p className="text-lg sm:text-2xl font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{totalOrders}</p>
            </div>
          </div>
        </div>
      </div>
      {/* SEGUNDA FILA: GRÁFICA COMBINADA DE VENTAS & COMPRAS */}
      <div className="flex flex-wrap w-full h-auto mt-4">
        <div className="p-2 w-full">
          <div className="bg-[#F4F4F4] rounded-lg p-6 shadow-md h-full">
            <div className="bg-white rounded-lg p-6 flex flex-col h-full">
              {!selectedMonthSalesPurchases ? (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    Ventas: {formatCOP(totalSales)} | Compras: {formatCOP(totalPurchases)}
                  </h2>
                  <YearlySalesPurchasesGraph
                    salesData={salesYear}
                    purchasesData={purchasesYear}
                    onMonthClick={setSelectedMonthSalesPurchases}
                    isCurrency={true}
                  />
                </>
              ) : (
                <MonthlySalesPurchasesGraph
                  month={selectedMonthSalesPurchases?.label ?? ""}
                  monthNumber={selectedMonthSalesPurchases?.value}
                  salesData={salesYear}
                  purchasesData={purchasesYear}
                  onBack={() => setSelectedMonthSalesPurchases(null)}
                  isCurrency={true}
                  year={selectedYear}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TERCERA FILA: CATEGORÃAS, Ã“RDENES Y SOLICITUDES */}
      <div className="flex flex-wrap lg:flex-nowrap gap-4 w-full h-auto mt-6">
        {/* CategorÃ­as */}
        <div className="p-2 w-full md:w-[35%]">
          <div className="bg-[#F4F4F4] rounded-lg p-6 shadow-md h-full">
            <div className="bg-white rounded-lg p-6 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4">Productos por categorí­a</h2>
              <div className="h-[320px]">
                <PieChartCategoryAndProducts data={categoryProducts} />
              </div>
            </div>
          </div>
        </div>

        {/* Ã“rdenes */}
        <div className="p-2 w-full md:w-[35%]">
          <div className="bg-[#F4F4F4] rounded-lg p-6 shadow-md h-full">
            <div className="bg-white rounded-lg p-6 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4">Orden de servicio</h2>
              <div className="h-[320px]">
                <CustomBarChart
                  data={ordersState}
                  xKey="state"
                  bars={[
                    {
                      dataKey: "value",
                      color: Colors.graphic.linePrimary,
                      radius: [0, 0, 8, 8],
                    },
                  ]}
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Solicitudes */}
        <div className="p-2 w-full md:w-[35%]">
          <div className="bg-[#F4F4F4] rounded-lg p-6 shadow-md h-full">
            <div className="bg-white rounded-lg p-6 flex flex-col h-full">
              <h2 className="text-xl font-bold mb-4">Solicitud de servicio</h2>
              <div className="h-[320px]">
                <CustomBarChart
                  data={serviceRequestsState}
                  xKey="state"
                  bars={[
                    {
                      dataKey: "value",
                      color: Colors.graphic.linePrimary,
                      radius: [0, 0, 8, 8],
                    },
                  ]}
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUARTA FILA: CLIENTES */}
      <div className="p-2 w-full mt-6 mb-10">
        <div className="bg-[#F4F4F4] rounded-lg p-6 shadow-md h-full">
          <div className="bg-white rounded-lg p-6 flex flex-col h-full">
            {!selectedMonthClients ? (
              <>
                <h2 className="text-xl font-bold mb-4">Clientes: {totalClients}</h2>
                <YearlyGraph title="Clientes" data={clientsYear} onMonthClick={setSelectedMonthClients} isCurrency={false} />
              </>
            ) : (
              <MonthlyGraph
                key={`clients-${selectedYear}-${selectedMonthClients?.value}`}
                title="Clientes"
                month={selectedMonthClients?.label ?? ""}
                monthNumber={selectedMonthClients?.value}
                data={clientsYear}
                onBack={() => setSelectedMonthClients(null)}
                isCurrency={false}
                year={selectedYear}
              />

            )}
          </div>
        </div>
      </div>
    </div>
  );
};


