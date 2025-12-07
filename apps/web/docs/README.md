# Reservee Web App Documentation

Documentation for the Reservee web application.

## 📚 Available Documentation

### Authentication
📁 **[auth/](./auth/)** - Better Auth implementation
- Setup guide
- Middleware configuration
- Session management
- Security considerations

## 🏗️ Architecture

**Monorepo Structure:**
```
reservee/
├── apps/
│   └── web/          # Next.js frontend (this app)
└── packages/
    └── ...           # Shared packages
```

**Tech Stack:**
- **Framework**: Next.js 16 (App Router)
- **Authentication**: Better Auth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm type-check

# Build for production
pnpm build
```

## 📖 More Documentation

- Authentication: [./auth/README.md](./auth/README.md)

---

*For questions or issues, please refer to the specific documentation sections above.*
