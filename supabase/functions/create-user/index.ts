
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, password, role, first_name, last_name, company } = await req.json()

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (authError) throw authError

        const userId = authData.user.id

        // 2. Update Profile with Role and new fields
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email, // Ensure email is always set
                role: role || 'client',
                first_name: first_name || '',
                last_name: last_name || '',
                company: company || ''
            })

        if (profileError) throw profileError

        return new Response(
            JSON.stringify({ user: authData.user, message: "User created successfully" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("EDGE FUNCTION ERROR:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
