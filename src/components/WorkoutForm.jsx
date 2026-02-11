import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import './WorkoutForm.css'

export default function WorkoutForm({
    workouts,
    onAdd,
    hiddenExercises = [],

    entries,
    setEntries,
    searchTerms,
    setSearchTerms,
    dropdownOpen,
    setDropdownOpen,
}) {
    const [exercises, setExercises] = useState([])
    const containerRef = useRef(null)

    // Fetch exercises once
    useEffect(() => {
        async function fetchExercises() {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('type', { ascending: true })
                .order('name', { ascending: true })
            if (error) console.error('Error fetching exercises:', error)
            else setExercises(data || [])
        }
        fetchExercises()
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target)
            ) {
                setDropdownOpen(dropdownOpen.map(() => false))
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [dropdownOpen])

    // Handlers
    const addRow = () => {
        setEntries([...entries, { exerciseId: '', reps: '', weight: '' }])
        setSearchTerms([...searchTerms, ''])
        setDropdownOpen([...dropdownOpen, false])
    }

    const removeRow = (index) => {
        if (entries.length === 1) return
        setEntries(entries.filter((_, i) => i !== index))
        setSearchTerms(searchTerms.filter((_, i) => i !== index))
        setDropdownOpen(dropdownOpen.filter((_, i) => i !== index))
    }

    const handleSelectExercise = (index, ex) => {
        const updated = [...entries]
        updated[index].exerciseId = ex.id
        setEntries(updated)

        const terms = [...searchTerms]
        terms[index] = ex.name
        setSearchTerms(terms)

        const dropdowns = [...dropdownOpen]
        dropdowns[index] = false
        setDropdownOpen(dropdowns)
    }

    const handleChange = (index, field, value) => {
        const updated = [...entries]
        updated[index][field] = value
        setEntries(updated)

        if (field === 'exerciseId' || field === 'name') {
            const dropdowns = [...dropdownOpen]
            dropdowns[index] = true
            setDropdownOpen(dropdowns)
        }
    }

    const toggleDropdown = (index, open) => {
        const dropdowns = [...dropdownOpen]
        dropdowns[index] = open
        setDropdownOpen(dropdowns)
    }

    const handleSubmit = () => {
        // Validate all rows
        for (let i = 0; i < entries.length; i++) {
            const { exerciseId, reps, weight } = entries[i]
            if (!exerciseId || !reps || !weight) {
                alert('Please fill all exercises, reps, and weight.')
                return
            }
        }

        onAdd(entries)

        // Reset only reps for all rows, keep exercises and weights
        setEntries(entries.map((e) => ({ ...e, reps: '' })))
    }

    // Filter visible exercises
    const visibleExercises = exercises.filter(
        (ex) => !hiddenExercises.includes(ex.id),
    )

    // Group exercises by type
    const groupedExercises = visibleExercises.reduce((acc, ex) => {
        const type = ex.type || 'Other'
        if (!acc[type]) acc[type] = []
        acc[type].push(ex)
        return acc
    }, {})

    // Helper to get last, max, and delta for an exercise ID
    const getStats = (exerciseId) => {
        if (!workouts || !exerciseId)
            return { last: null, max: null, delta: null }

        const exWorkouts = workouts.filter((w) => w.exercise_id === exerciseId)
        if (!exWorkouts.length) return { last: null, max: null, delta: null }

        const sorted = [...exWorkouts].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
        )

        const last = sorted[0]
        const max = exWorkouts.reduce((m, w) => {
            const load = (w.weight || 0) * (w.reps || 0)
            const currentMax = (m.weight || 0) * (m.reps || 0)
            return load > currentMax ? w : m
        }, sorted[0])
        const delta =
            sorted.length > 1
                ? (last.weight || 0) * (last.reps || 0) -
                  (sorted[1].weight || 0) * (sorted[1].reps || 0)
                : null

        return { last, max, delta }
    }

    return (
        <div className="workout-form" ref={containerRef}>
            {/* Add Exercise button on top */}
            <button className="add-exercise-button" onClick={addRow}>
                Add Exercise
            </button>

            {entries.map((row, index) => {
                const stats = row.exerciseId
                    ? getStats(row.exerciseId)
                    : { last: null, max: null, delta: null }

                // Filter dropdown based on typed text
                const filteredDropdown = Object.keys(groupedExercises).length
                    ? Object.entries(groupedExercises)
                          .map(([type, list]) => ({
                              type,
                              list: list.filter((ex) =>
                                  searchTerms[index]
                                      ? ex.name
                                            .toLowerCase()
                                            .includes(
                                                searchTerms[
                                                    index
                                                ].toLowerCase(),
                                            )
                                      : true,
                              ),
                          }))
                          .filter((group) => group.list.length > 0) // <-- HIDE EMPTY GROUPS
                    : []

                return (
                    <div key={index} className="exercise-row">
                        {/* FIRST ROW: EXERCISE SELECTOR (FULL WIDTH) */}
                        <div className="exercise-select-wrapper">
                            <div className="exercise-select-container">
                                <input
                                    type="text"
                                    className="exercise-input"
                                    placeholder="Select exercise..."
                                    value={searchTerms[index]}
                                    onChange={(e) => {
                                        const terms = [...searchTerms]
                                        terms[index] = e.target.value
                                        setSearchTerms(terms)
                                        toggleDropdown(index, true)
                                    }}
                                    onFocus={() => toggleDropdown(index, true)}
                                />

                                {dropdownOpen[index] && (
                                    <div className="dropdown-list">
                                        {filteredDropdown.length === 0 ? (
                                            <div className="dropdown-empty">
                                                No exercises found
                                            </div>
                                        ) : (
                                            filteredDropdown.map((group) => (
                                                <div
                                                    key={group.type}
                                                    className="dropdown-group"
                                                >
                                                    <div className="dropdown-type">
                                                        {group.type}
                                                    </div>
                                                    {group.list.map((ex) => (
                                                        <div
                                                            key={ex.id}
                                                            className={`dropdown-item${
                                                                row.exerciseId ===
                                                                ex.id
                                                                    ? ' selected'
                                                                    : ''
                                                            }`}
                                                            onClick={() =>
                                                                handleSelectExercise(
                                                                    index,
                                                                    ex,
                                                                )
                                                            }
                                                        >
                                                            {ex.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECOND ROW: REPS + WEIGHT + REMOVE (INLINE) */}
                        <div className="inputs-row">
                            <input
                                type="number"
                                className="reps-input"
                                placeholder="Reps"
                                value={row.reps}
                                onChange={(e) =>
                                    handleChange(index, 'reps', e.target.value)
                                }
                            />

                            <input
                                type="number"
                                className="weight-input"
                                placeholder="Weight"
                                value={row.weight}
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'weight',
                                        e.target.value,
                                    )
                                }
                            />

                            {entries.length > 1 && (
                                <button
                                    className="remove-row-button"
                                    onClick={() => removeRow(index)}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Submit button at bottom */}
            <button className="submit-button" onClick={handleSubmit}>
                {entries.length === 1 ? 'Add' : 'Add Set'}
            </button>
        </div>
    )
}
