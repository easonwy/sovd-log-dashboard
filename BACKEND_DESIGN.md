# Backend Integration Design - SOVD Log Dashboard

## Executive Summary

This document outlines the design for integrating a production-ready backend service into the existing SOVD Log Dashboard project. The backend will provide:
1. **REST APIs** for historical log queries with MySQL persistence
2. **WebSocket streaming** for real-time log ingestion
3. **Seamless development experience** with optional mock fallback

---

## 1. Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────────────┐
│          React + Vite Frontend                    │
│  (Existing - No Changes Required)                │
│  • Zustand for state management                  │
│  • WebSocket client for real-time logs           │
│  • REST client for historical logs               │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼──────┐      ┌──────▼──────┐
    │   REST API │      │  WebSocket   │
    │  /api/v1/* │      │  /ws/logs    │
    └─────┬──────┘      └──────┬───────┘
          │                     │
    ┌─────▼──────────────────────▼──────┐
    │   Next.js Backend Server           │
    │   (Unified Route Handlers)         │
    │   • Node.js runtime                │
    │   • TypeScript support             │
    │   • Native WebSocket support       │
    └─────┬──────────────────────┬───────┘
          │                      │
    ┌─────▼──────┐      ┌────────▼─────┐
    │   MySQL 8+ │      │  Mock Data    │
    │   Database │      │  Generator    │
    │            │      │ (Dev Only)    │
    └────────────┘      └───────────────┘
```

### Why Next.js?

✅ **Advantages:**
- **Single codebase** for frontend + backend (monorepo-friendly)
- **Native WebSocket support** via API routes with socket.io or ws
- **Type-safe** with TypeScript (single tsconfig approach)
- **Automatic environment variable handling** (.env.local, .env.production)
- **Unified deployment** to platforms like Vercel, AWS Lambda
- **Built-in middleware** support for CORS, authentication
- **Development experience** with hot reload for both frontend and backend
- **Zero migration** - leverage existing React setup

### Alternative Considered: Standalone Express Server

❌ **Drawbacks:**
- Requires separate port management (3000 + 5173)
- Separate build/deployment pipeline
- Additional Docker configuration
- CORS configuration overhead
- Separate package.json dependencies

**Decision: Next.js is the optimal choice for this project.**

---

## 2. Project Structure Changes

### Current Structure
```
sovd-log-dashboard/
├── src/                      # Frontend only
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── store/
│   └── ...
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Proposed Structure (After Migration to Next.js)
```
sovd-log-dashboard/
├── src/
│   ├── app/                  # Next.js App Router (NEW)
│   │   ├── api/              # Backend API routes (NEW)
│   │   │   └── v1/
│   │   │       ├── logs/
│   │   │       │   └── route.ts          # GET /api/v1/logs
│   │   │       └── stats/
│   │   │           └── route.ts          # GET /api/v1/stats
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   │
│   ├── components/           # React components (EXISTING)
│   ├── hooks/                # Custom React hooks (EXISTING)
│   ├── store/                # Zustand state (EXISTING)
│   ├── api/                  # Client API clients (EXISTING - MODIFIED)
│   │   ├── logService.ts     # Fetch logs from /api/v1/logs
│   │   └── webSocketService.ts # Connect to /ws/logs
│   │
│   ├── server/               # Backend utilities (NEW)
│   │   ├── db/
│   │   │   ├── client.ts     # MySQL connection pool
│   │   │   └── queries.ts    # Reusable SQL queries
│   │   ├── services/
│   │   │   ├── logService.ts # Business logic
│   │   │   ├── wsService.ts  # WebSocket manager
│   │   │   └── mockService.ts # Mock data generator
│   │   └── utils/
│   │       └── logger.ts     # Server-side logging
│   │
│   ├── lib/                  # Shared utilities (NEW)
│   │   ├── types.ts          # Shared types (frontend + backend)
│   │   └── constants.ts      # Shared constants
│   │
│   ├── types/                # Type definitions (EXISTING)
│   ├── constants/            # Constants (EXISTING)
│   └── utils/                # Utils (EXISTING)
│
├── public/                   # Static assets (EXISTING)
├── .env.example              # Environment template (NEW)
├── .env.local                # Local overrides (NEW - GITIGNORED)
├── package.json              # Updated with Next.js deps
├── tsconfig.json             # Updated for Next.js
├── next.config.ts            # Next.js config (NEW)
└── BACKEND_DESIGN.md         # This file
```

### Key Files to Create

1. **`next.config.ts`** - Next.js configuration with WebSocket support
2. **`src/app/layout.tsx`** - Root layout with providers
3. **`src/app/page.tsx`** - Redirect to dashboard
4. **`src/app/api/v1/logs/route.ts`** - REST API for historical logs
5. **`src/app/api/v1/stats/route.ts`** - REST API for statistics
6. **`src/server/db/client.ts`** - MySQL connection management
7. **`src/server/db/queries.ts`** - SQL query builders
8. **`src/server/services/logService.ts`** - Business logic
9. **`src/server/services/wsService.ts`** - WebSocket manager (using ws library)
10. **`.env.example`** - Environment variable template

---

## 3. Database Schema & Connection

### MySQL Table Schema (As Per Requirements)

```sql
CREATE TABLE logs (
  id VARCHAR(36) PRIMARY KEY,
  timestamp DATETIME(3) NOT NULL,
  module VARCHAR(50) NOT NULL,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  trace_id VARCHAR(20),
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_timestamp (timestamp DESC),
  INDEX idx_level (level),
  INDEX idx_module (module),
  INDEX idx_trace_id (trace_id)
);
```

### Connection Management

**File: `src/server/db/client.ts`**
- Use `mysql2/promise` for connection pooling
- Singleton pattern for pool instance
- Graceful shutdown on server close
- Connection error handling

```typescript
// Pseudocode
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}
```

---

## 4. REST API Endpoints

### 4.1 GET `/api/v1/logs`

**Purpose:** Fetch historical logs with pagination and filtering

**Query Parameters:**
```
?offset=0
&limit=500
&levels=ERROR,WARN          (comma-separated, optional)
&modules=AUTH,ORDER         (comma-separated, optional)
&search=keywords            (searchable in message/traceId, optional)
&startTime=2024-01-01       (ISO format, optional)
&endTime=2024-12-31         (ISO format, optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-001",
        "timestamp": "2024-11-11T10:30:45.123Z",
        "module": "AUTH_SERVER",
        "level": "ERROR",
        "message": "Authentication failed",
        "traceId": "trace-123",
        "details": { "reason": "Invalid token" }
      }
    ],
    "total": 15000,
    "offset": 0,
    "limit": 500
  },
  "error": null
}
```

**Implementation Details:**
- SQL filtering: WHERE conditions for level, module, timestamp
- Full-text search on message and traceId columns
- ORDER BY timestamp DESC
- Pagination: LIMIT + OFFSET
- Response time target: < 500ms

### 4.2 GET `/api/v1/stats`

**Purpose:** Get aggregated statistics for analytics dashboard

**Query Parameters:**
```
?startTime=2024-01-01       (optional, default: 24h ago)
&endTime=2024-12-31         (optional, default: now)
&interval=1h                (optional: 5m, 15m, 1h, 1d)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 50000,
    "levelDistribution": {
      "ERROR": { "count": 500, "percentage": 1.0 },
      "WARN": { "count": 5000, "percentage": 10.0 },
      "INFO": { "count": 40000, "percentage": 80.0 },
      "SUCCESS": { "count": 4500, "percentage": 9.0 }
    },
    "moduleDistribution": {
      "AUTH_SERVER": { "count": 10000, "percentage": 20.0 },
      "ORDER": { "count": 15000, "percentage": 30.0 },
      ...
    },
    "timeSeries": [
      {
        "timestamp": "2024-11-11T10:00:00Z",
        "count": 1200,
        "errorCount": 5
      }
    ]
  }
}
```

**Implementation Details:**
- Use MySQL GROUP BY and COUNT aggregate functions
- Efficient date histogram binning
- Cache results for 1-5 minutes
- Separate queries for level vs module distribution

---

## 5. WebSocket Implementation

### 5.1 WebSocket Endpoint: `ws://localhost:3000/ws/logs` (Development)

**Library:** `ws` package with Next.js API routes (using `next-api-websocket-handler` or custom middleware)

**Connection Flow:**

```
Client                          Server
  │                              │
  ├─────── Connect ────────────>│
  │                              ├─ Generate session ID
  │                              ├─ Set default filters
  │<───── Connected ────────────┤
  │                              │
  ├─ Send Filters ───────────────>│
  │  { levels: [...],            │
  │    modules: [...] }          │
  │                              ├─ Update subscription
  │                              │
  │<──── Log Stream ────────────┤
  │  (filtered in real-time)     │
  │                              │
  ├─ Pause (no messages) ───────>│
  │  (client-side buffer only)   │
  │                              │
  │<──── Resume Log Stream ─────┤
  │                              │
  ├─────── Disconnect ──────────>│
  │                              ├─ Clean up session
```

**Message Format:**

```typescript
// Client -> Server: Update Filters
{
  type: 'filter',
  payload: {
    levels: ['ERROR', 'WARN'],
    modules: ['AUTH', 'ORDER'],
    searchText: ''
  }
}

// Server -> Client: Stream Log
{
  id: 'log-123',
  timestamp: '2024-11-11T10:30:45.123Z',
  module: 'AUTH',
  level: 'ERROR',
  message: 'Authentication failed',
  traceId: 'trace-456',
  details: { ... }
}
```

### 5.2 WebSocket Session Management

**Tracking Active Clients:**
```typescript
interface WebSocketClient {
  id: string;
  ws: WebSocket;
  filters: {
    levels: string[];
    modules: string[];
    searchText: string;
  };
  createdAt: Date;
}

const activeClients: Map<string, WebSocketClient> = new Map();
```

**Graceful Shutdown:**
- Close all client connections
- Wait for in-flight messages
- Cleanup resources

---

## 6. Development vs Production Behavior

### Environment Variables (`.env.local` for development)

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=log_dashboard

# Backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Feature Flags
NEXT_PUBLIC_FORCE_MOCK_API=false        # Set true to use mock data
NEXT_PUBLIC_MOCK_LOG_GENERATION=false   # Generate mock logs in real-time

# Database Feature Flags
USE_MOCK_DB=false                       # Use mock data instead of MySQL
```

### Mock Fallback Strategy

**When to use mocks:**
1. **Development without MySQL**: Set `USE_MOCK_DB=true`
2. **Database connection failure**: Auto-fallback with warning
3. **API endpoint unavailable**: WebSocket falls back to client-side mock stream

**Current Flow (No Changes to Frontend):**
```
Frontend API calls
    ↓
REST endpoint (/api/v1/logs)
    ├─ Try MySQL query
    └─ Fallback: Mock data generator
    
WebSocket connection
    ├─ Try real WebSocket
    └─ Fallback: Client-side mock stream
```

---

## 7. Implementation Phases

### Phase 1: Project Migration to Next.js (Week 1)
- [ ] Install Next.js and dependencies
- [ ] Migrate Vite React project to Next.js
- [ ] Setup basic API route structure
- [ ] Configure TypeScript for API routes
- [ ] Test that frontend still works with mock data

### Phase 2: MySQL Integration (Week 2)
- [ ] Install `mysql2/promise` and setup connection pool
- [ ] Create database schema
- [ ] Implement `/api/v1/logs` endpoint with MySQL queries
- [ ] Implement `/api/v1/stats` endpoint
- [ ] Add SQL query optimization
- [ ] Test with real data

### Phase 3: WebSocket Integration (Week 3)
- [ ] Setup WebSocket server with `ws` library
- [ ] Implement real-time log streaming
- [ ] Session management and filtering
- [ ] Client subscription handling
- [ ] Test multi-client connections

### Phase 4: Testing & Optimization (Week 4)
- [ ] Load testing (1000+ concurrent clients)
- [ ] Database query optimization
- [ ] Error handling and recovery
- [ ] Deployment configuration
- [ ] Production hardening

---

## 8. Key Differences from Standalone Express

| Aspect | Next.js | Express |
|--------|---------|---------|
| Port | Single (3000) | Requires separate ports |
| Deployment | Unified | Separate services |
| TypeScript | Native | Requires tsconfig setup |
| Build | One build step | Two separate builds |
| Hot reload | Frontend + API | Frontend only |
| Environment | Automatic handling | Manual setup |
| CORS | Simpler | Requires middleware |

---

## 9. Dependencies to Add

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "mysql2": "^3.6.0",
    "ws": "^8.14.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.10.0",
    "@types/ws": "^8.5.0"
  }
}
```

---

## 10. Error Handling Strategy

### Backend Errors

```typescript
// Consistent error response format
{
  success: false,
  data: null,
  error: {
    code: 'DB_CONNECTION_ERROR',
    message: 'Unable to connect to database',
    details: '...'  // Only in development
  }
}
```

### Frontend Error Handling

```typescript
// No changes required - existing logic handles:
// 1. API failures -> Fallback to mock data
// 2. WebSocket failures -> Fallback to client-side mock stream
// 3. Connection loss -> Auto-reconnect with exponential backoff
```

---

## 11. Migration Path (Zero Downtime)

1. **Parallel deployment**: Run Next.js and Vite during transition
2. **Frontend API clients**: Already support configurable BACKEND_URL
3. **Gradual rollout**: Switch endpoints one by one to verify
4. **Fallback strategy**: Keep mock data generator functional

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| GET /api/v1/logs | < 500ms |
| GET /api/v1/stats | < 1000ms |
| WebSocket connection | < 100ms |
| Log delivery latency | < 50ms |
| Peak concurrent connections | 1000+ |

---

## Summary

**This design provides:**

✅ Single monorepo with frontend + backend
✅ Type-safe across client and server
✅ Minimal breaking changes to existing code
✅ Robust error handling with mock fallbacks
✅ Clear migration path
✅ Production-ready architecture
✅ Developer-friendly setup (local MySQL or mocks)

**Next Steps:**
1. Review this design
2. Approve technology choices
3. Confirm environment variable strategy
4. Begin Phase 1 implementation

