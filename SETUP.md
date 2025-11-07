# Setup Guide

## Quick Start

### 1. Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Git
- Supabase account
- OpenSSL (for generating encryption keys)

### 2. Clone Repository

```bash
git clone https://github.com/allomart1/copytradinj.git
cd copytradinj
```

### 3. Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend
pnpm install
cd ..
```

### 4. Environment Configuration

#### Frontend Environment

Create `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SENTRY_DSN=your_sentry_dsn (optional)
VITE_LOGROCKET_APP_ID=your_logrocket_app_id (optional)
```

#### Backend Environment

Create `backend/.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=3001

# Session Key Encryption - CRITICAL FOR SECURITY
SESSION_KEY_ENCRYPTION_SECRET=your_generated_secret_here
```

**Generate Encryption Secret:**

```bash
# Run this command to generate a secure 32-byte key
openssl rand -base64 32

# Example output:
# 8xK9mP2nQ5rT7vW1yZ3aB4cD6eF8gH0iJ2kL4mN6oP8=

# Copy the output and paste it as SESSION_KEY_ENCRYPTION_SECRET value
```

⚠️ **IMPORTANT**: 
- Never commit the actual encryption key to version control
- Use a different key for production vs development
- Store production keys securely (e.g., in environment variables, secrets manager)
- If you lose this key, all existing session keys will be unrecoverable

### 5. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. In your Supabase project dashboard, go to SQL Editor

3. Run the migration scripts **in order**:
   
   **First:** Run `supabase/migrations/20240101000001_create_update_function.sql`
   ```sql
   -- This creates the update_updated_at_column() function
   ```

   **Second:** Run `supabase/migrations/20240101000002_create_session_keys_table.sql`
   ```sql
   -- This creates the session_keys table
   ```

   **Third:** Run `supabase/migrations/schema.sql`
   ```sql
   -- This creates all other tables
   ```

4. Verify tables are created:
   - users
   - master_traders
   - copy_settings
   - trades
   - positions
   - session_keys ✨ (new)

### 6. Start Development Servers

#### Frontend

```bash
pnpm dev
```

The frontend will be available at `http://localhost:5173`

#### Backend

In a separate terminal:

```bash
cd backend
pnpm dev
```

The backend will be available at `http://localhost:3001`

## Configuration Details

### Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for project to be ready

2. **Get API Keys**
   - Go to Project Settings > API
   - Copy the Project URL
   - Copy the `anon` public key (for frontend)
   - Copy the `service_role` secret key (for backend)

3. **Run Migrations**
   - Go to SQL Editor
   - Create new query
   - Run migrations in order (see Database Setup above)

4. **Verify Setup**
   - Go to Table Editor
   - Verify all tables are created
   - Check Row Level Security is enabled

### Session Key Encryption Setup

The application uses AES-256-GCM encryption to securely store session keys. Here's how to set it up:

1. **Generate Encryption Key**
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Backend .env**
   ```env
   SESSION_KEY_ENCRYPTION_SECRET=<paste_generated_key_here>
   ```

3. **Security Best Practices**
   - Use different keys for dev/staging/production
   - Never commit keys to git
   - Rotate keys periodically
   - Store production keys in secure secrets manager
   - Document key rotation procedures

### Optional Services

#### Sentry (Error Tracking)

1. Create account at [sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN
4. Add to `.env` as `VITE_SENTRY_DSN`

#### LogRocket (Session Replay)

1. Create account at [logrocket.com](https://logrocket.com)
2. Create new application
3. Copy App ID
4. Add to `.env` as `VITE_LOGROCKET_APP_ID`

## Wallet Setup

### Supported Wallets

- **Keplr**: Cosmos wallet
- **Leap**: Cosmos wallet
- **Metamask**: Ethereum wallet
- **Rabby**: Ethereum wallet

### Installation

1. Install wallet extension in your browser
2. Create or import wallet
3. Connect to Injective network

### Network Configuration

The application automatically configures the Injective network:

- **Mainnet**: `injective-1`
- **Testnet**: `injective-888`

## Development Workflow

### Frontend Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Backend Development

```bash
cd backend

# Start dev server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Code Quality

```bash
# Run linter
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

## Testing

### Frontend Tests

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Backend Tests

```bash
cd backend

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Troubleshooting

### Common Issues

#### Port Already in Use

If port 5173 or 3001 is already in use:

```bash
# Find process using port
lsof -i :5173
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Database Connection Issues

1. Verify Supabase URL and keys in `.env`
2. Check Supabase project status
3. Verify network connectivity
4. Check Row Level Security policies

#### Wallet Connection Issues

1. Ensure wallet extension is installed
2. Check wallet is unlocked
3. Verify network configuration
4. Clear browser cache and cookies

#### Session Key Encryption Issues

1. Verify `SESSION_KEY_ENCRYPTION_SECRET` is set in `backend/.env`
2. Ensure the key is exactly 32 bytes (base64 encoded)
3. Check that the key hasn't been truncated or modified
4. If you change the key, existing session keys will be unrecoverable

#### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear build cache
rm -rf dist
rm -rf .vite

# Rebuild
pnpm build
```

### Getting Help

- Check [GitHub Issues](https://github.com/allomart1/copytradinj/issues)
- Review [Documentation](README.md)
- Contact maintainers

## Next Steps

1. Review [Architecture Documentation](ARCHITECTURE.md)
2. Read [Deployment Guide](DEPLOYMENT.md)
3. Check [Testing Guide](TESTING_GUIDE.md)
4. Explore the codebase
5. Start building features!

## Additional Resources

- [Injective Documentation](https://docs.injective.network/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
