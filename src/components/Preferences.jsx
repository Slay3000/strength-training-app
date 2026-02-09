import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Preferences.css'

export default function Preferences({ hiddenExercises, setHiddenExercises }) {
    const [exercises, setExercises] = useState([])
    const [openType, setOpenType] = useState(null) // which type's dropdown is open
    const dropdownRef = useRef(null)

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

    const toggleExercise = (id) => {
        if (hiddenExercises.includes(id)) {
            setHiddenExercises(hiddenExercises.filter((e) => e !== id))
        } else {
            setHiddenExercises([...hiddenExercises, id])
        }
    }

    // Group exercises by type
    const grouped = exercises.reduce((acc, ex) => {
        if (!acc[ex.type]) acc[ex.type] = []
        acc[ex.type].push(ex)
        return acc
    }, {})

    // Close dropdown when clicked outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpenType(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="preferences-container">
            {Object.entries(grouped).map(([type, exs]) => (
                <div
                    key={type}
                    className="exercise-type-dropdown"
                    ref={dropdownRef}
                >
                    <button
                        className="dropdown-toggle"
                        onClick={() =>
                            setOpenType(openType === type ? null : type)
                        }
                    >
                        {type}
                    </button>

                    {openType === type && (
                        <div className="dropdown-menu">
                            {exs.map((ex) => (
                                <label key={ex.id} className="dropdown-item">
                                    <input
                                        type="checkbox"
                                        checked={
                                            !hiddenExercises.includes(ex.id)
                                        }
                                        onChange={() => toggleExercise(ex.id)}
                                    />
                                    {ex.name}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
