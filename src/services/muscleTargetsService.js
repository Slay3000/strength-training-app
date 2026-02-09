import { supabase } from '../lib/supabaseClient'

export async function fetchMuscleTargets(userId) {
    return supabase
        .from('muscle_targets')
        .select('muscle, ratio')
        .eq('user_id', userId)
}

export async function saveMuscleTargets(userId, targets) {
    const rows = Object.entries(targets).map(([muscle, ratio]) => ({
        user_id: userId,
        muscle,
        ratio,
    }))

    return supabase.from('muscle_targets').upsert(rows, {
        onConflict: 'user_id,muscle',
    })
}
