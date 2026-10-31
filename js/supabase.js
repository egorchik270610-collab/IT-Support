import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://cxgtaekqkvfcapdazyzp.supabase.co";
const SUPABASE_KEY = "sb_publishable_PjjvDNcECQI6-OdBKHue_A_gFzx-ygh";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);