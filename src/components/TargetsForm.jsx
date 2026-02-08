import { useState, useEffect } from 'react'
import './TargetsForm.css'

export default function TargetsForm({
    muscleTargets,
    currentProportions,
    targetProportions,
    onSave,
}) {
    const [local, setLocal] = useState({})

    useEffect(() => {
        setLocal(muscleTargets)
    }, [muscleTargets])

    const handleChange = (muscle, value) => {
        setLocal({
            ...local,
            [muscle]: value,
        })
    }

    const handleSave = () => {
        const cleaned = Object.fromEntries(
            Object.entries(local).map(([k, v]) => [k, parseFloat(v)]),
        )
        onSave(cleaned)
    }

    return (
        <div className="targets-form">
            <h2>Muscle Target Ratios</h2>

            <div className="targets-header-row">
                <span className="header-col muscle">Muscle</span>
                <span className="header-col target">Target Ratio</span>
                <span className="header-col current">Current Ratio</span>
                <span className="header-col needed">Needed %</span>
            </div>

            {Object.entries(local).map(([muscle, ratio]) => {
                const target = targetProportions[muscle] || 0
                const current = currentProportions[muscle] || 0
                const needed = (target - current) * 100

                return (
                    <div key={muscle} className="targets-row">
                        <div className="muscle">{muscle}</div>

                        <input
                            type="number"
                            step="0.1"
                            value={ratio}
                            className="target-input"
                            onChange={(e) =>
                                handleChange(muscle, e.target.value)
                            }
                        />

                        <div className="current-ratio">
                            {(current * 100).toFixed(1)}%
                        </div>

                        <div
                            className={
                                'needed-ratio ' +
                                (needed < 0 ? 'over' : 'under')
                            }
                        >
                            {needed >= 0 ? '+' : ''}
                            {needed.toFixed(1)}%
                        </div>
                    </div>
                )
            })}

            <button className="save-targets-btn" onClick={handleSave}>
                Save
            </button>
        </div>
    )
}
