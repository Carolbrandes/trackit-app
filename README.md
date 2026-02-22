<div align="center">

# 🐷 Track It — Mobile

**Seu app de finanças pessoais na palma da mão**

[English](#-english) · [Português](#-português)

---

<img src="./assets/icon.png" alt="Track It Logo" width="80" />

[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb?logo=react)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Expo Router](https://img.shields.io/badge/Expo%20Router-6-000020)](https://expo.github.io/router/)

</div>

---

## 🇺🇸 English

### Overview

**Track It — Mobile** is the native companion app for [Track It](https://github.com/your-org/track-it-web), the AI-powered personal finance tracker. Built with **Expo** and **React Native**, it lets you manage transactions, view analytics, scan receipts, and sync with the same backend as the web app — on iOS, Android, or web.

### Features

| Feature | Description |
|---|---|
| **Transaction Management** | Add, filter, and view transactions with the same data as the web app |
| **Receipt Scanner** | Use the device camera to scan receipts (expo-image-picker + backend AI) |
| **Financial Charts** | Interactive charts for spending by category and trends (react-native-gifted-charts) |
| **AI Insights** | View AI-generated financial insights from the backend |
| **Categories** | Browse and use your categories; create new ones via the API |
| **Multi-Currency** | Display and add transactions in your preferred currency (locale-aware) |
| **Multi-Language** | English, Portuguese, and Spanish via LanguageContext |
| **Dark / Light Theme** | Theme persistence with ThemeContext |
| **Secure Auth** | JWT stored in Expo SecureStore; passwordless login (email code) via backend |
| **Offline-Ready** | Secure token and preferences stored on device |

### Architecture

```
track-it-app/
├── app/                    # Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout (Theme, Language, SafeArea)
│   ├── index.tsx           # Entry / redirect
│   ├── login.tsx           # Login screen
│   ├── terms.tsx           # Terms of use
│   └── (auth)/             # Authenticated stack
│       ├── _layout.tsx     # Tabs or stack for logged-in users
│       ├── index.tsx       # Home / transactions
│       ├── analytics.tsx    # Charts + AI insights
│       └── categories.tsx  # Category list
├── src/
│   ├── components/         # Reusable UI
│   │   ├── AddTransactionModal/
│   │   ├── ReceiptScannerModal/
│   │   ├── FilterModal/
│   │   ├── FinancialCharts/
│   │   ├── AiInsightsSection/
│   │   ├── SettingsModal/
│   │   ├── ExpandableCard/
│   │   └── Spinner/
│   ├── contexts/           # ThemeContext, LanguageContext
│   ├── services/           # API client (axios + SecureStore auth)
│   └── styles/             # Safe area and shared styles
├── assets/                 # Icons, splash, fonts
├── app.json                # Expo config
└── package.json
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Expo 54, Expo Router 6 (file-based) |
| **UI** | React 19, React Native 0.81 |
| **Language** | TypeScript 5 |
| **HTTP** | Axios (base URL from env) |
| **Auth** | JWT in Expo SecureStore, passwordless via backend |
| **Charts** | react-native-gifted-charts |
| **Images** | expo-image-picker, expo-image-manipulator |
| **Navigation** | expo-router (Stack, Tabs) |
| **Backend** | Same API as [Track It Web](https://github.com/your-org/track-it-web) (Next.js) |

### Getting Started

#### Prerequisites

- Node.js 20+
- npm or yarn
- [Expo Go](https://expo.dev/go) on your phone (optional, for quick testing)
- **Track It Web** backend running (see [track-it-web](https://github.com/your-org/track-it-web) README)

#### Environment Variables

Create a `.env` file in the **app** root:

```env
# URL of the Track It API (web backend). No trailing slash.
# For Android emulator, dev default is http://10.0.2.2:3000
# For iOS simulator, dev default is http://localhost:3000
# For a physical device, use your machine's LAN IP, e.g. http://192.168.1.10:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

#### Local Development

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start
# or: npm run android | npm run ios | npm run web
```

Then:

- **iOS Simulator:** press `i` in the terminal or open in Xcode.
- **Android Emulator:** press `a` or run an AVD.
- **Physical device:** scan the QR code with Expo Go; ensure `EXPO_PUBLIC_API_URL` points to your machine’s IP (e.g. `http://192.168.1.10:3000`).

#### Building for production

Use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

---

## 🇧🇷 Português

### Visão Geral

**Track It — Mobile** é o app nativo do [Track It](https://github.com/your-org/track-it-web), o rastreador de finanças pessoais com IA. Feito com **Expo** e **React Native**, você gerencia transações, vê analytics, escaneia comprovantes e sincroniza com o mesmo backend do app web — no iOS, Android ou web.

### Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **Gestão de Transações** | Adicionar, filtrar e ver transações com os mesmos dados do app web |
| **Scanner de Comprovantes** | Usar a câmera para escanear comprovantes (expo-image-picker + IA no backend) |
| **Gráficos Financeiros** | Gráficos interativos por categoria e tendências (react-native-gifted-charts) |
| **Insights com IA** | Ver análises financeiras geradas por IA no backend |
| **Categorias** | Navegar e usar suas categorias; criar novas via API |
| **Multi-Moeda** | Exibir e adicionar transações na moeda preferida (locale-aware) |
| **Multi-Idioma** | Português, Inglês e Espanhol via LanguageContext |
| **Tema Escuro / Claro** | Persistência de tema com ThemeContext |
| **Auth Segura** | JWT no Expo SecureStore; login sem senha (código por email) via backend |
| **Pronto para Offline** | Token e preferências armazenados no dispositivo |

### Arquitetura

```
track-it-app/
├── app/                    # Expo Router (rotas baseadas em arquivo)
│   ├── _layout.tsx         # Layout raiz (Theme, Language, SafeArea)
│   ├── index.tsx           # Entrada / redirecionamento
│   ├── login.tsx           # Tela de login
│   ├── terms.tsx           # Termos de uso
│   └── (auth)/             # Stack autenticado
│       ├── _layout.tsx     # Tabs/stack para usuários logados
│       ├── index.tsx       # Início / transações
│       ├── analytics.tsx   # Gráficos + insights IA
│       └── categories.tsx  # Lista de categorias
├── src/
│   ├── components/         # UI reutilizável
│   │   ├── AddTransactionModal/
│   │   ├── ReceiptScannerModal/
│   │   ├── FilterModal/
│   │   ├── FinancialCharts/
│   │   ├── AiInsightsSection/
│   │   ├── SettingsModal/
│   │   ├── ExpandableCard/
│   │   └── Spinner/
│   ├── contexts/           # ThemeContext, LanguageContext
│   ├── services/           # Cliente API (axios + auth SecureStore)
│   └── styles/             # Safe area e estilos compartilhados
├── assets/                 # Ícones, splash, fontes
├── app.json                # Config Expo
└── package.json
```

### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework** | Expo 54, Expo Router 6 (file-based) |
| **UI** | React 19, React Native 0.81 |
| **Linguagem** | TypeScript 5 |
| **HTTP** | Axios (URL base via env) |
| **Auth** | JWT no Expo SecureStore, passwordless via backend |
| **Gráficos** | react-native-gifted-charts |
| **Imagens** | expo-image-picker, expo-image-manipulator |
| **Navegação** | expo-router (Stack, Tabs) |
| **Backend** | Mesma API do [Track It Web](https://github.com/your-org/track-it-web) (Next.js) |

### Como Executar

#### Pré-requisitos

- Node.js 20+
- npm ou yarn
- [Expo Go](https://expo.dev/go) no celular (opcional, para testar rápido)
- Backend **Track It Web** rodando (veja README do [track-it-web](https://github.com/your-org/track-it-web))

#### Variáveis de Ambiente

Crie um arquivo `.env` na **raiz do app**:

```env
# URL da API do Track It (backend web). Sem barra no final.
# No emulador Android, o padrão em dev é http://10.0.2.2:3000
# No simulador iOS, o padrão em dev é http://localhost:3000
# Em dispositivo físico, use o IP da sua máquina na rede, ex: http://192.168.1.10:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

#### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor Expo
npm start
# ou: npm run android | npm run ios | npm run web
```

Em seguida:

- **Simulador iOS:** pressione `i` no terminal ou abra no Xcode.
- **Emulador Android:** pressione `a` ou inicie um AVD.
- **Dispositivo físico:** escaneie o QR code com o Expo Go; defina `EXPO_PUBLIC_API_URL` com o IP da sua máquina (ex: `http://192.168.1.10:3000`).

#### Build para produção

Use [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npm install -g eas-cli
eas login
eas build --platform android
eas build --platform ios
```

---

<div align="center">

**Feito com <span style="color: #ef4444;">&hearts;</span> e muito ☕**

[Voltar ao topo](#-track-it--mobile)

</div>
