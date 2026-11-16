// Helper function to determine label and color based on score
export const getLabelAndColorForScore = (score) => {
    let label = 'Excellent'
    let color = '#4caf50'

    if (score < 15) {
        label = 'Critical'
        color = '#b71c1c'
    } else if (score < 35) {
        label = 'High Risk'
        color = '#f44336'
    } else if (score < 55) {
        label = 'Strained'
        color = '#ff9800'
    } else if (score < 75) {
        label = 'Moderate'
        color = '#ffc107'
    } else if (score < 90) {
        label = 'Good'
        color = '#8bc34a'
    } else if (score >= 98) {
        label = 'Elite'
        color = '#00c853'
    }
    return { label, color }
}

/**
 * Computes recovery score for a single muscle section based on load relative to best week.
 *
 * @param {number} current - Current week volume load for this section.
 * @param {number} best - Historical best week volume load for this section.
 * @param {number} dayCount - Number of days this section was trained this week.
 * @returns {object} { score, label, color, currentLoad, bestLoad, loadRatio }
 */
export const computeSectionRecoveryScore = (
    current = 0,
    best = 0,
    dayCount = 0,
) => {
    if (current === 0 && best === 0) {
        return {
            score: 100,
            label: 'No Activity',
            color: '#9e9e9e',
            currentLoad: 0,
            bestLoad: 0,
            loadRatio: 0,
        }
    }

    if (current === 0) {
        return {
            score: 100,
            label: 'Fresh',
            color: '#4caf50',
            currentLoad: 0,
            bestLoad: best,
            loadRatio: 0,
        }
    }

    const benchmark = best > 0 ? best : current
    const loadRatio = benchmark > 0 ? current / benchmark : 1

    let score = 100
    if (loadRatio <= 0.5) {
        // Deload / light recovery volume (0% - 50% of best week)
        score = 100 - loadRatio * 10
    } else if (loadRatio <= 1.0) {
        // Moderate to peak training load (50% - 100% of best week)
        score = 95 - ((loadRatio - 0.5) / 0.5) * 30
    } else {
        // Overreaching / exceeding historical best week (> 100%)
        const overFactor = loadRatio - 1.0
        score = 65 - Math.pow(overFactor, 1.1) * 75
    }

    // Frequency penalty: training the same section 3+ days in a week accumulates localized fatigue
    if (dayCount >= 3) {
        score -= (dayCount - 2) * 12
    }

    score = Math.max(0, Math.min(100, Math.round(score)))
    const { label, color } = getLabelAndColorForScore(score)

    return {
        score,
        label,
        color,
        currentLoad: current,
        bestLoad: benchmark,
        loadRatio,
    }
}

export const computeRecoveryScores = (
    allDays = [],
    thisWeekDays = [],
    currentWeek = {},
    previousWeek = {},
    sectionLabels = [],
    bestSectionLoads = {},
    bestOverallWeekLoad = 0,
) => {
    const sorted = [...allDays].sort((a, b) => b.date.localeCompare(a.date))
    if (!sorted.length) {
        return {
            overall: { score: 100, label: 'Fresh', color: '#4caf50' },
            sections: {},
        }
    }

    const sectionScores = {}
    const activeSectionScores = []

    sectionLabels.forEach((sectionName) => {
        const current = currentWeek?.getSection
            ? currentWeek.getSection(sectionName).totalWeight
            : 0
        const previous = previousWeek?.getSection
            ? previousWeek.getSection(sectionName).totalWeight
            : 0
        // Use best week load if provided; fall back to previous week load for backwards compatibility
        const best =
            bestSectionLoads && bestSectionLoads[sectionName] !== undefined
                ? bestSectionLoads[sectionName]
                : previous

        const sectionDaysThisWeek = thisWeekDays
            ? thisWeekDays.filter(
                  (day) =>
                      day?.getSection &&
                      day.getSection(sectionName).totalWeight > 0,
              ).length
            : 0

        const scoreData = computeSectionRecoveryScore(
            current,
            best,
            sectionDaysThisWeek,
        )
        sectionScores[sectionName] = scoreData

        if (scoreData.label !== 'No Activity') {
            activeSectionScores.push(scoreData.score)
        }
    })

    // Overall recovery score calculation:
    const totalCurrent = currentWeek?.totalLoad || 0
    const totalPrevious = previousWeek?.totalLoad || 0
    const totalDaysActive = thisWeekDays
        ? thisWeekDays.filter(
              (d) => d?.getTotalWeight && d.getTotalWeight() > 0,
          ).length
        : 0

    const overallBenchmark =
        bestOverallWeekLoad > 0
            ? bestOverallWeekLoad
            : totalPrevious > 0
              ? totalPrevious
              : totalCurrent

    let baseOverallScoreData = null
    if (totalCurrent > 0 || overallBenchmark > 0) {
        baseOverallScoreData = computeSectionRecoveryScore(
            totalCurrent,
            overallBenchmark,
            totalDaysActive,
        )
    }

    let finalOverallScore = 100
    let finalOverallLabel = 'Fresh'
    let finalOverallColor = '#4caf50'

    if (baseOverallScoreData) {
        finalOverallScore = baseOverallScoreData.score

        // If there are active sections, the overall score should be influenced by the worst section.
        if (activeSectionScores.length > 0) {
            const minActiveSectionScore = Math.min(...activeSectionScores)
            // Cap the overall score by the worst section score, plus a small buffer.
            finalOverallScore = Math.min(
                finalOverallScore,
                minActiveSectionScore + 10,
            )
            finalOverallScore = Math.max(
                finalOverallScore,
                minActiveSectionScore,
            )
        }

        const { label, color } = getLabelAndColorForScore(finalOverallScore)
        finalOverallLabel = label
        finalOverallColor = color
    } else {
        finalOverallScore = 100
        finalOverallLabel = 'No Activity'
        finalOverallColor = '#9e9e9e'
    }

    return {
        overall: {
            score: Math.round(finalOverallScore),
            label: finalOverallLabel,
            color: finalOverallColor,
        },
        sections: sectionScores,
    }
}

/**
 * Computes the Acute:Chronic Workload Ratio (ACWR) for overall and per muscle section.
 *
 * Acute load  = average daily volume (weight × reps) over last 7 days
 * Chronic load = average daily volume (weight × reps) over last 28 days
 * ACWR = acute / chronic  (null when chronic === 0)
 *
 * Zones:
 *   < 0.8   → "Undertraining"
 *   0.8–1.3 → "Optimal"
 *   1.3–1.5 → "High Risk"
 *   > 1.5   → "Danger"
 *
 * @param {Array} allWorkouts - Flat array of workout sets.
 *   Each: { id, exercise_id, weight, reps, created_at, exercises: { name, type } }
 * @returns {{ overall: { acwr, zone, label }, sections: { [type]: { acwr, zone, label } } }}
 */
export const computeACWR = (allWorkouts = []) => {
    const now = new Date()

    const msPerDay = 24 * 60 * 60 * 1000
    const cutoff7  = new Date(now - 7  * msPerDay)
    const cutoff28 = new Date(now - 28 * msPerDay)

    // Classify each set
    const acute  = []  // last 7 days
    const chronic = [] // last 28 days (includes acute window)

    for (const w of allWorkouts) {
        const date = new Date(w.created_at)
        const volume = (w.weight || 0) * (w.reps || 0)
        if (date >= cutoff28) chronic.push({ date, volume, type: w.exercises?.type || 'Unknown' })
        if (date >= cutoff7)  acute.push({ date, volume, type: w.exercises?.type || 'Unknown' })
    }

    // Sum volumes by day bucket (keyed to YYYY-MM-DD)
    const dailySum = (sets) => {
        const byDay = {}
        for (const s of sets) {
            const key = s.date.toISOString().slice(0, 10)
            byDay[key] = (byDay[key] || 0) + s.volume
        }
        return byDay
    }

    const avgDaily = (byDay) => {
        const vals = Object.values(byDay)
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }

    const getZone = (ratio) => {
        if (ratio < 0.8)  return { zone: 'undertraining', label: 'Undertraining' }
        if (ratio <= 1.3) return { zone: 'optimal',       label: 'Optimal' }
        if (ratio <= 1.5) return { zone: 'high-risk',     label: 'High Risk' }
        return                    { zone: 'danger',        label: 'Danger' }
    }

    const buildACWR = (acuteSets, chronicSets) => {
        const acuteAvg   = avgDaily(dailySum(acuteSets))
        const chronicAvg = avgDaily(dailySum(chronicSets))
        if (chronicAvg === 0) return { acwr: null, zone: null, label: '—' }
        const ratio = acuteAvg / chronicAvg
        return { acwr: Math.round(ratio * 100) / 100, ...getZone(ratio) }
    }

    // Overall
    const overallACWR = buildACWR(acute, chronic)

    // Per section
    const allTypes = [...new Set(chronic.map((s) => s.type))]
    const sections = {}
    for (const type of allTypes) {
        const acuteSec   = acute.filter((s)   => s.type === type)
        const chronicSec = chronic.filter((s) => s.type === type)
        sections[type] = buildACWR(acuteSec, chronicSec)
    }

    return { overall: overallACWR, sections }
}
