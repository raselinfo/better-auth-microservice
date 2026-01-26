Act you are expert in javascript, typescript, hono, better-auth. 

I am going to create a auth microservice. where i can use this microservice to authenticated my other microservices.

The auth service should have the following features:
- User Signin with magic link
- User Signin with provider (Google and Facebook)
- I can add custom properties to the user table and those properties are also included in the user session.
- After new user signin i will call a webhook with necessary user payload to notify the other microservices (API)
- I can manage my auth service users roles and permissions. the auth service should allow me to manage user role and permissions. I can add or remove roles to a user as well as assign or revoke permissions to those users. 
- I have other microservice backend so i need a client credential flow solution to authenticated those microservices so that when i need to perform any action from the other microservice (backend) to the auth service (API) i need to use a client credential flow token. Or you can suggest any other solution for that.
- I also plan to create a admin dashboard from where i can manage my user role, permissions, client client credential flow for other service authentication. it will be build using nextjs 15. but my auth service will not bounded with nextjs 15


Technology Stack:
- For Auth microservice i am going to use typescript, hono, better-auth, drizzle-orm, postgresql, zod, resend.
- For admin application i am going to use nextjs 15, vite, tailwindcss, shadcn-ui, typescript.

For above technology stack i am going to use latest version of each technology.

My Database URL: postgres://postgres:postgres@localhost:5432/auth_db

# Current apps
    - ./auth-server (Port 4000)
        - Uses Better Auth with Hono
        - Implements M2M via Client Credentials (oauth-provider)
        - Custom middleware for M2M token validation
    - ./admin (Port 3001)
        - Next.js 15 Admin Dashboard
        - Manages Users, Roles, Permissions, and OAuth Clients
    - ./web (Port 3000)
        - Client application
    - ./express-backend (Port 5001)
        - Example microservice consuming Auth Service via M2M flow

# Implementation Details

## Machine-to-Machine (M2M) Authentication
- **Flow**: Client Credentials Grant (RFC 6749)
- **Client Storage**: `oauthClient` table (Secrets hashed via SHA-256 -> Base64Url)
- **Token Storage**: `oauthAccessToken` table (Tokens hashed via SHA-256 -> Base64Url)
- **Auth Method**: `client_secret_basic` (Authorization: Basic base64(client_id:client_secret))
- **Middleware**: `m2mMiddleware` in `auth-server/src/index.ts` validates tokens against DB (hashing input token before lookup).

## User Management
- **Permissions**: Managed via `permissions` column in `user` table.
- **Roles**: `admin`, `user` (default).
- **Custom Properties**: Stored in `properties` JSONB column.

## Commands
- **Auth Server**: `cd auth-server && npm run dev`
- **Admin**: `cd admin && npm run dev`
- **Express Backend**: `cd express-backend && npm run dev`

for package manager i am going to use pnpm

i have already run the all application.
1. admin on port 3001
2. auth server on port 4000
3. web on port 3000
4. express backend on port 5001

Don't need to run the apps again. Don't run pnpm dev again.
