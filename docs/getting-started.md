# Getting Started

Welcome to the Admin Cloudflare project! This guide will help you get started with setting up your development environment and understanding the basics of the project.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version >= 18)
- [pnpm](https://pnpm.io/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare Workers CLI)
- A Turso database (refer to the [Database Notebook](notebooks/DATABASE.md) for setup instructions)

## Setting Up Your Development Environment

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd admin-cloudflare
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   - Create `.dev.vars` files in the `apps/api` and `apps/web` directories based on the `.example` files.
   - Update the variables with your specific configuration, including Clerk and Stripe API keys, and Turso database credentials.

4. **Start the development servers:**

   ```bash
   pnpm run dev
   ```

   This command will start the webhook worker, REST API worker, Durable Object, local Turso database, and the frontend development server.

## Understanding the Project Structure

The project is organized as a monorepo with the following main directories:

- `apps/api`: Contains the Cloudflare Workers REST API.
- `apps/web`: Contains the React frontend application.
- `apps/webhook-worker`: Contains the Cloudflare Worker for handling webhooks.
- `docs`: Contains the project documentation.
- `packages`: Contains shared packages and libraries.

## Key Concepts

- **Cloudflare Workers**: The serverless platform for the backend logic.
- **TinyBase**:  Used for real-time state synchronization between the server and the client.
- **Turso (LibSQL)**: The database used for persistent data storage.
- **Durable Objects**: Used for coordinating real-time updates and managing state.

## Next Steps

- Explore the [Architecture Overview](architecture.md) to understand the system's components and how they interact.
- Refer to the [Technical Notebooks](notebooks/README.md) for detailed information on specific features and technologies.

If you encounter any issues, please refer to the troubleshooting section in the [README.md](README.md) or reach out to the development team.