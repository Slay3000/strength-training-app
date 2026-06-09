export const computeRecoveryScores = (
    allDays,
    thisWeekDays,
    currentWeek,
    previousWeek,
    sectionLabels,
) => {
    // Helper function to determine label and color based on score
    const getLabelAndColorForScore = (score) => {
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

    const sorted = [...allDays].sort((a, b) => b.date.localeCompare(a.date))
    if (!sorted.length) {
        return {
            overall: { score: 100, label: 'Fresh', color: '#4caf50' },
            sections: {},
        }
    }

    const getScoreData = (current, previous, dayCount) => {
        // If no activity in both periods, return null to indicate no score
        if (current === 0 && previous === 0) {
            return null
        }
        let score = 100
        let loadRatio = 1
        if (previous > 0) {
            loadRatio = current / previous
        } else if (current > 0) {
            loadRatio = 10 // Treat new activity as a significant jump
        }

        if (loadRatio > 1) {
            // Aggressive exponential penalty for volume jumps
            const increaseFactor = loadRatio - 1
            score -= Math.pow(increaseFactor, 1.3) * 45
        } else if (loadRatio < 1) {
            // Small bonus for deloading
            score += (1 - loadRatio) * 10
        }

        // Frequency penalty
        if (dayCount >= 3) {
            score -= (dayCount - 2) * 15
        }

        score = Math.max(0, Math.min(100, score))

        // Use the new helper function for label and color
        return { score: Math.round(score), ...getLabelAndColorForScore(score) }
    }

    const sectionScores = {}
    const activeSectionScores = [] // To collect scores only from active sections
    sectionLabels.forEach((sectionName) => {
        const current = currentWeek.getSection(sectionName).totalWeight
        const previous = previousWeek.getSection(sectionName).totalWeight
        const sectionDaysThisWeek = thisWeekDays.filter(
            (day) => day.getSection(sectionName).totalWeight > 0,
        ).length
        sectionScores[sectionName] = getScoreData(
            current,
            previous,
            sectionDaysThisWeek,
        )
        const scoreData = getScoreData(current, previous, sectionDaysThisWeek)
        if (scoreData) {
            sectionScores[sectionName] = scoreData
            activeSectionScores.push(scoreData.score)
        } else {
            // If no activity for this section, assign a 'No Activity' status
            sectionScores[sectionName] = {
                score: 100,
                label: 'No Activity',
                color: '#9e9e9e',
            }
        }
    })

    // Overall score is the direct ratio of total volume jumps,
    // but capped by the worst-performing section to reflect localized fatigue.
    const totalCurrent = currentWeek.totalLoad
    const totalPrevious = previousWeek.totalLoad
    const totalDaysActive = thisWeekDays.filter(
        (d) => d.getTotalWeight() > 0,
    ).length

    const baseOverallScoreData = getScoreData(
        totalCurrent,
        totalPrevious,
        totalDaysActive,
    )

    let finalOverallScore = 100 // Default to 'Fresh'
    let finalOverallLabel = 'Fresh'
    let finalOverallColor = '#4caf50'

    if (baseOverallScoreData) {
        finalOverallScore = baseOverallScoreData.score

        // If there are active sections, the overall score should be influenced by the worst section.
        if (activeSectionScores.length > 0) {
            const minActiveSectionScore = Math.min(...activeSectionScores)
            // The overall score should not be significantly higher than the worst section.
            // Cap the overall score by the worst section score, plus a small buffer.
            finalOverallScore = Math.min(
                finalOverallScore,
                minActiveSectionScore + 10,
            )
            // Ensure the final score is not lower than the worst active section score
            // unless the base overall score was already lower.
            finalOverallScore = Math.max(
                finalOverallScore,
                minActiveSectionScore,
            )
        }

        // Re-evaluate label and color based on the potentially adjusted finalOverallScore
        // Use the new helper function directly
        const { label, color } = getLabelAndColorForScore(finalOverallScore)
        finalOverallLabel = label
        finalOverallColor = color
    } else {
        // If baseOverallScoreData is null, it means no overall activity.
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
