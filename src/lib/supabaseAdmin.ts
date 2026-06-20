import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy_key_to_prevent_crash";

// If the service key is missing or invalid, this client will fail on requests but won't crash the server at startup
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
