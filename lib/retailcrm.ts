import { getRequiredEnv } from "./env";
import type { MockOrder, RetailCrmListResponse, RetailCrmOrder } from "./types";

function getRetailCrmBaseUrl(): string {
  return getRequiredEnv("RETAILCRM_BASE_URL").replace(/\/+$/, "");
}

function getRetailCrmApiKey(): string {
  return getRequiredEnv("RETAILCRM_API_KEY");
}

function getRetailCrmSiteCode(): string {
  return getRequiredEnv("RETAILCRM_SITE_CODE");
}

function buildApiUrl(path: string, query?: Record<string, string | number | undefined>): URL {
  const url = new URL(`${getRetailCrmBaseUrl()}/api/v5${path}`);
  url.searchParams.set("apiKey", getRetailCrmApiKey());

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
}

function formatRetailCrmError(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "RetailCRM request failed";
  }

  const maybePayload = payload as RetailCrmListResponse;
  const messages: string[] = [];

  if (maybePayload.errorMsg) {
    messages.push(maybePayload.errorMsg);
  }

  if (Array.isArray(maybePayload.errors)) {
    messages.push(maybePayload.errors.join("; "));
  } else if (maybePayload.errors) {
    const details = Object.entries(maybePayload.errors)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }

        return `${key}: ${value}`;
      })
      .join("; ");

    if (details) {
      messages.push(details);
    }
  }

  return messages.join(" | ") || "RetailCRM request failed";
}

async function retailCrmRequest<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    query?: Record<string, string | number | undefined>;
    form?: Record<string, string>;
  }
): Promise<T> {
  const url = buildApiUrl(path, options?.query);
  const response = await fetch(url, {
    method: options?.method ?? "GET",
    headers: options?.form
      ? {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        }
      : {
          Accept: "application/json"
        },
    body: options?.form ? new URLSearchParams(options.form).toString() : undefined,
    cache: "no-store"
  });

  const payload = (await response.json()) as T & { success?: boolean };

  if (!response.ok || payload.success === false) {
    throw new Error(formatRetailCrmError(payload));
  }

  return payload;
}

function buildRetailCrmOrderPayload(order: MockOrder, externalId: string) {
  return {
    externalId,
    firstName: order.firstName,
    lastName: order.lastName,
    phone: order.phone,
    email: order.email,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      initialPrice: item.initialPrice,
      purchasePrice: item.initialPrice,
      offer: {
        name: item.productName,
        displayName: item.productName
      }
    })),
    delivery: {
      address: {
        city: order.delivery?.address?.city ?? "",
        text: order.delivery?.address?.text ?? ""
      }
    },
    customFields: order.customFields ?? {}
  };
}

export async function createRetailCrmOrder(order: MockOrder, externalId: string): Promise<unknown> {
  return retailCrmRequest("/orders/create", {
    method: "POST",
    form: {
      site: getRetailCrmSiteCode(),
      order: JSON.stringify(buildRetailCrmOrderPayload(order, externalId))
    }
  });
}

export async function fetchRetailCrmOrdersPage(page: number, limit = 100): Promise<RetailCrmListResponse> {
  return retailCrmRequest<RetailCrmListResponse>("/orders", {
    query: {
      page,
      limit,
      site: getRetailCrmSiteCode(),
      include: "customFields"
    }
  });
}

export async function fetchAllRetailCrmOrders(limit = 100): Promise<RetailCrmOrder[]> {
  const orders: RetailCrmOrder[] = [];
  let page = 1;

  while (true) {
    const response = await fetchRetailCrmOrdersPage(page, limit);
    const pageOrders = response.orders ?? [];
    orders.push(...pageOrders);

    const totalPages = response.pagination?.totalPageCount ?? page;
    if (page >= totalPages || pageOrders.length === 0) {
      break;
    }

    page += 1;
  }

  return orders;
}
