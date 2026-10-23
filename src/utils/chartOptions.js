// Reusable Chart.js option builders

/**
 * Line chart options for a single exercise over time.
 * Dynamically sets Y-axis bounds based on data range so the line
 * is never a flat hairline on mobile.
 */
export function exerciseLineOptions(title, dataValues = [], yTitle = 'Load (kg)') {
    let suggestedMin
    let suggestedMax
    if (dataValues.length > 0) {
        const minVal = Math.min(...dataValues)
        const maxVal = Math.max(...dataValues)
        const diff = maxVal - minVal
        if (diff === 0) {
            suggestedMin = Math.max(0, minVal * 0.8 - 1)
            suggestedMax = maxVal * 1.2 + 1
        } else {
            suggestedMin = Math.max(0, Math.floor(minVal - diff * 0.15))
            suggestedMax = Math.ceil(maxVal + diff * 0.15)
        }
    }

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: title,
                font: { size: 13 },
            },
        },
        scales: {
            y: {
                beginAtZero: false,
                suggestedMin,
                suggestedMax,
                title: { display: true, text: yTitle },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 5,
                    precision: 0,
                    color: '#ccc',
                    font: { size: 10, family: 'Inter, sans-serif' },
                },
            },
            x: {
                title: { display: true, text: 'Date' },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 6,
                    color: '#ccc',
                    font: { size: 10, family: 'Inter, sans-serif' },
                },
            },
        },
    }
}

/**
 * Bar chart options for weekly average comparison.
 */
export function weeklyBarOptions(title, suggestedMax) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true },
            title: { display: true, text: title },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg/day)' },
                suggestedMax,
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 5,
                    color: '#ccc',
                    font: { size: 10, family: 'Inter, sans-serif' },
                },
            },
            x: {
                title: { display: true, text: 'Period' },
                ticks: {
                    color: '#ccc',
                    font: { size: 10, family: 'Inter, sans-serif' },
                },
            },
        },
    }
}

/**
 * Bar chart options for section (muscle group) comparison.
 */
export function sectionBarOptions(suggestedMax) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Weekly Load by Section',
                font: { size: 14 },
            },
            legend: { display: true },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Load (kg)' },
                suggestedMax,
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 5,
                    color: '#ccc',
                    font: { size: 10, family: 'Inter, sans-serif' },
                },
            },
            x: {
                title: { display: true, text: 'Section' },
                ticks: {
                    color: '#ccc',
                    font: { size: 10, family: 'Inter, sans-serif' },
                },
            },
        },
    }
}

