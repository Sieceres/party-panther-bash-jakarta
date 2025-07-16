# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server
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

## Development Notes

- This is a Lovable project (lovable.dev) with automatic deployment
- Supabase project ID: qgttbaibhmzbmknjlghj
- All custom routes must be added above the catch-all "*" route in App.tsx
- The application supports both events and promotional offers with different data models
- User profiles include business information and verification status