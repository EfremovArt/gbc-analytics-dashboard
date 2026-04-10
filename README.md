# GBC Analytics Dashboard

Мини-дашборд для тестового задания.

## Что реализовано

- Импорт `50` заказов из `mock_orders.json` в `RetailCRM`
- Синхронизация заказов из `RetailCRM` в `Supabase`
- Веб-дашборд на `Next.js` с графиком, метриками, разбивкой по источникам и городам
- `Telegram`-уведомления для заказов выше `50 000 ₸`
- `Vercel Cron` для регулярного запуска синхронизации

## Стек

- `Next.js 14`
- `TypeScript`
- `Supabase`
- `RetailCRM API v5`
- `Telegram Bot API`
- `Vercel`
- `Recharts`

## Структура проекта

- `app/` — веб-приложение и API-роуты
- `components/` — UI-компоненты дашборда
- `lib/` — интеграции, синхронизация, форматирование, агрегация
- `scripts/` — CLI-скрипты для импорта и синка
- `supabase/schema.sql` — схема таблицы `orders`
- `mock_orders.json` — тестовые заказы

## Переменные окружения

Создайте `.env.local` или `.env` на основе `.env.example`.

```env
RETAILCRM_BASE_URL=https://demo.retailcrm.pro
RETAILCRM_API_KEY=
RETAILCRM_SITE_CODE=store
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
HIGH_VALUE_THRESHOLD=50000
CRON_SECRET=
```

## Запуск локально

```bash
npm install
npm run dev
```

Приложение откроется на `http://localhost:3000`.

## Шаг 1. Подготовка сервисов

Нужно создать бесплатные аккаунты и получить ключи:

- `RetailCRM` demo account
- `Supabase` project
- `Vercel` account
- `Telegram Bot`

## Шаг 2. Загрузка заказов в RetailCRM

После заполнения `.env` выполните:

```bash
npm run import:retailcrm
```

Скрипт:

- читает `mock_orders.json`
- формирует payload для `RetailCRM`
- создаёт заказы через API

## Шаг 3. RetailCRM → Supabase

1. Откройте SQL Editor в `Supabase`
2. Выполните содержимое `supabase/schema.sql`
3. Запустите синхронизацию:

```bash
npm run sync:retailcrm
```

Скрипт:

- получает все заказы из `RetailCRM`
- нормализует поля
- делает `upsert` в таблицу `orders`
- отправляет `Telegram`-уведомления для заказов выше порога

## Шаг 4. Дашборд

Главная страница показывает:

- количество заказов
- суммарную выручку
- средний чек
- число заказов выше порога
- график выручки и количества заказов
- разбивку по источникам
- разбивку по городам
- последние заказы

Для JSON-данных доступны роуты:

- `GET /api/dashboard`
- `GET /api/health`

## Шаг 5. Telegram-бот

Укажите:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

После этого уведомления будут отправляться при синхронизации, если сумма заказа больше `HIGH_VALUE_THRESHOLD`.

Формат сообщения:

```text
💸 Новый крупный заказ
Заказ: #12345
Клиент: Айгуль Касымова
Сумма: 56 000 ₸
Город: Алматы
Источник: instagram
```

## Vercel Deploy

1. Импортируйте репозиторий в `Vercel`
2. Добавьте все переменные окружения
3. Задеплойте проект
4. Для автоматического синка используйте `vercel.json`
5. Вызывайте cron-роут `GET /api/cron/sync`

Если задан `CRON_SECRET`, запрос к `/api/cron/sync` должен содержать заголовок:

```text
Authorization: Bearer <CRON_SECRET>
```

## Что отдать как результат

После настройки внешних сервисов нужно приложить:

- ссылку на работающий дашборд на `Vercel`
- ссылку на GitHub-репозиторий
- скриншот `Telegram`-уведомления

## Какие промпты давал AI

Ниже набор промптов, которые использовались для сборки решения:

1. `Построй мини-дашборд заказов с Next.js, Supabase, RetailCRM и Telegram.`
2. `Напиши скрипт импорта mock_orders.json в RetailCRM API.`
3. `Сделай синхронизацию заказов из RetailCRM в Supabase с upsert.`
4. `Добавь Telegram-уведомления для заказов выше 50000 ₸.`
5. `Собери современный dashboard с графиком выручки и последних заказов.`
6. `Подготовь проект к деплою на Vercel и cron-синхронизации.`

## Где AI застрял и как это было решено

Проблемные места:

- формат запроса к `RetailCRM` для создания заказа
- необходимость сделать код совместимым и для `Next.js`, и для запуска `tsx`-скриптов
- необходимость не хранить данные только во фронтенде, а читать их из `Supabase`

Решения:

- выбран серверный поток: `RetailCRM -> Supabase -> Dashboard`
- для CLI-скриптов использованы относительные импорты в `lib/`
- уведомления вынесены в общий sync-слой, чтобы они работали и локально, и через `Vercel Cron`
- дашборд читает уже нормализованные данные из `Supabase`, а не напрямую из `mock_orders.json`


