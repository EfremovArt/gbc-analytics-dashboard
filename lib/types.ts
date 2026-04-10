export type MockOrderItem = {
  productName: string;
  quantity: number;
  initialPrice: number;
};

export type MockOrder = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  orderType: string;
  orderMethod: string;
  status: string;
  items: MockOrderItem[];
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  customFields?: Record<string, string | number | boolean | null>;
};

export type RetailCrmOrderItem = {
  quantity?: number | string;
  initialPrice?: number | string;
  productName?: string;
  offer?: {
    name?: string;
    displayName?: string;
  };
};

export type RetailCrmOrder = {
  id?: number | string;
  number?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  orderType?: string;
  orderMethod?: string;
  status?: string;
  totalSumm?: number | string;
  summ?: number | string;
  createdAt?: string;
  items?: RetailCrmOrderItem[];
  delivery?: {
    address?: {
      city?: string;
      text?: string;
    };
  };
  source?: {
    source?: string;
    medium?: string;
    campaign?: string;
    keyword?: string;
    content?: string;
  };
  customFields?: Record<string, string | number | boolean | null>;
};

export type RetailCrmListResponse = {
  success: boolean;
  orders?: RetailCrmOrder[];
  pagination?: {
    currentPage?: number;
    totalPageCount?: number;
  };
  errorMsg?: string;
  errors?: Record<string, string[] | string> | string[];
};

export type NormalizedOrderRecord = {
  retailcrm_id: number;
  number: string;
  external_id: string | null;
  status: string;
  total: number;
  items_count: number;
  customer_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  order_method: string | null;
  order_type: string | null;
  source: string | null;
  ordered_at: string;
  raw: RetailCrmOrder;
};

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardSeriesPoint = {
  date: string;
  orders: number;
  revenue: number;
};

export type BreakdownItem = {
  name: string;
  orders: number;
  revenue: number;
};

export type RecentOrder = {
  retailcrmId: number;
  number: string;
  customerName: string;
  total: number;
  city: string | null;
  source: string | null;
  orderedAt: string;
  status: string;
};

export type DashboardData = {
  isConfigured: boolean;
  threshold: number;
  metrics: DashboardMetric[];
  revenueSeries: DashboardSeriesPoint[];
  sourceBreakdown: BreakdownItem[];
  cityBreakdown: BreakdownItem[];
  recentOrders: RecentOrder[];
};
