# Instagram Embed Integration - Production Ready

## Overview
This PR implements a robust, production-ready Instagram embed system using Facebook Graph API oEmbed endpoint with server-side caching, proper error handling, and comprehensive testing.

## Changes

### 1. Database Migration
- **File**: `supabase/migrations/20250117_create_instagram_oembed_cache.sql`
- Creates `instagram_oembed_cache` table for caching oEmbed responses
- 7-day cache expiry to reduce API calls
- RLS policies: public read, service role write
- Indexes on `instagram_url` and `expires_at` for performance

### 2. Supabase Edge Function
- **File**: `supabase/functions/instagram-oembed/index.ts`
- Handles Instagram oEmbed requests via Facebook Graph API
- Implements intelligent caching with 7-day TTL
- Proper error handling and logging
- CORS support for browser requests
- Uses `omitscript=true` to avoid script conflicts

### 3. React Component
- **File**: `src/components/InstagramEmbed.tsx`
- Fetches embed HTML from edge function
- Graceful fallback to direct link on error
- Loading state with proper UX
- Debug mode in non-production environments
- Automatic URL normalization (adds trailing slash)

### 4. Integration
- **File**: `src/components/EventDetailPage.tsx`
- Replaced legacy inline blockquote with `InstagramEmbed` component
- Cleaner, more maintainable code
- Better error handling

### 5. Testing
- **File**: `src/components/__tests__/InstagramEmbed.test.tsx`
- Unit tests for all scenarios:
  - Successful embed rendering
  - Fallback link on API failure
  - Loading state
  - URL normalization
  - Debug mode

### 6. CI/CD
- **File**: `.github/workflows/pr-tests.yml`
- Automated PR validation
- Edge function syntax checking
- Migration file validation
- Type checking and build verification

## Deployment Steps

### 1. Required Environment Variables
Add the following secrets to your Supabase project:

```bash
# In Supabase Dashboard > Project Settings > Edge Functions
INSTAGRAM_APP_ID=your_facebook_app_id
INSTAGRAM_APP_SECRET=your_facebook_app_secret
```

**How to get credentials:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app or use existing app
3. Enable Instagram Graph API
4. Copy App ID and App Secret
5. Add to Supabase Edge Functions secrets

### 2. Run Database Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase SQL Editor
# Copy content from supabase/migrations/20250117_create_instagram_oembed_cache.sql
```

### 3. Deploy Edge Function
The edge function will auto-deploy with the next build, or deploy manually:
```bash
supabase functions deploy instagram-oembed
```

### 4. Update `supabase/config.toml`
Ensure the function is configured:
```toml
[functions.instagram-oembed]
verify_jwt = false  # Public endpoint for Instagram embeds
```

### 5. Deploy Frontend
Standard deployment process - the React component will automatically use the new system.

## Manual Validation Steps

### Test Scenarios
1. **Valid Instagram Post**
   - Navigate to an event with Instagram URL
   - Verify embed loads correctly
   - Check browser console for successful API calls

2. **Invalid URL**
   - Test with malformed Instagram URL
   - Should show fallback link gracefully

3. **Cache Hit**
   - Load same Instagram post twice
   - Second load should be instant (cached)
   - Check edge function logs for "Cache hit" message

4. **API Error**
   - Temporarily misconfigure credentials
   - Verify fallback link appears
   - Check that error is logged properly

5. **Development Debug Mode**
   - In dev environment, verify debug info shows
   - In production, verify debug info is hidden

### Verification Checklist
- [ ] Migration applied successfully
- [ ] Edge function deployed
- [ ] Environment variables set
- [ ] Instagram embeds render on event pages
- [ ] Cache working (check `instagram_oembed_cache` table)
- [ ] Fallback link works when API fails
- [ ] No console errors
- [ ] Tests passing in CI/CD

## Performance Impact
- **First load**: ~500-1000ms (API call to Facebook Graph)
- **Cached loads**: ~50-100ms (database lookup)
- **Cache duration**: 7 days
- **Expected API savings**: 95%+ reduction in Instagram API calls

## Rollback Plan
If issues occur:
1. Revert `EventDetailPage.tsx` to use legacy blockquote
2. Keep migration and edge function for future use
3. No data loss - cache table can remain

## Security Considerations
- ✅ RLS policies properly configured
- ✅ Instagram credentials stored as secrets
- ✅ CORS headers properly set
- ✅ Input validation on URLs
- ✅ No sensitive data in client-side code

## Testing Coverage
- Unit tests: InstagramEmbed component
- Integration validation: CI/CD pipeline
- Manual testing: Required before merge

## Related Issues
Fixes Instagram embed loading issues and improves performance with intelligent caching.

## Screenshots
_Add screenshots of working Instagram embeds here_

---

## Reviewer Notes
- Please test with real Instagram URLs
- Verify edge function logs in Supabase dashboard
- Check that cache table populates correctly
- Ensure no breaking changes to existing events
