# SOVD Log Dashboard - Requirements

## 🛠️ 开发任务清单

### I. 前端架构与基础 (FE Architecture)

| **ID** | **任务描述**                                                 | **技术要求**                        | **优先级** |
| ------ | ------------------------------------------------------------ | ----------------------------------- | ---------- |
| FE-101 | **项目初始化**：设置基础项目结构、路由、状态管理（如 React + Redux/Zustand）。 | React/Vue/Angular, TypeScript       | 高         |
| FE-102 | **WebSocket 客户端集成**：实现 WebSocket 连接管理、心跳机制和断线重连逻辑。 | Native WebSocket / Socket.io Client | 高         |
| FE-103 | **虚拟滚动 (Virtual Scrolling)** 实现：确保在接收大量日志时，前端性能依然流畅。 | react-window / vue-virtual-scroller | 高         |
| FE-104 | **本地存储实现**：用于保存用户的配置偏好、主题、字体大小和过滤预设。 | localStorage / IndexedDB            | 中         |
| FE-105 | **响应式布局实现**：确保在桌面端和小屏幕设备（移动端）上的可用性和良好体验。 | CSS Grid/Flexbox, Media Queries     | 高         |

### II. 实时日志流与显示 (Live Stream & Rendering)

| **ID** | **任务描述**                                                 | **技术要求**                              | **优先级** |
| ------ | ------------------------------------------------------------ | ----------------------------------------- | ---------- |
| LS-201 | **日志条目渲染**：实现包含时间戳、模块、级别、消息内容的标准日志组件。 | 基础 UI 组件                              | 高         |
| LS-202 | **颜色编码实现**：根据日志级别（ERROR, WARN, INFO, SUCCESS）应用对应颜色。 | CSS / Styled Components                   | 高         |
| LS-203 | **自动滚动/暂停逻辑**：实现用户手动暂停和恢复实时日志流滚动的交互逻辑。 | DOM / Scroll API                          | 高         |
| LS-204 | **高亮且居中显示逻辑**：实现针对新到达的 `ERROR`/`FATAL` 日志的特殊高亮和视野聚焦效果。 | Conditional Styling, Scroll Into View API | 中         |
| LS-205 | **紧凑/详细模式切换**：实现日志条目的两种显示模式，并保存用户偏好。 | UI State Management                       | 中         |

### III. 智能过滤系统 (Intelligent Filter Hub)

| **ID** | **任务描述**                                                 | **技术要求**                   | **优先级** |
| ------ | ------------------------------------------------------------ | ------------------------------ | ---------- |
| FH-301 | **多选过滤器 UI/逻辑**：实现模块、日志级别的多选过滤 UI 和状态同步。 | UI 组件库, State Management    | 高         |
| FH-302 | **实时计数反馈**：实现过滤器旁边的实时数字显示（例如：`错误 (125 / 500)`）。 | FE Data Aggregation Logic      | 高         |
| FH-303 | **关键词搜索实现**：前端防抖处理 (`debounce`)，实时过滤日志流。 | Lodash `debounce`              | 高         |
| FH-304 | **高级搜索解析器**：实现 `field:value` 语法解析，用于过滤特定字段内容。 | Regex / Simple Parsing Logic   | 中         |
| FH-305 | **时间轴迷你图实现**：集成图表库，显示日志密度，并实现可拖拽的范围选择功能。 | ECharts / D3.js / React-Charts | 高         |
| FH-306 | **URL 状态编码/解码**：实现所有过滤条件与 URL 参数的双向同步，支持分享。 | Native URLSearchParams API     | 中         |

### IV. 日志详情与协作 (Detail & Collaboration)

| **ID** | **任务描述**                                                 | **技术要求**                                   | **优先级** |
| ------ | ------------------------------------------------------------ | ---------------------------------------------- | ---------- |
| DC-401 | **点击展开详情**：实现点击日志条目展开详情面板的交互。       | Accordion / Drawer Component                   | 高         |
| DC-402 | **结构化数据格式化**：自动检测 JSON/XML，并以可读的树状或高亮格式展示。 | JSON Formatter Library (e.g., react-json-view) | 高         |
| DC-403 | **Trace ID/Request ID 关联**：自动识别并将其高亮，实现点击后发送**请求完整链路**的 API 调用。 | Regex / API Integration                        | 高         |
| DC-404 | **差异对比视图**：实现选择两条日志后，对比其结构化内容差异的功能（例如使用 `diff` 库）。 | Diff Library                                   | 中         |
| DC-405 | **复制功能优化**：实现“复制原始文本”和“复制格式化 JSON”两个按钮。 | Clipboard API                                  | 中         |

### V. 统计分析面板 (Analytics Dashboard)

| **ID** | **任务描述**                                                 | **技术要求**                      | **优先级** |
| ------ | ------------------------------------------------------------ | --------------------------------- | ---------- |
| AD-501 | **ECharts 集成**：搭建基础的日志趋势图和模块分布饼图。       | ECharts / Recharts Integration    | 高         |
| AD-502 | **数据聚合接口调用**：定义并调用后端 API 获取统计分析所需的聚合数据。 | REST API Calls                    | 高         |
| AD-503 | **异常检测标记**：在趋势图上实现基于后端数据的**异常点标记**功能。 | ECharts MarkPoint / Backend Logic | 中         |
| AD-504 | **性能 SLO/SLA 可视化**：实现进度条或仪表盘，展示关键指标的达标状态。 | UI Component, Conditional Logic   | 中         |

### VI. 后端 API 与服务 (BE/Service Layer)

| **ID** | **任务描述**                                                 | **技术要求**                               | **优先级** |
| ------ | ------------------------------------------------------------ | ------------------------------------------ | ---------- |
| BE-601 | **日志收集与存储**：确保有机制将模块日志实时写入持久化存储（如 ELK, ClickHouse, InfluxDB）。 | Log Stash / Log Parser                     | 高         |
| BE-602 | **WebSocket 服务端实现**：实现实时日志推送服务，按订阅（模块/级别）推送数据。 | Node.js / Go / Java with WebSocket Library | 高         |
| BE-603 | **查询 API 实现**：实现高效的日志查询接口，支持多字段、时间范围和分页查询。 | Optimized DB Queries                       | 高         |
| BE-604 | **统计聚合 API**：实现按时间、模块、级别进行**实时聚合**的接口，用于统计面板。 | Database Aggregation Functions             | 高         |
| BE-605 | **导出任务服务**：实现**后台异步导出**服务，处理大量日志导出请求（CSV/JSON）。 | Background Worker (e.g., Celery, RabbitMQ) | 中         |

## VI. 后端 API 与服务 (BE/Service Layer) 规划 (MySQL 版本)

### 1. 架构概览

我们将采用 **Node.js** 作为后端服务运行时，并使用 **Express** 框架搭建 RESTful API 和 **WebSocket** 库提供实时日志流。

- **数据流:** 日志生成器 (Mock/Actual) -> Node.js 服务 -> MySQL (持久化) / WebSocket (实时推送) -> React 前端。

### 2. 持久化 (Persistence) - MySQL (BE-601)

我们将使用 **MySQL** 作为日志数据库。由于日志详情 (`details`) 字段需要存储灵活的 JSON 结构，我们将利用 MySQL 5.7 及更高版本提供的 `JSON` 数据类型。

#### 日志表 (`logs`) 架构

| 字段名 (Column) | 数据类型 (Data Type) | 约束 (Constraints)  | 描述 (Description)                                 |
| --------------- | -------------------- | ------------------- | -------------------------------------------------- |
| `id`            | `VARCHAR(36)`        | `PRIMARY KEY`       | 唯一日志标识符 (例如 UUID 字符串)。                |
| `timestamp`     | `DATETIME(3)`        | `NOT NULL`          | 日志记录时间 (带毫秒精度，用于排序和时间轴)。      |
| `module`        | `VARCHAR(50)`        | `NOT NULL`, `INDEX` | 产生日志的模块 (`AUTH`, `ORDER` 等)。              |
| `level`         | `VARCHAR(10)`        | `NOT NULL`, `INDEX` | 日志级别 (`INFO`, `ERROR` 等)。                    |
| `message`       | `TEXT`               | `NOT NULL`          | 日志消息主体。                                     |
| `trace_id`      | `VARCHAR(20)`        | `INDEX`             | 关联请求的追踪 ID (用于关联查询)。                 |
| `details`       | `JSON`               | `NULL`              | 结构化的日志上下文数据 (使用 MySQL 的 JSON 类型)。 |
| `create_time`   | `DATETIME`           | `NOT NULL`          | 数据写入时间                                       |

**关键索引 (用于提升查询性能):**

- `CREATE INDEX idx_logs_timestamp ON logs (timestamp DESC);`
- `CREATE INDEX idx_logs_level ON logs (level);`
- `CREATE INDEX idx_logs_module ON logs (module);`
- `CREATE INDEX idx_logs_trace_id ON logs (trace_id);`

### 3. 后端 API 设计 (BE-602)

#### A. RESTful API (用于历史查询和统计)

| HTTP 方法 | 路径 (Path)         | 描述 (Description)                          | 查询参数 (Query Params)                        |
| --------- | ------------------- | ------------------------------------------- | ---------------------------------------------- |
| `GET`     | `/api/v1/logs`      | 获取历史日志 (支持分页)。                   | `limit`, `offset`, `level`, `module`, `search` |
| `GET`     | `/api/v1/stats`     | 获取日志分布和速率统计。                    | `startTime`, `endTime`, `interval`             |
| `GET`     | `/api/v1/trace/:id` | 根据 `trace_id` 获取完整的请求/事务日志链。 | N/A                                            |

#### B. 实时日志流 (Real-Time Stream) - WebSocket (BE-603)

- **端点:** `ws://<server_url>/ws/logs`
- **功能:**
    1. 客户端连接后，服务器开始推送所有**新产生**的日志条目。
    2. 客户端可以发送初始筛选条件 (e.g., `{ "levels": ["ERROR", "WARN"] }`)，服务器仅推送符合条件的实时日志。
    3. 前端的**暂停/恢复**功能将控制 WebSocket 连接上的数据消费，而不是断开连接。

### 4. Node.js 服务端实现 (log_producer_service.ts)

以下是 Node.js 服务的代码骨架。

```typescript
// Node.js Log Producer and API Service (TypeScript)
//
// 该文件是后端服务层 (BE/Service Layer) 的蓝图，使用 Node.js/Express 搭建。
// 它演示了:
// 1. 日志生成 (Producer)
// 2. 模拟 MySQL 持久化 (使用内存数组)
// 3. Express API 服务的框架 (用于历史数据和统计查询)
// 4. WebSocket 实时推送 (BE-603)

import * as express from 'express';
import * as http from 'http'; // 用于将 Express 服务器与 WebSocket 绑定

// 在实际 Node.js 项目中，您将使用以下导入:
// import * as mysql from 'mysql2/promise'; // 用于 MySQL 交互
// import * as WebSocket from 'ws'; // 用于 WebSocket 实时流

// --- 类型定义 ---
interface LogEntry {
    id: string;
    timestamp: Date;
    module: 'AUTH' | 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'UI' | 'SYSTEM';
    level: 'ERROR' | 'WARN' | 'INFO' | 'SUCCESS';
    message: string;
    traceId: string;
    details: object | null; // 对应 MySQL 的 JSON 字段
}

// --- WebSocket 模拟 (BE-603) ---
// 由于环境限制，我们在此模拟 WebSocket 客户端连接和发送功能。
interface MockClient {
    id: string;
    // 客户端发送给服务器的实时筛选条件
    filters: {
        levels: LogEntry['level'][];
        modules: LogEntry['module'][];
        searchText: string;
    };
    send(data: string): void; // 模拟的发送函数
    readyState: number; // 模拟连接状态 (1 = OPEN)
}

const WebSocket = { OPEN: 1 }; // 模拟 WebSocket 状态常量
let mockWebSocketClients: MockClient[] = [];

// --- 全局常量 ---
const PORT = 3000;
const LOG_LEVELS: LogEntry['level'][] = ['ERROR', 'WARN', 'INFO', 'SUCCESS'];
const LOG_MODULES: LogEntry['module'][] = ['AUTH', 'ORDER', 'PAYMENT', 'INVENTORY', 'UI' | 'SYSTEM'];

// --- 模拟数据库 (MySQL 持久化 - BE-601) ---
const mockLogDatabase: LogEntry[] = [];
let logCounter = 0;

/**
 * 模拟生成一个逼真的日志条目。
 */
const generateMockLog = (): LogEntry => {
    logCounter += 1;
    const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];
    const module = LOG_MODULES[Math.floor(Math.random() * LOG_MODULES.length)];
    const traceId = Math.random().toString(36).substring(2, 9).toUpperCase();

    let message = `请求 #${logCounter} 处理成功。`;
    let details: object | null = null;

    if (level === 'ERROR' || level === 'WARN') {
        message = level === 'ERROR' ? `执行 ${module} 逻辑失败。HTTP 500。` : `警告: ${module} 模块检测到高负载。`;
        details = {
            errorType: level === 'ERROR' ? "ServiceUnavailable" : "PerformanceWarning",
            endpoint: `/api/${module.toLowerCase()}/execute`,
            durationMs: Math.floor(Math.random() * 500),
        };
        if (level === 'ERROR') {
             details = {...details, stackTrace: "详细堆栈追踪信息..."}
        }
    } else if (level === 'INFO') {
        message = `用户 ${Math.random().toString(36).substring(2, 7)} 创建了新会话。`;
    }
    
    return {
        id: `log-${Date.now()}-${logCounter}`,
        timestamp: new Date(),
        module,
        level,
        message,
        traceId,
        details,
        createTime: new Date()
    };
};

/**
 * 检查日志是否符合客户端的实时筛选条件。
 * @param log 日志条目。
 * @param clientFilters 客户端设定的筛选条件。
 * @returns 是否匹配。
 */
const logMatchesFilters = (log: LogEntry, clientFilters: MockClient['filters']): boolean => {
    const { levels, modules, searchText } = clientFilters;

    // 级别筛选
    if (levels.length > 0 && !levels.includes(log.level)) {
        return false;
    }

    // 模块筛选
    if (modules.length > 0 && !modules.includes(log.module)) {
        return false;
    }
    
    // 文本筛选 (简化，只匹配消息和 Trace ID)
    if (searchText) {
        const lowerSearchText = searchText.toLowerCase();
        if (!log.message.toLowerCase().includes(lowerSearchText) && 
            !log.traceId.toLowerCase().includes(lowerSearchText)) {
            return false;
        }
    }

    return true;
}


/**
 * 模拟将日志条目持久化到数据库 (MySQL) 并广播给 WebSocket 客户端。
 * @param log 要保存的日志条目。
 */
const persistLogToDB = (log: LogEntry): void => {
    // 1. MySQL 持久化 (BE-601)
    /*
    const query = `INSERT INTO logs (id, timestamp, module, level, message, trace_id, details)
                   VALUES (?, ?, ?, ?, ?, ?, JSON_COMPACT(?))`;
    mysqlPool.query(query, [log.id, log.timestamp, log.module, log.level, log.message, log.traceId, JSON.stringify(log.details)]);
    */

    // 模拟持久化到内存数组:
    mockLogDatabase.unshift(log);
    if (mockLogDatabase.length > 10000) {
        mockLogDatabase.pop();
    }

    // 2. WebSocket 实时广播 (BE-603)
    mockWebSocketClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            if (logMatchesFilters(log, client.filters)) {
                // 实时推送数据
                client.send(JSON.stringify(log));
            }
        }
    });
};

/**
 * 模拟启动连续的日志流生成器。
 */
const startLogStream = () => {
    setInterval(() => {
        const newLog = generateMockLog();
        persistLogToDB(newLog); // 调用持久化和广播函数
    }, 50); // 每 50ms 生成一个日志 (20 logs/秒)
    console.log(`[Stream] 日志流启动，每 50ms 生成一次日志并持久化/广播。`);
};


// --- EXPRESS API 服务器设置 (BE-602) ---
const app = express();
app.use(express.json());

// 启用 CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// BE-602: 历史日志获取端点 (模拟实现)
app.get('/api/v1/logs', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // 实际的 MySQL 查询示例:
    // SELECT * FROM logs WHERE ... ORDER BY timestamp DESC LIMIT ?, ?
    
    // 模拟分页和查询:
    const logs = mockLogDatabase.slice(offset, offset + limit);

    return res.json({
        total: mockLogDatabase.length,
        logs: logs,
    });
});

// BE-602: 统计信息获取端点 (模拟实现)
app.get('/api/v1/stats', (req, res) => {
    // 实际应用中将是复杂的 MySQL 聚合查询 (COUNT(), GROUP BY, DATE_FORMAT, SUM)
    
    // 模拟基于内存数据的简单统计
    const totalCount = mockLogDatabase.length;
    const errorCount = mockLogDatabase.filter(l => l.level === 'ERROR').length;
    const infoCount = mockLogDatabase.filter(l => l.level === 'INFO').length;

    return res.json({
        totalLogs: totalCount,
        errorRate: totalCount > 0 ? (errorCount / totalCount) * 100 : 0,
        recentInfoLogs: infoCount,
        uptimeSeconds: process.uptime(),
    });
});


/**
 * 初始化 WebSocket 服务器并处理连接。
 * @param httpServer Express 创建的 HTTP 服务器实例。
 */
const initializeWebSocketServer = (httpServer: http.Server) => {
    // 实际应用中使用: const wss = new WebSocket.Server({ server: httpServer, path: '/ws/logs' });

    // 模拟 WebSocket 连接处理
    httpServer.on('upgrade', (request, socket, head) => {
        if (request.url === '/ws/logs') {
            const clientId = `ws-${Math.random().toString(36).substring(2, 10)}`;
            
            // 模拟客户端对象
            const mockClient: MockClient = {
                id: clientId,
                // 默认筛选器：全部通过
                filters: { levels: LOG_LEVELS, modules: LOG_MODULES, searchText: '' }, 
                readyState: WebSocket.OPEN,
                send: (data: string) => {
                    // console.log(`[WS] Client ${clientId} received data.`);
                }
            };
            
            mockWebSocketClients.push(mockClient);
            console.log(`[WS] 客户端 ${clientId} 已连接。当前连接数: ${mockWebSocketClients.length}`);

            // 模拟断开连接和消息接收逻辑 (在实际 ws 库中，这会通过事件完成)
            setTimeout(() => {
                // 模拟客户端发送初始筛选条件 (BE-603)
                // 例如: 客户端只想要 ERROR 和 WARN 级别的日志
                mockClient.filters = { 
                    levels: ['ERROR', 'WARN'],
                    modules: LOG_MODULES,
                    searchText: ''
                };
                console.log(`[WS] 客户端 ${clientId} 更新了筛选器：只接收 ERROR/WARN。`);
            }, 2000);

            // 模拟客户端断开连接
            socket.on('close', () => {
                mockWebSocketClients = mockWebSocketClients.filter(c => c.id !== clientId);
                console.log(`[WS] 客户端 ${clientId} 已断开。当前连接数: ${mockWebSocketClients.length}`);
            });
            
            // 实际中这里需要调用 ws.handleUpgrade 来完成握手
        } else {
            socket.destroy();
        }
    });

    console.log(`[WS] WebSocket 实时流端点在 ws://localhost:${PORT}/ws/logs 准备就绪。`);
}


// --- 启动服务器 ---
const httpServer = http.createServer(app);

// 初始化 WebSocket 服务器
initializeWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`[Server] Node.js 服务已启动，监听端口 ${PORT}`);
    console.log(`[API] 历史日志查询 API: http://localhost:${PORT}/api/v1/logs`);
    startLogStream();
});
});
// 您可以在本地 Node.js 环境中运行此服务骨架。

```
