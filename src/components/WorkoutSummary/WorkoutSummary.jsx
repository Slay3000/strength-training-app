import React, { useState } from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'

import { WorkoutDay, WorkoutWeek } from '../../models/workoutModels'
import { computeRecoveryScores } from '../../utils/recoveryScore'
import { weeklyBarOptions, sectionBarOptions } from '../../utils/chartOptions'

import RecoveryScoreSection from './RecoveryScoreSection'
import OverallSummarySection from './OverallSummarySection'
import ExerciseChartCard from './ExerciseChartCard'
import './WorkoutSummary.css'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
)

export default function WorkoutSummary({ workouts }) {
    const [openSections, setOpenSections] = useState({})
    const [exerciseMetrics, setExerciseMetrics] = useState({})

    const toggleSection = (key) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

    if (!workouts?.length) {
        return <div className="summary-container">No workouts yet.</div>
    }

    // ── Date helpers ──────────────────────────────────────────────
    const toYMD = (d) => new Date(d).toISOString().slice(0, 10)

    const today = new Date()
    const dayOfWeek = today.getDay()
    const diffToMonday = (dayOfWeek + 6) % 7
    const weekStartDate = new Date(today)
    weekStartDate.setDate(today.getDate() - diffToMonday)
    weekStartDate.setHours(0, 0, 0, 0)

    const prevWeekStartDate = new Date(weekStartDate)
    prevWeekStartDate.setDate(weekStartDate.getDate() - 7)
    prevWeekStartDate.setHours(0, 0, 0, 0)

    // ── Build WorkoutDay instances ─────────────────────────────────
    const createWorkoutDays = (ws) => {
        const grouped = ws.reduce((acc, w) => {
            const date = w.ymd || toYMD(w.created_at)
            if (!acc[date]) acc[date] = []
            acc[date].push(w)
            return acc
        }, {})
        return Object.entries(grouped).map(([date, items]) => new WorkoutDay(date, items))
    }

    const allDays = createWorkoutDays(workouts)
    const weekStartStr = toYMD(weekStartDate)
    const prevWeekStartStr = toYMD(prevWeekStartDate)

    const thisWeekDays = allDays.filter((d) => d.date >= weekStartStr)
    const lastWeekDays = allDays.filter(
        (d) => d.date >= prevWeekStartStr && d.date < weekStartStr,
    )

    const currentWeek = new WorkoutWeek(
        weekStartDate,
        thisWeekDays.flatMap((d) => d.workouts),
    )
    const previousWeek = new WorkoutWeek(
        prevWeekStartDate,
        lastWeekDays.flatMap((d) => d.workouts),
    )
    const weekComparison = currentWeek.compareTo(previousWeek)

    // ── Best week across all history ──────────────────────────────
    const allWeekStartDates = [
        ...new Set(
            workouts.map((w) => {
                const date = new Date(w.created_at)
                const dow = date.getDay()
                const diff = (dow + 6) % 7
                const ws = new Date(date)
                ws.setDate(date.getDate() - diff)
                ws.setHours(0, 0, 0, 0)
                return ws.toISOString().slice(0, 10)
            }),
        ),
    ].sort()

    const sectionLabels = Object.keys(weekComparison).filter((k) => k !== 'overall')

    let bestOverallWeekLoad = 0
    const bestSectionLoads = {}
    for (const ws of allWeekStartDates) {
        const weekWorkouts = allDays.filter(
            (d) =>
                new Date(d.date) >= new Date(ws) &&
                new Date(d.date) <
                    new Date(new Date(ws).setDate(new Date(ws).getDate() + 7)),
        )
        const week = new WorkoutWeek(
            new Date(ws),
            weekWorkouts.flatMap((d) => d.workouts),
        )
        bestOverallWeekLoad = Math.max(bestOverallWeekLoad, week.avgLoadPerDay)
        for (const sectionName of sectionLabels) {
            bestSectionLoads[sectionName] = Math.max(
                bestSectionLoads[sectionName] || 0,
                week.getSection(sectionName).totalWeight,
            )
        }
    }

    // ── Recovery scores ───────────────────────────────────────────
    const recoveryStats = computeRecoveryScores(
        allDays,
        thisWeekDays,
        currentWeek,
        previousWeek,
        sectionLabels,
        bestSectionLoads,
        bestOverallWeekLoad,
    )

    // ── Chart data ────────────────────────────────────────────────
    const maxAvgLoad = Math.max(
        previousWeek.avgLoadPerDay,
        currentWeek.avgLoadPerDay,
        bestOverallWeekLoad,
    )
    const weeklyAvgSuggestedMax =
        maxAvgLoad > 0 ? Math.ceil(maxAvgLoad * 1.15) : undefined

    const maxSectionVal = Math.max(
        0,
        ...sectionLabels.map((t) =>
            Math.max(
                weekComparison[t]?.previousLoad || 0,
                weekComparison[t]?.currentLoad || 0,
                bestSectionLoads[t] || 0,
            ),
        ),
    )
    const sectionSuggestedMax =
        maxSectionVal > 0 ? Math.ceil(maxSectionVal * 1.15) : undefined

    const weeklyAvgBarData = {
        labels: ['Previous Week', 'Current Week', 'Best Week'],
        datasets: [
            {
                label: 'Weekly Avg Load (kg/day)',
                data: [
                    previousWeek.avgLoadPerDay.toFixed(0),
                    currentWeek.avgLoadPerDay.toFixed(0),
                    bestOverallWeekLoad.toFixed(0),
                ],
                backgroundColor: [
                    'rgba(255,99,132,0.5)',
                    'rgba(75,192,192,0.6)',
                    'rgba(75,22,192,0.6)',
                ],
            },
        ],
    }

    const sectionComparisonBarData = {
        labels: sectionLabels,
        datasets: [
            {
                label: 'Previous Week',
                data: sectionLabels.map((t) => weekComparison[t]?.previousLoad || 0),
                backgroundColor: 'rgba(255,99,132,0.6)',
            },
            {
                label: 'Current Week',
                data: sectionLabels.map((t) => weekComparison[t]?.currentLoad || 0),
                backgroundColor: 'rgba(75,192,192,0.6)',
            },
            {
                label: 'Best Week',
                data: sectionLabels.map((t) => bestSectionLoads[t] || 0),
                backgroundColor: 'rgba(255,206,86,0.6)',
            },
        ],
    }

    // ── Render ────────────────────────────────────────────────────
    return (
        <div className="summary-container">
            <RecoveryScoreSection
                recoveryStats={recoveryStats}
                openSections={openSections}
                toggleSection={toggleSection}
            />

            <OverallSummarySection
                currentWeek={currentWeek}
                previousWeek={previousWeek}
                weekComparison={weekComparison}
                bestOverallWeekLoad={bestOverallWeekLoad}
                weeklyAvgBarData={weeklyAvgBarData}
                weeklyAvgBarOptions={weeklyBarOptions(
                    'Weekly Average Comparison',
                    weeklyAvgSuggestedMax,
                )}
                sectionComparisonBarData={sectionComparisonBarData}
                sectionBarOpts={sectionBarOptions(sectionSuggestedMax)}
                weekStartDate={weekStartDate}
                today={today}
                toYMD={toYMD}
                isOpen={openSections.total}
                onToggle={() => toggleSection('total')}
            />

            {/* Per-section breakdowns */}
            {Object.entries(weekComparison)
                .filter(([k]) => k !== 'overall')
                .map(([sectionName, sectionStats]) => {
                    const key = `section-${sectionName}`
                    return (
                        <div key={key} className="summary-section">
                            <h3
                                className="collapsible-header"
                                onClick={() => toggleSection(key)}
                            >
                                {sectionName}{' '}
                                <span
                                    className={
                                        sectionStats.toGoVsLastWeek < 0
                                            ? 'positive'
                                            : sectionStats.toGoVsLastWeek > 0
                                              ? 'negative'
                                              : 'neutral'
                                    }
                                >
                                    ({sectionStats.toGoVsLastWeek > 0 ? '+' : ''}
                                    {sectionStats.toGoVsLastWeek} kg vs last week)
                                </span>
                            </h3>

                            {openSections[key] && (
                                <>
                                    <p>
                                        Previous Total:{' '}
                                        {sectionStats.previousLoad.toLocaleString()} kg
                                        <br />
                                        Current Total:{' '}
                                        {sectionStats.currentLoad.toLocaleString()} kg
                                        <br />
                                        Weekly Avg:{' '}
                                        {sectionStats.avgWeeklyLoad.toLocaleString()} kg/day
                                    </p>

                                    <div className="exercise-breakdown">
                                        {Object.entries(
                                            new WorkoutWeek(weekStartDate, workouts)
                                                .getSection(sectionName)?.exercises || {},
                                        ).map(([exName, exSets]) => (
                                            <ExerciseChartCard
                                                key={exName}
                                                exName={exName}
                                                exSets={exSets}
                                                sectionName={sectionName}
                                                workouts={workouts}
                                                toYMD={toYMD}
                                                exerciseMetric={exerciseMetrics[exName]}
                                                onMetricChange={(name, metric) =>
                                                    setExerciseMetrics((prev) => ({
                                                        ...prev,
                                                        [name]: metric,
                                                    }))
                                                }
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
        </div>
    )
}
