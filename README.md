# GlobalPay Hub Mobile

Полноценное кросс-платформенное мобильное приложение на React Native (Expo) для платежной платформы GlobalPay Hub.

## Что реализовано (весь чат в одном проекте)

- **Аутентификация**: JWT + Refresh Token + Proactive refresh (обновление за 5 мин до истечения)
- **Парсинг JWT** на клиенте (payload, role, exp)
- **Stripe Payments** через @stripe/stripe-react-native (CardField + PaymentIntent)
- **Offline-очередь** операций (DataSyncManager) + локальные уведомления
- **Автосинхронизация** при появлении сети (NetInfo)
- **Обработка ошибок** с классификацией и user-friendly сообщениями
- **Экраны**: Login, Register, Payments (создание + история), Merchant Dashboard (баланс + вывод)
- **SecureStore** для токенов
- **React Native Paper** UI

## Структура

```
src/
├── components/
├── hooks/          # useProactiveTokenRefresh, useDataSync
├── screens/        # Login, Register, Payments, MerchantDashboard
├── services/       # api, auth, dataSync, errorHandler, offlineNotifications
└── utils/          # constants
```

## Запуск (реальный, без симуляций)

```bash
npx create-expo-app . --template blank
npm install
npx expo install expo-secure-store expo-notifications @react-native-async-storage/async-storage @react-native-community/netinfo react-native-paper @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-gesture-handler axios @stripe/stripe-react-native

npx expo start
```

Сканируй QR в Expo Go на телефоне.  
API_BASE_URL и STRIPE_PUBLISHABLE_KEY — в `src/utils/constants.js`.

Backend должен отдавать:
- POST /auth/login → { token, refreshToken?, user? }
- POST /auth/register
- POST /auth/refresh → { token, refreshToken? }
- POST /payments/create → { clientSecret }
- GET /payments
- GET /merchants/balance
- POST /merchants/payout

## Особенности из чата

1. Proactive token refresh каждые 2 минуты + при каждом запросе если <5 мин до exp
2. Offline payments ставятся в очередь и синхронизируются при появлении сети
3. Локальные push-уведомления через expo-notifications
4. Полная обработка 401 → refresh → retry / logout

Репозиторий создан и заполнен автоматически.