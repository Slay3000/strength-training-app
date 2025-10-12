import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function WorkoutForm({
    exerciseId,
    setExerciseId,
    reps,
    setReps,
    weight,
    setWeight,
    onAdd,
    hiddenExercises = [],
}) {
    const [exercises, setExercises] = useState([])

    // Fetch exercises from DB
    useEffect(() => {
        async function fetchExercises() {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('type', { ascending: true })
                .order('name', { ascending: true })

            if (error) console.error(error)
            else setExercises(data)
        }

        fetchExercises()
    }, [])

    // Group exercises by type
    const groupedExercises = exercises.reduce((acc, ex) => {
        if (!acc[ex.type]) acc[ex.type] = []
        acc[ex.type].push(ex)
        return acc
    }, {})

    return (
        <div className="workout-form">
            <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
            >
                <option value="">Select Exercise</option>
                {Object.entries(groupedExercises).map(([type, exs]) => (
                    <optgroup key={type} label={type}>
                        {exs
                            .filter((ex) => !hiddenExercises.includes(ex.id))
                            .map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                    {ex.name}
                                </option>
                            ))}
                    </optgroup>
                ))}
            </select>

            <input
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                type="number"
                placeholder="Reps"
                className="workout-form-input"
            />

            <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                type="number"
                placeholder="Weight"
                className="workout-form-input"
            />

            <button onClick={onAdd} className="workout-form-button">
                Add
            </button>
        </div>
    )
}
