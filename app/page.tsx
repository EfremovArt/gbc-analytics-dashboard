import { DashboardChart } from "../components/dashboard-chart";
import { StatCard } from "../components/stat-card";
import { getDashboardData } from "../lib/dashboard";
import { formatCurrency, formatDateTime } from "../lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let errorMessage: string | null = null;
  const dashboard = await getDashboardData().catch((error: Error) => {
    errorMessage = error.message;
    return null;
  });

  const isConfigured = dashboard?.isConfigured ?? false;

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__eyebrow">RetailCRM · Supabase · Telegram · Vercel</span>
          <h1>GBC Analytics Dashboard</h1>
          <p>
            Мини-дашборд показывает динамику заказов, выручку, источники и последние покупки.
            Источником правды выступает таблица `orders` в Supabase, которая наполняется данными из
            RetailCRM.
          </p>
        </div>

        <aside className="hero__status">
          <div className={`status-pill ${isConfigured ? "status-pill--ok" : "status-pill--warn"}`}>
            {isConfigured ? "Supabase подключён" : "Нужно заполнить .env"}
          </div>
          <p className="footer-note">
            Telegram-уведомления срабатывают для заказов выше {(dashboard?.threshold ?? 50000).toLocaleString("ru-RU")} ₸.
          </p>
        </aside>
      </section>

      {errorMessage ? <div className="notice">Ошибка загрузки данных: {errorMessage}</div> : null}

      {!isConfigured ? (
        <div className="notice">
          Заполните переменные окружения из `.env.example`, создайте таблицу через `supabase/schema.sql`
          и запустите синхронизацию из RetailCRM. После этого дашборд начнёт отображать реальные заказы.
        </div>
      ) : null}

      <section className="metrics-grid">
        {(dashboard?.metrics ?? []).map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
        ))}
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Основная метрика</p>
              <h2 className="panel__title">Динамика выручки и заказов</h2>
            </div>
          </div>
          <DashboardChart data={dashboard?.revenueSeries ?? []} />
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Каналы продаж</p>
              <h2 className="panel__title">Источники заказов</h2>
            </div>
          </div>
          {dashboard && dashboard.sourceBreakdown.length > 0 ? (
            <div className="breakdown-list">
              {dashboard.sourceBreakdown.map((item) => (
                <div key={item.name} className="breakdown-item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.orders} заказов</span>
                  </div>
                  <strong>{formatCurrency(item.revenue)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Данные по источникам появятся после первой синхронизации.</div>
          )}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">География</p>
              <h2 className="panel__title">Топ городов по выручке</h2>
            </div>
          </div>
          {dashboard && dashboard.cityBreakdown.length > 0 ? (
            <div className="breakdown-list">
              {dashboard.cityBreakdown.map((item) => (
                <div key={item.name} className="breakdown-item">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.orders} заказов</span>
                  </div>
                  <strong>{formatCurrency(item.revenue)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Данные по городам появятся после первой синхронизации.</div>
          )}
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Автоматизация</p>
              <h2 className="panel__title">Как обновляются данные</h2>
            </div>
          </div>
          <div className="breakdown-list">
            <div className="breakdown-item">
              <div>
                <strong>1. Импорт в RetailCRM</strong>
                <span>`npm run import:retailcrm` загружает `mock_orders.json`</span>
              </div>
            </div>
            <div className="breakdown-item">
              <div>
                <strong>2. Синк в Supabase</strong>
                <span>`npm run sync:retailcrm` переносит заказы в таблицу `orders`</span>
              </div>
            </div>
            <div className="breakdown-item">
              <div>
                <strong>3. Telegram alert</strong>
                <span>При сумме выше порога отправляется сообщение в бот</span>
              </div>
            </div>
            <div className="breakdown-item">
              <div>
                <strong>4. Vercel cron</strong>
                <span>`/api/cron/sync` можно запускать по расписанию</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-card__header">
          <p className="panel__eyebrow">Последние заказы</p>
          <h2 className="table-card__title">Лента заказов</h2>
        </div>

        <div className="table-scroll">
          {dashboard && dashboard.recentOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Заказ</th>
                  <th>Клиент</th>
                  <th>Сумма</th>
                  <th>Город</th>
                  <th>Источник</th>
                  <th>Статус</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr key={order.retailcrmId}>
                    <td>#{order.number}</td>
                    <td>{order.customerName}</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{order.city ?? "—"}</td>
                    <td>{order.source ?? "—"}</td>
                    <td>
                      <span className="badge">{order.status}</span>
                    </td>
                    <td>{formatDateTime(order.orderedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">После первой синхронизации здесь появятся последние заказы.</div>
          )}
        </div>
      </section>
    </main>
  );
}
