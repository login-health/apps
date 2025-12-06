# Login.Health Mobile Apps

React Native/Expo mobile applications for the Login.Health platform.

## Apps

| App | Description | Platform |
|-----|-------------|----------|
| [Scanner](./scanner) | QR code scanner for healthcare providers | iOS, Android |
| Mobile Wallet | Patient health wallet (coming soon) | iOS, Android |

## Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** React Navigation
- **State:** Zustand
- **Storage:** AsyncStorage

## Development

Each app is a standalone Expo project. To get started:

```bash
cd scanner
npm install
npx expo start
```

## Project Structure

```
apps/
├── scanner/           # Provider QR scanner app
│   ├── src/
│   │   ├── screens/   # App screens
│   │   ├── lib/       # Utilities and helpers
│   │   ├── components/# Shared components
│   │   └── navigation/# Navigation config
│   ├── app.json
│   └── package.json
└── wallet/            # Patient mobile wallet (future)
```

## Related Repos

- [platform](https://github.com/login-health/platform) - Encore.ts backend services
- [portals](https://github.com/login-health/portals) - React web applications
