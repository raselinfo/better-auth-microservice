<!-- Plan for the Dynamic Auth Instance -->

# Dynamic Auth Service Plan (Multi-Tenancy/Multi-Environment)

## Objective
Enable the creation and management of multiple isolated Auth Services (instances) dynamically from the Admin Dashboard. Users can define environments (e.g., Development, Staging, Production), each with its own database connection, authentication providers, and configuration settings.

## 1. Architecture Overview
- **Meta-Layer**: A central management layer responsible for storing configuration and instantiating Auth Services.
- **Dynamic Registry**: A Singleton `AuthRegistry` that manages the lifecycle of multiple `better-auth` instances in memory.
- **Request Routing**: Middleware to identify the target environment (via Header, Subdomain, or API Key) and route the request to the correct instance.

## 2. Data Modeling (Meta-Database)
We need a storage mechanism for the configuration of each auth instance.

### `auth_instances` Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier for the environment/instance. |
| `name` | String | Friendly name (e.g., "Prod App A"). |
| `slug` | String | Unique slug for routing (e.g., `app-a-prod`). |
| `db_config` | JSON (Encrypted) | DB connection string or credentials. |
| `auth_config` | JSON | Better-Auth config (providers, secrets, options). |
| `is_active` | Boolean | Enable/Disable the instance. |
| `created_at` | Timestamp | |
| `updated_at` | Timestamp | |

## 3. Core Components

### A. Configuration Manager
- Responsible for CRUD operations on the `auth_instances` table.
- Validates configuration schemas (Zod) before saving.
- Encrypts sensitive data (client secrets, DB passwords) at rest.

### B. Auth Instance Registry (`AuthManager`)
A Singleton class acting as a factory and cache.
- **Map**: `Map<string, BetterAuthInstance>` (Key: Instance ID or Slug).
- **Methods**:
    - `getInstance(id)`: Returns existing instance or creates a new one.
    - `reloadInstance(id)`: Forces re-initialization (after config update).
    - `removeInstance(id)`: Cleans up resources.
- **Lazy Loading**: Instances are only created when first requested.

### C. Dynamic Database Adapter
- Instead of a static `drizzleAdapter`, we need a factory function.
- `createAdapter(config)`: Connects to the specific DB defined in the instance config.
- **Connection Pooling**: Needs careful management to avoid exhausting connections if many instances exist. Consider a shared pool if tenants use the same DB server, or distinct pools for distinct servers.

### D. Routing Middleware
- **Identification**: Inspect `X-Auth-Instance-Id` header or subdomain.
- **Resolution**:
    1. Extract ID.
    2. Call `AuthManager.getInstance(id)`.
    3. Mount the specific auth instance handler for the request.
- **Error Handling**: Return 404 if instance doesn't exist or 503 if initialization fails.

## 4. Implementation Phases

### Phase 1: Meta-Schema & CRUD
1. Create `auth_instances` schema in the main (admin) database.
2. Build Admin Dashboard UI to Create/Edit/Delete instances.
3. Implement backend endpoints for these operations.

### Phase 2: The `AuthManager`
1. Implement the Registry class.
2. Create the "Hydrator" logic: Fetch config from DB -> Construct `BetterAuthOptions` -> `betterAuth()`.
3. Handle basic caching.

### Phase 3: Dynamic Routing
1. Create a wildcard route handler (e.g., `/api/v1/:instance/*`).
2. Implement the middleware to resolve instance and forward request.

### Phase 4: Database Isolation
1. Implement dynamic Drizzle client creation.
2. Ensure migrations can be run for specific instances from the dashboard.

## 5. Security & Performance
- **Secrets Management**: Use AES-256 encryption for storing `client_secret` and DB credentials in the Meta-DB.
- **Isolation**: Ensure one instance cannot access another's data (separate DBs or Schemas).
- **Memory Management**: Implement an LRU (Least Recently Used) eviction policy in `AuthManager` to unload unused instances from memory.
