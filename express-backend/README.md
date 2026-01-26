# Express Backend

Express.js backend with TypeScript configuration.

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── types/          # TypeScript types
└── index.ts        # Entry point
```