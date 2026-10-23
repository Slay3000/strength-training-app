import { useState, useEffect, useRef } from 'react'
import { fetchExercises } from '../../services/exercisesService'
import { getExerciseHistoryStats } from '../../utils/workoutStats'
import WorkoutFormRow from './WorkoutFormRow'
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

    // Fetch exercises on mount
    useEffect(() => {
        async function loadExercises() {
            const { data, error } = await fetchExercises()
            if (error) console.error('Error fetching exercises:', error)
            else setExercises(data || [])
        }
        loadExercises()
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
    }, [dropdownOpen, setDropdownOpen])

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

    return (
        <div className="workout-form" ref={containerRef}>
            <button className="add-exercise-button" onClick={addRow}>
                Add Exercise
            </button>

            {entries.map((row, index) => {
                const stats = getExerciseHistoryStats(workouts, row.exerciseId)

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
                          .filter((group) => group.list.length > 0)
                    : []

                return (
                    <WorkoutFormRow
                        key={index}
                        row={row}
                        index={index}
                        searchTerm={searchTerms[index]}
                        onSearchTermChange={(val) => {
                            const terms = [...searchTerms]
                            terms[index] = val
                            setSearchTerms(terms)
                        }}
                        isDropdownOpen={dropdownOpen[index]}
                        onToggleDropdown={(open) =>
                            toggleDropdown(index, open)
                        }
                        filteredDropdown={filteredDropdown}
                        onSelectExercise={(ex) =>
                            handleSelectExercise(index, ex)
                        }
                        onChangeField={(field, val) =>
                            handleChange(index, field, val)
                        }
                        onRemoveRow={() => removeRow(index)}
                        canRemove={entries.length > 1}
                        stats={stats}
                    />
                )
            })}

            <button className="submit-button" onClick={handleSubmit}>
                {entries.length === 1 ? 'Add' : 'Add Set'}
            </button>
        </div>
    )
}
