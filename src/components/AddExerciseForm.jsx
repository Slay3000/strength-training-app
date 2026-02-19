import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { dbPromise } from '../localDB'
import './AddExerciseForm.css'

export default function AddExerciseForm() {
    const [name, setName] = useState('')
    const [type, setType] = useState('')
    const [types, setTypes] = useState([])
    const [errorMessage, setErrorMessage] = useState('')

    // Helper to capitalize first letter of each word
    function capitalizeWords(str) {
        return str
            .trim()
            .split(' ')
            .filter(Boolean)
            .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    }

    // Fetch existing types from exercises table
    useEffect(() => {
        async function fetchTypes() {
            const db = await dbPromise

            if (!navigator.onLine) {
                const cached = await db.getAll('exercises')
                const uniqueTypes = [
                    ...new Set(cached.map((d) => d.type).filter(Boolean)),
                ]
                setTypes(uniqueTypes)
                return
            }

            const { data, error } = await supabase.from('exercises').select('*')

            if (!error) {
                const tx = db.transaction('exercises', 'readwrite')
                data.forEach((ex) => tx.store.put(ex))
                await tx.done

                const uniqueTypes = [
                    ...new Set(data.map((d) => d.type).filter(Boolean)),
                ]
                setTypes(uniqueTypes)
            }
        }

        fetchTypes()
    }, [])
    async function handleAddExercise() {
        setErrorMessage('')

        if (!name || !type) {
            setErrorMessage('Please provide both exercise name and type.')
            return
        }

        const normalizedName = capitalizeWords(name)
        const normalizedType = capitalizeWords(type)
        const db = await dbPromise

        const newExercise = {
            id: Date.now(), // temporary local ID
            name: normalizedName,
            type: normalizedType,
            created_at: new Date().toISOString(),
        }

        if (!navigator.onLine) {
            // Offline: store locally + queue for sync
            await db.put('exercises', newExercise)
            await db.put('pendingExercises', newExercise)

            alert(`Exercise "${normalizedName}" added offline!`)
            setName('')
            setType('')
            return
        }

        // Online - send to Supabase
        const { error } = await supabase
            .from('exercises')
            .insert([{ name: normalizedName, type: normalizedType }])

        if (error) {
            if (error.code === '23505') {
                setErrorMessage(`Exercise "${normalizedName}" already exists.`)
            } else {
                console.error(error)
                setErrorMessage('Failed to add exercise.')
            }
        } else {
            alert(`Exercise "${normalizedName}" added!`)
            setName('')
            setType('')
        }
    }

    return (
        <div className="add-exercise-form">
            <input
                type="text"
                value={name}
                placeholder="Exercise name"
                onChange={(e) => setName(e.target.value)}
            />

            <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Select type</option>
                {types.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>

            <button onClick={handleAddExercise}>Add Exercise</button>

            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}
        </div>
    )
}
