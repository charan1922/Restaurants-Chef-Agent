# 👨‍🍳 Chef Agent

A standalone kitchen management agent for the Restaurant AI system. Handles order preparation, inventory tracking, and ETA calculation via A2A (Agent-to-Agent) protocol.

## 🎯 Features

- **Order Processing**: Receive and process orders from Waiter Agent
- **ETA Calculation**: Smart estimation based on dish complexity and kitchen load
- **Inventory Management**: Track ingredients, deduct stock, trigger procurement
- **Cost Tracking**: Calculate COGS (Cost of Goods Sold) per order
- **A2A Protocol**: Standard agent communication protocol for interoperability

## 🏗️ Architecture

```
┌─────────────────────┐
│    Waiter Agent     │
│    (Port 4444)      │
└──────────┬──────────┘
           │
           │ A2A Protocol (HTTP)
           │
           ▼
┌─────────────────────┐
│    Chef Agent       │
│    (Port 5555)      │
├─────────────────────┤
│  /api/a2a           │ ← Main message handler
│  /.well-known/      │ ← Agent card discovery
│    agent-card.json  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    PostgreSQL       │
│    (Shared DB)      │
└─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (shared with Waiter Agent)

### Installation

```bash
cd chef-agent
pnpm install
```

### Configuration

Create a `.env.local` file:

```env
# Server
PORT=5555

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=demo
DB_USER=postgres
DB_PASSWORD=postgres

# Tenant (for multi-tenant support)
TENANT_ID=tenant-pista-house
TENANT_NAME=Pista House
```

### Running

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

The Chef Agent will be available at `http://localhost:5555`

## 📡 A2A Protocol

### Agent Card Discovery

```bash
curl http://localhost:5555/.well-known/agent-card.json
```

### Message Types

#### PLACE_ORDER
Place a new order with the kitchen.

```bash
curl -X POST http://localhost:5555/api/a2a \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-pista-house" \
  -d '{
    "type": "PLACE_ORDER",
    "payload": {
      "orderId": "550e8400-e29b-41d4-a716-446655440000",
      "tableId": "T1",
      "items": [
        {
          "itemId": "menu-item-1",
          "itemName": "Chicken Biryani",
          "quantity": 2
        }
      ],
      "timestamp": "2024-12-13T12:00:00Z",
      "priority": "normal"
    }
  }'
```

#### REQUEST_STATUS
Get the current status of an order.

```bash
curl -X POST http://localhost:5555/api/a2a \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-pista-house" \
  -d '{
    "type": "REQUEST_STATUS",
    "payload": {
      "orderId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }'
```

#### CANCEL_ORDER
Cancel an order (if not yet completed).

```bash
curl -X POST http://localhost:5555/api/a2a \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-pista-house" \
  -d '{
    "type": "CANCEL_ORDER",
    "payload": {
      "orderId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }'
```

## 📁 Project Structure

```
chef-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── a2a/
│   │   │       ├── route.ts           # Main A2A handler
│   │   │       └── handlers/
│   │   │           ├── place-order.ts
│   │   │           ├── request-status.ts
│   │   │           └── cancel-order.ts
│   │   ├── .well-known/
│   │   │   └── agent-card.json/
│   │   │       └── route.ts           # Agent discovery
│   │   ├── layout.tsx
│   │   └── page.tsx                   # Status page
│   ├── lib/
│   │   ├── a2a/
│   │   │   └── schema.ts              # A2A message schemas
│   │   ├── db/
│   │   │   └── postgres.ts            # Database connection
│   │   └── utils/
│   │       └── tenant.ts              # Tenant utilities
│   └── services/
│       ├── eta-calculator.ts          # ETA calculation
│       ├── cost-calculator.ts         # COGS calculation
│       └── inventory.ts               # Inventory management
├── package.json
├── tsconfig.json
└── next.config.ts
```

## 🔗 Integration with Waiter Agent

The Waiter Agent connects to the Chef Agent using the A2A client:

```typescript
// In waiter-agent, update .env.local
CHEF_AGENT_URL=http://localhost:5555
```

The waiter's `chef-client.ts` will automatically route orders to this Chef Agent.

## 📊 Database Schema

The Chef Agent uses these tables (shared with Waiter Agent):

- `chef_orders` - Kitchen order queue
- `menu_items` - Menu catalog with prep times
- `ingredients` - Ingredient stock levels
- `recipes` - Ingredient requirements per dish
- `inventory_transactions` - Stock audit trail
- `purchase_orders` - Procurement requests

## 📝 License

MIT

---

**Part of the Restaurant AI Multi-Agent System**
