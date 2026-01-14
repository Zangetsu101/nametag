# Nametag

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)

Nametag is a personal relationships manager that helps you remember the people in your life and how they're connected. Track birthdays, contact information, how people are connected, and visualize your network as an interactive graph.

![Dashboard](docs/screenshots/sc1.png)
*Dashboard with network overview and statistics*

**[Try the hosted version →](https://nametag.one)**

## Why Nametag?

We all have hundreds of contacts scattered across social media, phone books, and email. But can you remember when you last talked to an old friend? Their kids' names? Their birthday?

Nametag solves this by giving you a single place to manage your personal network. It's like a CRM, but for your actual relationships instead of sales prospects.

## Screenshots

<details>
<summary>View screenshots</summary>

![People Management](docs/screenshots/sc2.png)
![People Creation](docs/screenshots/sc7.png)
*Create and manage your contacts with detailed information*

---

![Person Details](docs/screenshots/sc3.png)
![Relationship Types](docs/screenshots/sc6.png)
*Define and manage custom relationship types*

---

![Person Details](docs/screenshots/sc4.png)
*Keep up-to-date information about the people you care about*

---

![Groups](docs/screenshots/sc5.png)
*Organize people into custom groups*

---

![Light Mode](docs/screenshots/sc8.png)
![Light Mode](docs/screenshots/sc9.png)
*Clean light theme for comfortable daytime use*

</details>

## Features

- Track people with flexible attributes (name, birthday, important dates, and notes for everything else)
- Map relationships between people (family, friends, colleagues)
- Visualize your network with interactive graphs
- Organize contacts into custom groups
- Set reminders for important dates and staying in touch
- Full dark mode support
- Multiple languages (English and Spanish)
- Mobile-responsive design

## Hosted vs Self-Hosted

**Hosted Service**: We offer a hosted version at [nametag.one](https://nametag.one) with a generous free tier (50 people) and affordable paid plans starting at $1/month. The hosted service helps fund development and maintenance of the open source project.

**Self-Hosting**: You can also run Nametag on your own infrastructure for free with these benefits:
- No account limits - store unlimited contacts
- No email service required - accounts are auto-verified
- Complete data ownership and privacy
- Free forever

This guide covers self-hosting setup.

## Self-Hosting with Docker

### Quick Start

1. Create a directory for Nametag:
```bash
mkdir nametag && cd nametag
```

2. Create a `docker-compose.yml` file:
```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: nametag
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: nametag_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  app:
    image: ghcr.io/mattogodoy/nametag:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://nametag:${DB_PASSWORD}@db:5432/nametag_db
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - CRON_SECRET=${CRON_SECRET}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    depends_on:
      - db
      - redis

  cron:
    image: alpine:3.19
    restart: unless-stopped
    command: >
      sh -c "
        echo '0 8 * * * wget -q -O - --header=\"Authorization: Bearer '\"$$CRON_SECRET\"'\" http://app:3000/api/cron/send-reminders > /proc/1/fd/1 2>&1' > /etc/crontabs/root &&
        crond -f -l 2
      "
    environment:
      - CRON_SECRET=${CRON_SECRET}
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

3. Create a `.env` file with required variables:
```bash
# Generate secrets with: openssl rand -base64 32

# Database
DB_PASSWORD=your-secure-database-password

# Redis
REDIS_PASSWORD=your-secure-redis-password

# Application URLs
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth (must be at least 32 characters)
NEXTAUTH_SECRET=your-nextauth-secret-minimum-32-characters

# Cron authentication
CRON_SECRET=your-cron-secret-minimum-16-characters

# Email (OPTIONAL - only needed for password resets and reminders)
# Self-hosted instances work without email - new accounts are auto-verified
# Sign up at https://resend.com if you want email functionality
#RESEND_API_KEY=re_your_api_key
#EMAIL_DOMAIN=yourdomain.com
```

4. Start the services:
```bash
docker-compose up -d
```

The database will be automatically set up on first run.

5. Access Nametag at `http://localhost:3000`

### Environment Variables

#### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Full URL where your app is hosted | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Public URL for redirects | `https://yourdomain.com` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption (min 32 chars) | Generate with `openssl rand -base64 32` |
| `CRON_SECRET` | Secret for cron job authentication | Generate with `openssl rand -base64 16` |
| `REDIS_URL` | Redis connection URL | `redis://:password@redis:6379` |
| `REDIS_PASSWORD` | Redis authentication password | Generate with `openssl rand -base64 32` |

#### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key from [Resend](https://resend.com) for email functionality | Not required for self-hosted |
| `EMAIL_DOMAIN` | Verified domain for sending emails | Not required for self-hosted |
| `DISABLE_REGISTRATION` | Disable user registration after first user | `false` |
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Email Setup (Optional)

Email configuration is **optional for self-hosted instances**. Nametag works perfectly without it:

- **Without email**: New accounts are automatically verified and users can log in immediately. Password resets and contact reminders are unavailable.
- **With email**: Enables password reset functionality and contact reminder emails via [Resend](https://resend.com).

If you want email functionality:

1. Sign up for a free Resend account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Add `RESEND_API_KEY` and `EMAIL_DOMAIN` to your `.env` file

**Note**: The hosted service at [nametag.one](https://nametag.one) requires email verification for security, but self-hosted instances are designed for personal use and auto-verify all accounts.

### Restricting Registration (Optional)

For public-facing instances, you may want to prevent strangers from creating accounts.

Set `DISABLE_REGISTRATION=true` in your `.env` file. This allows:
- The first user to register normally (when no users exist)
- All subsequent registration attempts are blocked

This is ideal for personal instances where only you (and potentially family members you manually add) should have access. The instance owner can register first, then registration automatically closes.

To allow additional users later, set `DISABLE_REGISTRATION=false` and restart the service.

### Reverse Proxy (Production)

For production deployments, use a reverse proxy like Nginx or Caddy with SSL:

**Caddy example:**
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

**Nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Tech Stack

- **Framework**: Next.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for rate limiting
- **Styling**: Tailwind CSS
- **Graphs**: D3.js for network visualization
- **Auth**: NextAuth.js
- **Email**: Resend

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE). This ensures that if you modify and deploy Nametag, you must make your source code available.

## Support

- **Hosted version**: For support with the hosted service, email support@nametag.one
- **Self-hosting**: Open an issue on GitHub
- **Security issues**: See [SECURITY.md](SECURITY.md)

## Support Development

If you find Nametag useful and want to support its development, you can buy me a coffee! ☕

<a href="https://www.buymeacoffee.com/mattogodoy" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

Built with care for people who care about people.
