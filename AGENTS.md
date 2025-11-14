# SOVD Log Dashboard - AI Agent Guide

## Project Overview

SOVD Log Dashboard is a production-ready, full-stack real-time log streaming application built with Next.js 15, React 19, TypeScript, and MySQL. It provides real-time log monitoring with Server-Sent Events (SSE), advanced filtering capabilities, and supports 1000+ concurrent connections with 500+ messages/second throughput.

**Key Features:**
- Real-time log streaming via Server-Sent Events (SSE)
- Advanced filtering by log level, module, and full-text search
- Persistent MySQL storage with 5 optimized indexes
- Multi-language support (Chinese, English, Japanese)
- Docker containerization with health checks
- Comprehensive Jest testing framework
- Load testing capabilities (100-1000+ concurrent clients)

## Technology Stack

**Frontend:**
- Next.js 15.0 (App Router)
- React 19.2
- TypeScript 5.9 (strict mode)
- Tailwind CSS 3.4
- Zustand 5.0 (state management)
- Lucide React (icons)

**Backend:**
- Node.js 20
- MySQL 8.0+ with connection pooling
- Server-Sent Events (SSE) for real-time streaming
- Custom Express-like server (`server.js`)

**Development & DevOps:**
- Docker & Docker Compose
- Jest 29 (testing framework)
- ESLint 9 with TypeScript support
- PM2 (process manager)
- Multi-stage Docker builds

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── v1/logs/       # REST API for historical logs
│   │   ├── v1/stats/      # Statistics API
│   │   └── sse/           # Server-Sent Events endpoint
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── server/                # Backend services
│   ├── db/                # Database layer
│   │   ├── client.ts      # MySQL connection pooling
│   │   └── queries.ts     # SQL query builders
│   └── services/          # Business logic
│       ├── logService.ts  # Main log service
│       ├── mockService.ts # Mock data generation
│       └── logStreamMonitor.ts # SSE streaming monitor
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   └── layout/           # Layout components
├── hooks/                 # Custom React hooks
├── store/                 # Zustand state management
├── types/                 # TypeScript interfaces
├── constants/             # Application constants
└── utils/                 # Utility functions
```

## Build and Development Commands

**Development:**
```bash
npm install                 # Install dependencies
npm run dev                # Start Next.js dev server (port 3000)
npm run server             # Start with SSE streaming support
```

**Production:**
```bash
npm run build              # Build for production
npm run start              # Start production server
npm run server:prod        # Production with SSE streaming
```

**Testing:**
```bash
npm test                   # Run Jest tests
npm run test:watch         # Watch mode for tests
npm run test:coverage      # Generate coverage report
```

**Docker:**
```bash
docker-compose up -d       # Start full stack (MySQL + App)
docker build -t sovd:latest .  # Build Docker image
```

**Performance Testing:**
```bash
npm run load-test          # Run load test (100 clients default)
npm run load-test -- --clients=500 --duration=60  # Custom parameters
```

## Code Style Guidelines

**TypeScript:**
- Strict mode enabled with comprehensive type checking
- All API responses and database queries are fully typed
- Use interfaces for data structures in `src/types/`
- Path aliases: `@/` maps to `src/`

**Component Structure:**
- Functional components with TypeScript
- Custom hooks for business logic separation
- Zustand for global state management
- Tailwind CSS for styling (utility-first approach)

**API Routes:**
- RESTful endpoints under `/api/v1/`
- SSE endpoint at `/api/sse`
- All routes use Next.js App Router structure
- Proper error handling with typed responses

**Database:**
- MySQL with connection pooling (10 connections max)
- All queries parameterized to prevent SQL injection
- 5 optimized indexes for performance
- Graceful fallback to mock data if database unavailable

## Testing Strategy

**Unit Tests:**
- Jest with TypeScript support (`ts-jest`)
- Test files follow `*.test.ts` or `*.spec.ts` pattern
- Next.js testing utilities configured
- Coverage reporting enabled

**Integration Tests:**
- API endpoint testing
- Database connection and query testing
- SSE streaming functionality tests

**Load Testing:**
- Custom load testing script
- Configurable client count and duration
- Performance metrics: throughput, latency, memory usage

**Test Configuration:**
- Jest config in `jest.config.ts`
- Setup file: `jest.setup.ts`
- Test environment: Node.js
- Timeout: 10 seconds for integration tests

## Key Configuration Files

**Core Configuration:**
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration with CORS headers
- `tsconfig.json` - TypeScript configuration (strict mode)
- `eslint.config.mjs` - ESLint configuration

**Environment:**
- `.env.example` - Environment variable template
- `.env.local` - Local development settings (git-ignored)

**Database:**
- `src/scripts/init-db.sql` - Database schema and indexes
- Connection pooling configured in `src/server/db/client.ts`

**Docker:**
- `Dockerfile` - Multi-stage build with security best practices
- `docker-compose.yml` - Full stack deployment
- Health checks configured for both app and database

## Deployment Process

**Local Development:**
1. Copy `.env.example` to `.env.local`
2. Configure database credentials
3. Run `docker-compose up -d` for full stack
4. Or manually setup MySQL and run `npm run dev`

**Production Deployment:**
1. Build Docker image: `docker build -t sovd:latest .`
2. Configure environment variables
3. Deploy with Docker Compose or cloud provider
4. Health check endpoint: `/api/health`

**Supported Cloud Providers:**
- AWS (EC2, ECS Fargate, RDS)
- Azure (Container Instances, App Service)
- Google Cloud (Cloud Run, GKE)
- DigitalOcean, Linode, Vultr

## Security Considerations

**Type Safety:**
- 100% TypeScript coverage with strict mode
- All API inputs validated and typed
- Database queries use parameterized statements

**Docker Security:**
- Non-root user (nextjs:nodejs)
- Multi-stage builds to minimize image size
- Health checks for container monitoring
- Proper signal handling for graceful shutdown

**Web Security:**
- CORS headers configured in Next.js
- XSS protection through safe React rendering
- No sensitive data exposed in client-side code

## Performance Characteristics

**Real-time Streaming:**
- Server-Sent Events (SSE) for one-way streaming
- 50-100ms latency for log delivery
- 500+ messages/second throughput
- 1000+ concurrent connections supported

**Database Performance:**
- Sub-5ms query response time
- 5 optimized indexes for common queries
- Connection pooling (10 connections)
- Graceful degradation to mock data

**Memory Usage:**
- ~2KB memory overhead per client session
- Client-side buffer limited to 5000 entries
- Efficient React rendering with virtualization

## Development Workflow

**Adding New Features:**
1. Define types in `src/types/`
2. Implement backend logic in `src/server/services/`
3. Create API route in `src/app/api/`
4. Build React components in `src/components/`
5. Add state management in `src/store/`
6. Write tests following existing patterns

**Database Changes:**
1. Update `src/scripts/init-db.sql`
2. Modify query builders in `src/server/db/queries.ts`
3. Update type definitions if schema changes
4. Test with both real and mock data

**Component Development:**
1. Use TypeScript interfaces for props
2. Follow existing component patterns
3. Implement proper error boundaries
4. Add to Zustand store if needed
5. Test with various data states

## Common Issues and Solutions

**Database Connection:**
- Check MySQL service status
- Verify credentials in `.env.local`
- Ensure database exists and schema is initialized
- Fallback to mock data if connection fails

**SSE Streaming:**
- Check browser console for connection errors
- Verify `/api/sse` endpoint is accessible
- Monitor server logs for streaming issues
- Test with curl: `curl -N http://localhost:3000/api/sse`

**Build Issues:**
- Clear `.next` directory: `rm -rf .next`
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed
- Check for circular dependencies

**Performance Issues:**
- Monitor memory usage during load tests
- Check database query performance
- Verify index usage with EXPLAIN
- Adjust client-side buffer limits if needed

## Monitoring and Debugging

**Health Checks:**
- Application: `curl http://localhost:3000/api/health`
- Database: Check connection status in logs
- Docker: Built-in health checks for containers

**Logging:**
- Server logs include connection and error information
- Database query logging available in development
- SSE connection monitoring in real-time

**Performance Metrics:**
- Load test script provides throughput and latency data
- Memory usage monitoring per client
- Database query performance tracking

This guide should help AI agents understand the project structure, development practices, and deployment procedures for the SOVD Log Dashboard.