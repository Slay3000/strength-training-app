import { supabase } from '../lib/supabaseClient'

export async function fetchWorkouts(userId) {
    return supabase
        .from('workouts')
        .select(
            'id, reps, weight, created_at, exercise_id, exercises(name, type)',
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
}

export async function insertWorkouts(payload) {
    return supabase
        .from('workouts')
        .insert(payload)
        .select(
            'id, reps, weight, created_at, exercise_id, exercises(name, type)',
        )
}

export async function updateWorkout(id, updated) {
    return supabase
        .from('workouts')
        .update(updated)
        .eq('id', id)
        .select(
            'id, reps, weight, created_at, exercise_id, exercises(name, type)',
        )
}

export async function deleteWorkout(id) {
    return supabase.from('workouts').delete().eq('id', id)
}
