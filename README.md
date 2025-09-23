# Party Panther - Event & Promo Platform

## Cloudinary Setup Required

To enable receipt uploads and image management, you need to configure Cloudinary:

### 1. Create a Cloudinary Account
- Go to [cloudinary.com](https://cloudinary.com) and create a free account
- Note your Cloud Name from the dashboard

### 2. Create Upload Preset
- Go to Settings > Upload presets
- Create a new preset with these settings:
  - Signing Mode: "Unsigned" 
  - Folder: "receipts" (or your preferred folder structure)
  - Enable "Resource type: Image"
  - Set max file size if desired (recommended: 10MB)

### 3. Update Configuration
Edit `src/lib/cloudinary.ts` and replace the placeholder values:
```typescript
const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'your-actual-cloud-name', // Replace with your cloud name
  uploadPreset: 'your-actual-upload-preset' // Replace with your preset name
};
```

### 4. Features Enabled
Once configured, users can:
- Upload payment receipts for events they've joined
- View their uploaded receipts
- Admins can view and approve all receipts
- Admins can manage payment status based on receipt verification

### 5. Admin Receipt Management
Admins can access receipt management through:
- Admin Dashboard > Receipts tab
- View pending/approved receipts
- Approve payments based on receipt verification
- Download/view receipt images

## Current Features
- Event creation and management
- Promo creation and management  
- User authentication and profiles
- Payment receipt uploads (via Cloudinary)
- Admin dashboard with receipt management
- Comments and attendee management

## Tech Stack
- React + TypeScript
- Tailwind CSS
- Supabase (Database & Auth)
- Cloudinary (Image Storage)
- Lucide React (Icons)

---

## Original Lovable Project Info

**URL**: https://lovable.dev/projects/1ebb9f24-fda5-4dae-ac77-480d72954427

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1ebb9f24-fda5-4dae-ac77-480d72954427) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1ebb9f24-fda5-4dae-ac77-480d72954427) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)