# Track It - Mobile App (Expo)

Aplicativo mobile do ecossistema Track It, com paridade de lógica e UI com o frontend web.

## Pré-requisitos

- Node.js 18+
- Expo CLI (`npx expo` ou `npm install -g expo-cli`)
- Backend rodando (Next.js em `/web`)

## Configuração

1. **Instalar dependências:**
   ```bash
   cd app && npm install
   ```

2. **Configurar API URL (opcional):**
   - Copie `.env.example` para `.env`
   - Emulador: não é necessário (usa localhost/10.0.2.2 automaticamente)
   - Dispositivo físico: defina `EXPO_PUBLIC_API_URL=http://SEU_IP:3000`

3. **Iniciar o backend:**
   ```bash
   cd ../web && npm run dev
   ```

4. **Iniciar o app:**
   ```bash
   cd ../app && npx expo start
   ```

## Estrutura

```
app/
├── app/                 # Expo Router (file-based routing)
│   ├── _layout.tsx      # Layout raiz + providers
│   ├── index.tsx        # Splash / redirect
│   ├── login.tsx        # Tela de login
│   ├── terms.tsx        # Termos de uso
│   └── (auth)/          # Rotas protegidas
├── src/
│   ├── services/        # API, auth
│   ├── styles/          # theme, safeArea
│   ├── contexts/       # Theme, Language
│   ├── components/
│   ├── i18n/
│   └── types/
└── assets/
```

## Autenticação Mobile

O backend expõe `/api/auth/verify-code-mobile` que retorna o JWT no body (em vez de cookies). O token é armazenado em `expo-secure-store` e enviado via `Authorization: Bearer <token>` em todas as requisições autenticadas.
