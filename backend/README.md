# Smart Med production backend

The GitHub Pages site is a static client and cannot securely host secrets or a database. This folder is the production backend foundation.

## Deployment
1. Create a Supabase project.
2. Run `supabase-schema.sql` in the SQL editor.
3. Configure authentication providers and verify email/phone according to your clinical workflow.
4. Create private Storage for prescription images. Never make prescription images public.
5. Add server-side functions for prescription OCR, interaction checking and notifications. Keep API keys and service-role credentials server-side only.
6. Connect the static client through a public anon key and enforce Row Level Security.

## Production requirements
- HTTPS only
- Authenticated users and role-based access
- Row Level Security
- Audit logs
- Encrypted backups
- Consent and retention policy
- Validated/licensed medication and interaction data
- Human review for prescription extraction
- Server-side push notification provider
- Monitoring, rate limiting and incident response
- Clinical, privacy and regulatory review before real-patient use

The existing browser-only mode remains available as a fallback when no backend configuration is present.
