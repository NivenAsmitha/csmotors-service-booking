# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Production URLs

- Frontend: https://csmotorsservice.lk
- Frontend (www): https://www.csmotorsservice.lk
- Backend API: https://csmotors-service-booking-production.up.railway.app/api
- Swagger: https://csmotors-service-booking-production.up.railway.app/api/docs
- Email From: CS Motors <no-reply@csmotorsservice.lk>

## Production Deployment

Railway backend variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<long-random-refresh-secret>
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://csmotorsservice.lk,https://www.csmotorsservice.lk
RESEND_API_KEY=<new-resend-api-key>
MAIL_FROM=CS Motors <no-reply@csmotorsservice.lk>
```

Vercel frontend variable:

```env
VITE_API_URL=https://csmotors-service-booking-production.up.railway.app/api
```

`MAIL_FROM=CS Motors <no-reply@csmotorsservice.lk>` only works after the
Resend domain status is Verified.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
