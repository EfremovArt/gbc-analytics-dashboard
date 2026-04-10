import { getHighValueThreshold, isTelegramConfigured } from "./env";
import { fetchAllRetailCrmOrders } from "./retailcrm";
import { getSupabaseAdminClient } from "./supabase";
import { sendHighValueOrderNotification } from "./telegram";
import type { NormalizedOrderRecord, RetailCrmOrder } from "./types";

function toNumber(value: number | string | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function calculateOrderTotal(order: RetailCrmOrder): number {
  const directTotal = toNumber(order.totalSumm) ?? toNumber(order.summ);
  if (directTotal !== null) {
    return directTotal;
  }

  return (order.items ?? []).reduce((sum, item) => {
    const quantity = toNumber(item.quantity) ?? 0;
    const price = toNumber(item.initialPrice) ?? 0;
    return sum + quantity * price;
  }, 0);
}

function buildCustomerName(order: RetailCrmOrder): string {
  const fullName = [order.firstName, order.lastName].filter(Boolean).join(" ").trim();
  return fullName || "Без имени";
}

export function normalizeRetailCrmOrder(order: RetailCrmOrder): NormalizedOrderRecord | null {
  const retailcrmId = toNumber(order.id);
  if (retailcrmId === null) {
    return null;
  }

  const orderedAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const itemsCount = (order.items ?? []).reduce((sum, item) => sum + (toNumber(item.quantity) ?? 0), 0);

  return {
    retailcrm_id: retailcrmId,
    number: String(order.number ?? retailcrmId),
    external_id: order.externalId ? String(order.externalId) : null,
    status: order.status ?? "unknown",
    total: calculateOrderTotal(order),
    items_count: itemsCount,
    customer_name: buildCustomerName(order),
    phone: order.phone ?? null,
    email: order.email ?? null,
    city: order.delivery?.address?.city ?? null,
    address: order.delivery?.address?.text ?? null,
    order_method: order.orderMethod ?? null,
    order_type: order.orderType ?? null,
    source: (typeof order.source?.source === "string" && order.source.source.trim() !== ""
      ? order.source.source
      : typeof order.customFields?.utm_source === "string" && String(order.customFields.utm_source).trim() !== ""
        ? String(order.customFields.utm_source)
        : order.orderMethod ?? null),
    ordered_at: orderedAt.toISOString(),
    raw: order
  };
}

async function upsertOrders(records: NormalizedOrderRecord[]): Promise<void> {
  if (records.length === 0) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  const batchSize = 200;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const { error } = await supabase.from("orders").upsert(batch, {
      onConflict: "retailcrm_id"
    });

    if (error) {
      throw new Error(`Supabase upsert failed: ${error.message}`);
    }
  }
}

type NotificationCandidate = {
  retailcrm_id: number;
  number: string;
  customer_name: string;
  total: number;
  city: string | null;
  source: string | null;
};

async function notifyPendingHighValueOrders(threshold: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("retailcrm_id, number, customer_name, total, city, source")
    .gte("total", threshold)
    .is("telegram_notified_at", null)
    .order("ordered_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase notification query failed: ${error.message}`);
  }

  const candidates = (data ?? []) as NotificationCandidate[];

  if (!isTelegramConfigured()) {
    return {
      sent: 0,
      skipped: candidates.length
    };
  }

  let sent = 0;

  for (const order of candidates) {
    await sendHighValueOrderNotification({
      number: order.number,
      customerName: order.customer_name,
      total: order.total,
      city: order.city,
      source: order.source
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({ telegram_notified_at: new Date().toISOString() })
      .eq("retailcrm_id", order.retailcrm_id);

    if (updateError) {
      throw new Error(`Supabase notification update failed: ${updateError.message}`);
    }

    sent += 1;
  }

  return {
    sent,
    skipped: 0
  };
}

export async function syncRetailCrmToSupabase() {
  const retailCrmOrders = await fetchAllRetailCrmOrders();
  const normalizedOrders = retailCrmOrders
    .map(normalizeRetailCrmOrder)
    .filter((order): order is NormalizedOrderRecord => order !== null);

  await upsertOrders(normalizedOrders);

  const threshold = getHighValueThreshold();
  const notifications = await notifyPendingHighValueOrders(threshold);

  return {
    fetched: retailCrmOrders.length,
    synced: normalizedOrders.length,
    highValueThreshold: threshold,
    notificationsSent: notifications.sent,
    notificationsSkipped: notifications.skipped
  };
}
