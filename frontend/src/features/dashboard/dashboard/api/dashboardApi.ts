const API_URL = "http://localhost:3001/dashboard";

const buildUrl = (path: string, year?: number) => {
  if (!year) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}year=${year}`;
};

export const dashboardApi = {
  // Ventas
  getSalesByYear: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/sales/year`, year));
    return res.json();
  },

  getTotalSales: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/sales/total`, year));
    return res.json();
  },

  getDailySalesByMonth: async (month: number, year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/sales/month/${month}`, year));
    return res.json();
  },

  // Compras
  getPurchasesByYear: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/purchases/year`, year));
    return res.json();
  },

  getTotalPurchases: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/purchases/total`, year));
    return res.json();
  },

  getDailyPurchasesByMonth: async (month: number, year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/purchases/month/${month}`, year));
    return res.json();
  },

  // Categorías
  getCategoryProducts: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/categories/products`, year));
    return res.json();
  },

  // Órdenes de servicio
  getOrdersByState: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/orders/state`, year));
    return res.json();
  },

  getTotalOrders: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/orders/total`, year));
    return res.json();
  },

  // Solicitudes de servicio
  getServiceRequestsByState: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/service-requests/state`, year));
    return res.json();
  },

  getTotalServiceRequests: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/service-requests/total`, year));
    return res.json();
  },

  // Clientes
  getClientsByYear: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/clients/year`, year));
    return res.json();
  },

  getTotalClients: async (year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/clients/total`, year));
    return res.json();
  },

  getDailyClientsByMonth: async (month: number, year?: number) => {
    const res = await fetch(buildUrl(`${API_URL}/clients/month/${month}`, year));
    console.log(res);
    
    return res.json();
  },
};
