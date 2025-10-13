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
    hiddenExercises,
}) {
    const [exercises, setExercises] = useState([])

    useEffect(() => {
        async function fetchExercises() {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('type', { ascending: true })
                .order('name', { ascending: true })
            if (error) console.error(error)
            else setExercises(data || [])
        }
        fetchExercises()
    }, [])

    // Group exercises by type
    const grouped = exercises.reduce((acc, ex) => {
        if (!acc[ex.type]) acc[ex.type] = []
        acc[ex.type].push(ex)
        return acc
    }, {})

    const repsOptions = [5, 8, 10, 12, 15, 20, 25, 30]
    const weightOptions = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100]

    return (
        <div className="workout-form">
            {/* Exercise select */}
            <select
                value={exerciseId}
                onChange={(e) => setExerciseId(e.target.value)}
                className="exercise-select"
            >
                <option value="">Select Exercise</option>
                {Object.entries(grouped).map(([type, exs]) => (
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

            {/* Reps input with presets */}
            <input
                type="number"
                list="reps-options"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="reps-input"
                placeholder="Reps"
            />
            <datalist id="reps-options">
                {repsOptions.map((r) => (
                    <option key={r} value={r} />
                ))}
            </datalist>

            {/* Weight input with presets */}
            <input
                type="number"
                list="weight-options"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="weight-input"
                placeholder="Weight (kg)"
            />
            <datalist id="weight-options">
                {weightOptions.map((w) => (
                    <option key={w} value={w} />
                ))}
            </datalist>

            <button onClick={onAdd} className="add-button">
                Add
            </button>
        </div>
    )
}
