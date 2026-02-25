interface IRoutes {
  path: string;
  landing: {
    home: string;
    products: string;
    services: string;
    about: string;
    contact: string;
    cart: string;
    trajectory: string;
  };
  auth: {
    login: string;
    register: string;
    forgotPassword: string;
    resetPassword: string;
  };
  dashboard: {
    newClient: any;
    newService: any;
    main: string;
    users: string;
    products: string;
    productsCategories: string;
    roles: string;
    services: string;
    technicians: string;
    appointments: string;
    purchases: string;
    purchasesGraph: string;
    purchasesOrders: string;
    suppliers: string;
    sales: string;
    clients: string;
    requestsServices: string;
    ordersServices: string;
    quotes: string;
    settings: string;
    profile: string;
    orders: string;
  };

  quotes:{
    register: string
  }
  notFound: string;
}
export const routes: IRoutes = {
  path: "/",
  landing: {
    home: "/home",
    products: "/landing/products",
    services: "/landing/services",
    about: "/landing/about",
    contact: "/landing/contact",
    cart: "/cart",
    trajectory: "/landing/trajectory",
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  dashboard: {
    main: "/dashboard",
    users: "/dashboard/users",
    products: "/dashboard/products",
    productsCategories: "/dashboard/products/categories",
    roles: "/dashboard/roles",
    services: "/dashboard/services",
    technicians: "/dashboard/technicians",
    appointments: "/dashboard/appointments",
    purchases: "/dashboard/purchases",
    purchasesGraph: "/dashboard/purchases/graph",
    purchasesOrders: "/dashboard/purchases/orders",
    suppliers: "/dashboard/suppliers",
    sales: "/dashboard/sales",
    clients: "/dashboard/clients",
    requestsServices: "/dashboard/requests",
    ordersServices: "/dashboard/orders-services",
    orders: "/dashboard/orders",
    quotes: "/dashboard/quotes",
    settings: "/dashboard/settings",
    profile: "/dashboard/profile",
    newClient: undefined,
    newService: undefined
  },
  quotes: {
    register: "/quotes/register"
  },
  notFound: "/404",
};
