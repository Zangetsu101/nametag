# Contributing to Nametag

Thanks for your interest in contributing! This guide will help you get set up and understand how to work on Nametag.

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Getting Started

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/nametag.git
cd nametag
```

2. Copy the environment file and fill in required values:
```bash
cp .env.example .env
```

At minimum, you need to set:
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `DB_PASSWORD` - Any secure password for local development
- `REDIS_PASSWORD` - Any secure password for local development
- `CRON_SECRET` - Generate with `openssl rand -base64 16`
- `RESEND_API_KEY` - Get a free API key at [resend.com](https://resend.com) (optional for basic development)
- `EMAIL_DOMAIN` - Your test domain (optional for basic development)

3. Start the development environment:
```bash
docker-compose up
```

This starts:
- PostgreSQL database on port 5432
- Redis on port 6379
- Next.js app on port 3000 with hot-reload

4. Set up the database (in a new terminal):
```bash
./scripts/setup-db.sh
```

This runs migrations, generates Prisma client, and seeds the database with demo data.

5. Access the app at `http://localhost:3000`

Demo credentials:
- Email: `demo@nametag.one`
- Password: `password123`

### Alternative: Local Development (without Docker)

If you prefer not to use Docker:

1. Install dependencies:
```bash
npm install
```

2. Set up a local PostgreSQL database and update `DATABASE_URL` in `.env`

3. Run migrations:
```bash
npx prisma migrate dev
npx prisma db seed
```

4. Start the dev server:
```bash
npm run dev
```

## Development Workflow

### Working with the Database

**Making schema changes:**
```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
npx prisma migrate dev --name describe_your_change

# 3. Generate Prisma Client (usually automatic, but sometimes needed)
npx prisma generate
```

**Useful database commands:**
```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (deletes all data!)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

### Running Tests

```bash
# Unit tests (watch mode)
npm run test

# Unit tests (single run)
npm run test:run

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build (catches many issues)
npm run build
```

### Debugging

- Check Docker logs: `docker-compose logs -f app`
- Check database logs: `docker-compose logs -f db`
- Use Prisma Studio to inspect data: `npx prisma studio`
- Add console.logs or use your IDE's debugger
- Check the browser console for frontend issues

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning and changelog generation.

**Format:**
```
<type>[optional scope]: <description>

[optional body]
```

**Types:**
- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation only
- `style:` - Formatting, semicolons, etc.
- `refactor:` - Code restructuring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat: add CSV export for contacts
fix: resolve birthday reminder timezone issue
docs: update API documentation
refactor: simplify graph rendering logic
```

**Breaking changes** (triggers major version bump):
```bash
feat!: redesign authentication system

BREAKING CHANGE: Users must re-authenticate after upgrade
```

See [VERSIONING.md](docs/VERSIONING.md) for more details.

## How to Contribute

### Reporting Bugs

Before creating a bug report, search existing issues to avoid duplicates.

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment (OS, browser, Node version)

### Suggesting Features

Feature requests are welcome! Please describe:
- What problem it solves
- Who would benefit from it
- Possible implementation approach (optional)

### Submitting Pull Requests

1. **Create a feature branch** from `master`:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

2. **Make your changes** following our code style (see below)

3. **Test your changes**:
```bash
npm run test:run
npm run build
```

4. **Commit with clear messages**:
```bash
git commit -m "feat: add birthday reminder notifications"
git commit -m "fix: resolve duplicate person creation"
git commit -m "docs: update API documentation"
```

5. **Push and create a PR**:
```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

**PR Guidelines:**
- Keep PRs focused on a single feature or fix
- Link to related issues
- Add a clear description of what changed and why
- Include screenshots for UI changes
- Ensure tests pass and build succeeds
- Update documentation if needed

## Code Style

We use ESLint and Prettier for code formatting. Most issues are caught automatically.

**General guidelines:**
- TypeScript for all code (no `any` types unless absolutely necessary)
- Functional React components with hooks
- Tailwind CSS for styling (no inline styles or CSS modules)
- Follow existing patterns in the codebase
- Keep components small and focused
- Write meaningful variable and function names

**File organization:**
- Components go in `/components`
- Pages go in `/app`
- API routes go in `/app/api`
- Utilities go in `/lib`
- Types go alongside the code that uses them

**React patterns:**
```typescript
// Use functional components with hooks
export default function MyComponent({ prop }: Props) {
  const [state, setState] = useState<string>('');

  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}

// Use TypeScript interfaces for props
interface Props {
  prop: string;
}
```

**API routes:**
```typescript
// Always validate input
const body = await request.json();
const validated = schema.parse(body);

// Always handle errors
try {
  // ...
} catch (error) {
  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  );
}
```

## Project Structure

```
/app                          # Next.js app directory (routes)
  /api                        # API endpoints
    /people                   # Person CRUD operations
    /groups                   # Group CRUD operations
    /relationships            # Relationship CRUD operations
    /billing                  # Stripe integration
    /cron                     # Scheduled jobs
  /dashboard                  # Dashboard page
  /people                     # People management pages
  /groups                     # Groups management pages
  /settings                   # Settings pages
  /login, /register, etc.     # Auth pages

/components                   # React components
  /ui                         # Reusable UI components (buttons, inputs, etc.)
  /billing                    # Billing-specific components
  /graphs                     # D3.js network graph components

/lib                          # Utility functions and shared code
  /auth                       # Authentication utilities (NextAuth config)
  /prisma                     # Prisma client singleton
  /billing                    # Stripe and subscription logic
  /rate-limit                 # Rate limiting with Redis
  /email                      # Email sending (Resend)

/prisma                       # Database schema and migrations
  /migrations                 # Migration files
  schema.prisma               # Database schema

/scripts                      # Utility scripts
  setup-db.sh                 # Database setup script
  backup-database.sh          # Backup script
  restore-database.sh         # Restore script

/docs                         # Documentation and screenshots
/public                       # Static assets
```

## Tech Stack Overview

Understanding the stack helps when contributing:

- **Next.js 15**: React framework with App Router (file-based routing)
- **TypeScript**: Type safety across the codebase
- **Tailwind CSS**: Utility-first CSS framework
- **PostgreSQL**: Primary database
- **Prisma**: Type-safe database ORM
- **Redis**: Rate limiting and caching
- **NextAuth.js**: Authentication (credentials provider)
- **Resend**: Transactional emails
- **Stripe**: Payment processing (subscription billing)
- **D3.js**: Network graph visualization
- **Vitest**: Unit testing
- **Playwright**: E2E testing

## Common Tasks

### Adding a new API endpoint

1. Create file in `/app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` functions as needed
3. Validate input with Zod schemas
4. Use Prisma for database operations
5. Return `NextResponse.json()`

### Adding a new page

1. Create file in `/app/your-page/page.tsx`
2. Export default async function for server component
3. Use `auth()` to check authentication
4. Fetch data server-side when possible
5. Use client components (`'use client'`) only when needed (interactivity)

### Adding a database field

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update TypeScript types if needed
4. Update relevant components/API routes

### Working with graphs

The network graphs use D3.js force-directed layouts. Key files:
- `/components/graphs/NetworkGraph.tsx` - Main graph component
- `/lib/graph-utils.ts` - Graph transformation utilities

## Questions or Issues?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 License.
