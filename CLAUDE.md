# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (ALWAYS RUNNING during development)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Supabase CLI Commands

**IMPORTANT**: Always use `npx` prefix for all Supabase CLI commands:

```bash
# Deploy functions to Supabase
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy [function-name]

# Other Supabase commands
npx supabase [command]
```

## Architecture Overview

This is a React/TypeScript event and promotion management application built with:

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Backend**: Supabase (PostgreSQL database with real-time features)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Maps**: Google Maps integration via @types/google.maps

## Database Schema

The application uses Supabase with these main tables:
- `events`: Event management with venues, dates, organizers
- `promos`: Promotional offers with pricing and locations
- `profiles`: User profiles with admin roles
- `event_attendees`: Event participation tracking
- `event_comments`/`promo_comments`: Comment systems
- `promo_reviews`: Review/rating system
- `event_tags`/`event_tag_assignments`: Tagging system

## Key Components Structure

- **Pages**: Main route components in `src/pages/`
- **Components**: Reusable UI components in `src/components/`
- **Form Components**: Specialized forms in `src/components/form-components/`
- **UI Components**: shadcn/ui components in `src/components/ui/`
- **Hooks**: Custom React hooks in `src/hooks/`
- **Supabase Integration**: Database client and types in `src/integrations/supabase/`

## Important Patterns

- All database operations use the Supabase client from `src/integrations/supabase/client.ts`
- TypeScript types are auto-generated in `src/integrations/supabase/types.ts`
- Form components use React Hook Form with Zod validation
- UI components follow shadcn/ui patterns with Tailwind CSS
- The app supports user authentication with role-based access (admin/superadmin)
- Geographic features use Google Maps with latitude/longitude coordinates

## Security & Admin Features

- **Delete Operations**: Events and promos use secure delete via `secure-delete` Supabase Edge Function
- **Row Level Security**: Enabled on all tables with proper policies for read/write operations
- **Admin System**: Users need profiles with `is_admin` or `is_super_admin` flags to delete content
- **Authorization**: All delete operations verify admin status before allowing deletion

## Supabase Functions

- `secure-delete`: Handles secure deletion of events, promos, and user profiles with proper authorization checks
  - Events: Requires admin status or ownership
  - Promos: Requires admin status or ownership  
  - User profiles: Requires super admin status only

- `admin-role-update`: Handles admin role assignments with proper authorization and RLS bypass
  - Admin role assignment: Requires admin or super admin status
  - Super admin role assignment: Requires super admin status only
  - Uses service role to bypass Row Level Security policies for admin field updates

## Testing Admin Functionality

If admin operations fail with 403 errors, verify:
1. User has a profile record in the `profiles` table
2. Profile has `is_admin: true` or `is_super_admin: true`
3. RLS policies are properly configured

**Admin Role Assignment Issues**: If "Make Admin" or "Make Super Admin" buttons don't work, the issue is likely Row Level Security policies blocking direct updates to admin fields. The `admin-role-update` Edge Function bypasses this by using service role privileges.

## Development Notes

- This is a Lovable project (lovable.dev) with automatic deployment
- Supabase project ID: qgttbaibhmzbmknjlghj
- **Development server**: `npm run dev` is ALWAYS running during development, no need to call it again
- **Supabase CLI**: Always use `npx supabase [command]` for all Supabase operations
- All custom routes must be added above the catch-all "*" route in App.tsx
- The application supports both events and promotional offers with different data models
- User profiles include business information and verification status