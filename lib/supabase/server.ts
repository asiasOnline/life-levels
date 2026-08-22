import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getEnvironmentVariables() {
    const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseURL || !supabasePublishableKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      );
    }

    return { supabaseURL, supabasePublishableKey };
  }

export async function createClient() {
  const { supabaseURL, supabasePublishableKey } = getEnvironmentVariables();
  const cookieStore = await cookies()

  return createServerClient(
    supabaseURL, 
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch(error) {
            console.log(error)
          }
        },
      },
    }
  )
}