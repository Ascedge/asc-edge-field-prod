import { createSupabaseClient } from '@/lib/supabase'

export default async function Home() {
  const supabase = createSupabaseClient()
  // Lazy init — env vars read only when component renders
  const { data: { session } } = await supabase.auth.getSession()

  return <div>ASC Edge Field</div>;
}
