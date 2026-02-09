import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
    const [userId, setUserId] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function init() {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            if (session?.user) setUserId(session.user.id)
            setLoading(false)
        }
        init()
    }, [])

    return { userId, loading }
}
