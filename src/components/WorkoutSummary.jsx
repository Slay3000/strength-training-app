import { calculateSectionStats } from '../helpers/workout'
import React from 'react'

export default function WorkoutSummary({ workouts }) {
    const stats = calculateSectionStats(workouts)

    return (
        <div className="workout-summary">
            <table className="summary-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Total Weight</th>
                        <th>Weight-to-Go</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(stats).map(
                        ([type, { totalWeight, weightToGo }]) => {
                            const typeClass = type.toLowerCase() || 'unknown'
                            return (
                                <tr
                                    key={type}
                                    className={`type-row ${typeClass}`}
                                >
                                    <td className="type-name">{type}</td>
                                    <td>{totalWeight} kg</td>
                                    <td
                                        className={`weight-to-go ${
                                            weightToGo >= 0
                                                ? 'positive'
                                                : 'negative'
                                        }`}
                                    >
                                        {weightToGo >= 0 ? '+' : ''}
                                        {weightToGo} kg
                                    </td>
                                </tr>
                            )
                        }
                    )}
                </tbody>
            </table>
        </div>
    )
}
