# Word Game MVP

A full-stack word game application with admin and player interfaces.

## Features

### Admin Features
- Secure JWT-based authentication
- Dashboard with statistics
- Player management (view, delete)
- Subject management (CRUD operations)
- Word management (add individually or bulk upload via CSV/Excel)
- Bulk upload format: `subject_name, difficulty, word, hint`

### Player Features
- Multiple authentication methods:
  - Email/Password
  - Phone OTP
  - Google OAuth
  - Facebook OAuth
- Category selection by difficulty (easy, medium, hard)
- 5-word challenge gameplay with hints
- Real-time scoring and feedback
- Score history and statistics
- Demo mode (coming soon)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS v4
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth + JWT
- **Security**: Row Level Security (RLS), JWT tokens

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project

### Environment Variables

The following environment variables are automatically configured:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (for admin auth)

### Database Setup

1. **Using Docker (Recommended)**
   The database is automatically set up when running via `docker-compose`. The `postgres` container mounts the initialization scripts from the `./scripts` directory, which are executed in alphabetical order on the first run.

   - `scripts/001_create_tables.sql`: Creates all tables, indexes, functions, and triggers.
   - `scripts/002_seed_data.sql`: Seeds initial data (Admin user, Permissions, Demo Subjects, Demo Words, Site Settings).

   If you need to reset the database:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

2. **Manual Setup**
   If you are running a local Postgres instance without Docker:
   - Run `scripts/001_create_tables.sql` to create the schema.
   - Run `scripts/002_seed_data.sql` to seed the data.

3. Create your first admin user by calling:
   ```
   POST /api/admin/create
   {
     "email": "admin@example.com",
     "password": "your-secure-password"
   }
   ```
   *Note: A default admin user `admin@test.com` / `Admin123!` is created by the seed script.*

### Running the App

The app runs in the v0 preview. All dependencies are automatically installed.

## API Routes

### Public Routes
- `GET /api/subjects` - List active subjects
- `GET /api/subjects/[id]` - Get subject details
- `GET /api/words?subject_id=xxx` - Get words for a subject

### Protected Player Routes (Supabase Auth)
- `POST /api/game/start` - Start a game session
- `POST /api/game/submit` - Submit an answer
- `POST /api/game/complete` - Complete game and update stats
- `GET /api/player/stats` - Get player statistics
- `GET /api/player/profile` - Get player profile
- `PUT /api/player/profile` - Update player profile

### Admin Routes (JWT Auth)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/create` - Create admin user
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/players` - List players
- `DELETE /api/admin/players/[id]` - Delete player
- `GET /api/admin/subjects` - List subjects
- `POST /api/admin/subjects` - Create subject
- `PUT /api/admin/subjects/[id]` - Update subject
- `DELETE /api/admin/subjects/[id]` - Delete subject
- `GET /api/admin/words` - List words
- `POST /api/admin/words` - Create word
- `DELETE /api/admin/words/[id]` - Delete word
- `POST /api/admin/words/bulk-upload` - Bulk upload words

## Security

- Admin routes protected with JWT authentication
- Player routes protected with Supabase authentication
- Database protected with Row Level Security (RLS)
- Passwords hashed with bcrypt
- Middleware validates all auth tokens
