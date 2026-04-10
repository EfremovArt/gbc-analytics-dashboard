import { getRequiredEnv } from "./env";
import { formatCurrency } from "./format";

type TelegramOrderSummary = {
  number: string;
  customerName: string;
  total: number;
  city: string | null;
  source: string | null;
};

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getRequiredEnv("TELEGRAM_CHAT_ID");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Telegram request failed: ${payload}`);
  }
}

export async function sendHighValueOrderNotification(order: TelegramOrderSummary): Promise<void> {
  const message = [
    "💸 Новый крупный заказ",
    `Заказ: #${order.number}`,
    `Клиент: ${order.customerName}`,
    `Сумма: ${formatCurrency(order.total)}`,
    `Город: ${order.city ?? "Не указан"}`,
    `Источник: ${order.source ?? "Не указан"}`
  ].join("\n");

  await sendTelegramMessage(message);
}
