import { supabase } from '../lib/supabaseClient'

/**
 * Fetch all exercises sorted by type and name
 */
export async function fetchExercises() {
    return supabase
        .from('exercises')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true })
}

/**
 * Fetch distinct exercise types
 */
export async function fetchExerciseTypes() {
    return supabase.from('exercises').select('type')
}

/**
 * Insert a new exercise
 */
export async function insertExercise({ name, type }) {
    return supabase.from('exercises').insert([{ name, type }])
}

