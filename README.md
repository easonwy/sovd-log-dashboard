# SOVD Log Dashboard

SOVD Log Dashboard is a comprehensive web application designed to provide a robust, user-friendly interface for monitoring and analyzing system logs. It is built using React, TypeScript, and Tailwind CSS, with a focus on clean code, scalability, and maintainability.


## The Philosophy: Separation of Concerns

The core goal is to break down the monolithic file into logical units:
- Components: Reusable UI pieces.
- State Management: A central place to manage application state, avoiding prop-drilling. We'll use Zustand for its simplicity and power.
- Services: Logic for interacting with external APIs (REST and WebSocket).
- Hooks: Reusable component logic.
- Constants & Types: Centralized definitions for constants and TypeScript types.
- Utilities: Generic helper functions.
- Internationalization (i18n): A dedicated structure for managing translations.

## Code Structure

```Bash
sovd-dashboard/
├── public/
├── src/
│   ├── api/
│   │   ├── logService.ts        # Handles REST API calls for logs
│   │   └── webSocketService.ts  # Manages the WebSocket connection
│   │
│   ├── assets/                  # (For images, svgs, etc. if any)
│   │
│   ├── components/
│   │   ├── common/              # Small, truly generic components (e.g., Button, Spinner)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── PageWrapper.tsx
│   │   ├── dashboard/
│   │   │   ├── FilterSidebar.tsx
│   │   │   ├── LogDetailPanel.tsx
│   │   │   ├── LogItem.tsx
│   │   │   ├── StatsPanel.tsx
│   │   │   └── TimeHistogram.tsx
│   │
│   ├── constants/
│   │   ├── index.ts             # Exports all constants
│   │   └── logConstants.ts      # LOG_LEVELS, LOG_MODULES, etc.
│   │
│   ├── hooks/
│   │   ├── useLogStream.ts      # Custom hook to manage data flow
│   │   └── useTranslation.ts    # Custom hook for i18n
│   │
│   ├── i18n/
│   │   ├── I18nProvider.tsx     # Context provider for language
│   │   └── translations.ts      # The translations object
│   │
│   ├── pages/
│   │   └── DashboardPage.tsx    # The main page component
│   │
│   ├── store/
│   │   └── logStore.ts          # Zustand store for global state
│   │
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces and types
│   │
│   ├── utils/
│   │   ├── colorUtils.ts        # getColorClass function
│   │   └── logUtils.ts          # generateDemoLogs function
│   │
│   ├── App.tsx                  # Main app component (handles routing, providers)
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles (including Tailwind directives)
│
├── .env.local                   # Environment variables
├── package.json
├── tsconfig.json
└── vite.config.js
```

## GUI Design

![image-20251111145452241](https://cdn.jsdelivr.net/gh/easonwy/images@master/uPic/2025/11/ZSh5Zt_image-20251111145452241.png)