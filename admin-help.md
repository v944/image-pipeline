# Админка Image Pipeline — шпаргалка

Базовый URL: `https://imagepipeline.art` (локально — `http://localhost:5173` + `vercel dev` для API).

Все админ-эндпоинты закрыты ключом **`ADMIN_KEY`** (Vercel → Project → Settings → Environment Variables).
Ключ передаётся либо query-параметром `?key=ВАШ_КЛЮЧ`, либо заголовком `x-admin-key: ВАШ_КЛЮЧ` (лучше — заголовком, ключ не светится в логах).

> Во всех примерах ниже замените `YOUR_ADMIN_KEY` на реальный ключ.

---

## 1. Статистика — «сколько оплат и подписчиков»

```
GET https://imagepipeline.art/api/stats?key=YOUR_ADMIN_KEY
```

Что показывает (JSON):

| Поле | Смысл |
|------|-------|
| `payments.total` / `totalUsdt` / `byPlan` | Число оплат, сумма в USDT, разбивка pro/lifetime |
| `payments.recent` | Последние 20 платежей: TxID, план, сумма, дата |
| `subscribers` | Подтверждённые подписчики рассылки |
| `pendingSubscriptions` | Кликнули «подписаться», но не подтвердили email |
| `sessionsByTier` | Сессии free / pro / lifetime |
| `abuseEvents` | Срабатывания rate-limit'ов (подозрительная активность) |

Можно просто открыть в браузере и добавить в закладки.

## 2. Список подписчиков

```
GET https://imagepipeline.art/api/subscribers?key=YOUR_ADMIN_KEY
```

Возвращает `total` и массив `{ email, subscribedAt }` (новые сверху).

## 3. Рассылка по подписчикам

```
POST https://imagepipeline.art/api/newsletter
x-admin-key: YOUR_ADMIN_KEY
Content-Type: application/json

{ "subject": "Тема письма", "html": "<p>Тело в HTML</p>" }
```

- Уходит всем подтверждённым подписчикам батчами по 10.
- Ссылка отписки приклеивается автоматически (персональная, одноразовая) — вручную добавлять не нужно.
- Ответ: `{ sent, total, errors }`.
- ⚠️ Проверяйте `errors` — там будут, например, заблокированные адреса.

curl-пример:

```bash
curl -X POST "https://imagepipeline.art/api/newsletter" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Update: Blur & Sharpen nodes","html":"<p>We shipped new nodes!</p>"}'
```

## 4. Крон-очистка KV

```
GET https://imagepipeline.art/api/cleanup
Authorization: Bearer YOUR_CRON_SECRET
```

- Вызывается Vercel Cron ежедневно в 03:00 (настройка в `vercel.json`).
- Чистит протухшие abuse-логи (>30 дней) и маркеры прошлых запусков.
- Возвращает статистику KV (сессии, активации, подписчики). Можно дернуть вручную для сверки со `/api/stats`.

## 5. Как устроены подписки (для понимания картины)

1. Пользователь вводит email на лендинге → `POST /api/subscribe` → создаётся письмо-подтверждение (действует 24 ч).
2. Пользователь жмёт ссылку в письме → `GET /api/subscribe?token=...` → email попадает в список `subscribers`.
3. В каждом письме рассылки — ссылка `GET /api/unsubscribe?token=...`, удаляющая email из списка.
4. Без `RESEND_API_KEY` подтверждение отключается и подписка сразу активна (fallback).

## 6. Платежи

- Каждый подтверждённый платёж присылает письмо на **`ADMIN_EMAIL`** (сумма, план, TxID, кнопка «View on Tronscan»). Если писем нет при живом трафике — проверьте, что `ADMIN_EMAIL` задан в Vercel.
- Активации хранятся в KV 30 дней (`crypto:activation:*`) — это и есть источник статистики `/api/stats`.
- Пользователь, потерявший план (почистил localStorage), восстанавливает его сам: `/pricing` → блок «Уже оплатили?» → вводит email → получает одноразовую ссылку. Работает, если email был указан при оплате.
- При проблемах с оплатой (неверная сумма/сеть) — просите TxID и ищите перевод вручную на tronscan.org по адресу `USDT_ADDRESS`.

## 7. Переменные окружения (Vercel)

| Переменная | Для чего |
|------------|----------|
| `ADMIN_KEY` | Доступ к `/api/stats`, `/api/subscribers`, `/api/newsletter` |
| `ADMIN_EMAIL` | Куда приходят уведомления об оплатах |
| `CRON_SECRET` | Авторизация `/api/cleanup` |
| `RESEND_API_KEY` | Отправка писем (квитанции, подтверждения, рассылка) |
| `RECEIPT_FROM_EMAIL` | Отправитель писем (по умолчанию `receipts@imagepipeline.art`) |
| `APP_URL` | Базовый URL для ссылок в письмах |
| `USDT_ADDRESS` / `USDT_CONTRACT` | Кошелёк и контракт USDT TRC-20 |
| `TRONGRID_API_KEY` | Ключ Trongrid (фолбэк верификации платежей, опционально) |
| `CRYPTOBOT_API_TOKEN` | Токен Crypto Pay для оплаты через Telegram (@CryptoBot → Crypto Pay → Create App) |
| `CRYPTOBOT_API_URL` | API CryptoBot (по умолчанию `https://pay.crypt.bot/api`; тестнет: `https://testnet-pay.crypt.bot/api`) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis |

---

*Актуально на момент последнего деплоя. При добавлении новых админ-эндпоинтов обновляйте этот файл.*
