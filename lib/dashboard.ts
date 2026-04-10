import { getHighValueThreshold, isSupabaseConfigured } from "./env";
import { formatCompactNumber, formatCurrency } from "./format";
import { getSupabaseAdminClient } from "./supabase";
import type { BreakdownItem, DashboardData, DashboardSeriesPoint, RecentOrder } from "./types";

type OrderRow = {
  retailcrm_id: number;
  number: string;
  total: number;
  items_count: number;
  customer_name: string;
  city: string | null;
  source: string | null;
  ordered_at: string;
  status: string;
};

function buildEmptyDashboardData(): DashboardData {
  const threshold = getHighValueThreshold();

  return {
    isConfigured: false,
    threshold,
    metrics: [
      { label: "Заказы в базе", value: "0", hint: "Подключите Supabase" },
      { label: "Выручка", value: formatCurrency(0), hint: "Нет данных" },
      { label: "Средний чек", value: formatCurrency(0), hint: "Нет данных" },
      { label: `Заказы выше ${formatCompactNumber(threshold)}`, value: "0", hint: "Нет данных" }
    ],
    revenueSeries: [],
    sourceBreakdown: [],
    cityBreakdown: [],
    recentOrders: []
  };
}

const SOURCE_LABELS: Record<string, string> = {
  "shopping-cart": "Корзина (сайт)",
  "phone": "Телефон",
  "one-click": "Купить в 1 клик",
  "missed-call": "Пропущенный звонок",
  "messenger": "Мессенджер",
  "instagram": "Instagram",
  "google": "Google",
  "tiktok": "TikTok",
  "direct": "Прямой переход",
  "referral": "Реферал"
};

function buildBreakdown(rows: OrderRow[], field: "source" | "city"): BreakdownItem[] {
  const map = new Map<string, BreakdownItem>();

  for (const row of rows) {
    const rawKey = row[field] ?? "Не указан";
    const label = field === "source" ? (SOURCE_LABELS[rawKey] ?? rawKey) : rawKey;
    const current = map.get(label) ?? { name: label, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += row.total;
    map.set(label, current);
  }

  return Array.from(map.values()).sort((left, right) => right.revenue - left.revenue);
}

function buildRevenueSeries(rows: OrderRow[]): DashboardSeriesPoint[] {
  const map = new Map<string, DashboardSeriesPoint>();

  for (const row of rows) {
    const date = row.ordered_at.slice(0, 10);
    const current = map.get(date) ?? { date, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += row.total;
    map.set(date, current);
  }

  return Array.from(map.values()).sort((left, right) => left.date.localeCompare(right.date));
}

function buildRecentOrders(rows: OrderRow[]): RecentOrder[] {
  return [...rows]
    .sort((left, right) => right.ordered_at.localeCompare(left.ordered_at))
    .slice(0, 8)
    .map((row) => ({
      retailcrmId: row.retailcrm_id,
      number: row.number,
      customerName: row.customer_name,
      total: row.total,
      city: row.city,
      source: row.source,
      orderedAt: row.ordered_at,
      status: row.status
    }));
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return buildEmptyDashboardData();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("retailcrm_id, number, total, items_count, customer_name, city, source, ordered_at, status")
    .order("ordered_at", { ascending: true });

  if (error) {
    throw new Error(`Supabase dashboard query failed: ${error.message}`);
  }

  const rows = ((data ?? []) as OrderRow[]).map((row) => ({
    ...row,
    total: Number(row.total ?? 0),
    items_count: Number(row.items_count ?? 0)
  }));
  const totalRevenue = rows.reduce((sum, row) => sum + row.total, 0);
  const threshold = getHighValueThreshold();
  const highValueOrders = rows.filter((row) => row.total >= threshold).length;

  return {
    isConfigured: true,
    threshold,
    metrics: [
      {
        label: "Заказы в базе",
        value: String(rows.length),
        hint: `${rows.length === 1 ? "1 заказ" : `${rows.length} заказов`} синхронизировано`
      },
      {
        label: "Выручка",
        value: formatCurrency(totalRevenue),
        hint: "Сумма всех заказов из Supabase"
      },
      {
        label: "Средний чек",
        value: formatCurrency(rows.length === 0 ? 0 : totalRevenue / rows.length),
        hint: "Средняя стоимость заказа"
      },
      {
        label: `Заказы выше ${formatCompactNumber(threshold)}`,
        value: String(highValueOrders),
        hint: "Используется для Telegram-уведомлений"
      }
    ],
    revenueSeries: buildRevenueSeries(rows),
    sourceBreakdown: buildBreakdown(rows, "source").slice(0, 6),
    cityBreakdown: buildBreakdown(rows, "city").slice(0, 6),
    recentOrders: buildRecentOrders(rows)
  };
}
