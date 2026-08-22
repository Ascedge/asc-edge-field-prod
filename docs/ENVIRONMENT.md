# Environment contract

No values belong in source control. `.env.example` lists names only.

- `SUPABASE_URL`: preferred server-side Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_URL`: browser-safe Supabase URL and server fallback.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key for narrowly scoped operations.
- `APP_URL`: preferred canonical server-side application origin.
- `NEXT_PUBLIC_APP_URL`: browser-safe canonical origin and server fallback.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: browser-visible key; restrict it by domain and API in Google Cloud.
- `GHL_WEBHOOK_URL`: optional server-only GoHighLevel webhook endpoint.

Server helpers reject missing or malformed required values when the related capability is used.
