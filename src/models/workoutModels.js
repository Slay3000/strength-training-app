export class WorkoutDay {
    constructor(date, workouts = []) {
        this.date = date
        this.workouts = Array.isArray(workouts) ? workouts : []
        this.sections = this._groupBySection()
    }

    _groupBySection() {
        const sections = {}
        this.workouts.forEach((w) => {
            const type = w.exercises?.type || 'Unknown'
            const name = w.exercises?.name || 'Unknown'
            const weight = Number(w.weight) || 0
            const reps = Number(w.reps) || 0
            const load = weight * reps

            if (!sections[type]) sections[type] = {}
            if (!sections[type][name]) sections[type][name] = []

            sections[type][name].push({ ...w, load })
        })
        return sections
    }

    /** 🧮 Helpers */
    getTotalWeight() {
        return Object.values(this.sections)
            .flatMap((exs) => Object.values(exs).flat())
            .reduce((sum, s) => sum + s.load, 0)
    }

    getBestSet() {
        const allSets = Object.values(this.sections).flatMap((exs) =>
            Object.values(exs).flat()
        )
        return allSets.length ? Math.max(...allSets.map((s) => s.load)) : 0
    }

    getExercise(type, name) {
        return this.sections?.[type]?.[name] || []
    }

    getSection(type) {
        return this.sections?.[type] || {}
    }

    /**
     * 🔁 Compare this day to another WorkoutDay (previous vs current)
     * - this = previous day
     * - otherDay = current day
     */
    compareTo(otherDay) {
        const sections = {}
        const allTypes = new Set([
            ...Object.keys(this.sections),
            ...Object.keys(otherDay.sections),
        ])

        let overallPrev = 0
        let overallCurr = 0

        for (const type of allTypes) {
            const currExs = otherDay.sections[type] || {}
            const prevExs = this.sections[type] || {}

            const allExNames = new Set([
                ...Object.keys(currExs),
                ...Object.keys(prevExs),
            ])

            sections[type] = { exercises: {}, loadToGo: 0 }

            let prevTotal = 0
            let currTotal = 0

            for (const exName of allExNames) {
                const prevSets = prevExs[exName] || []
                const currSets = currExs[exName] || []

                const prevTotalWeight = prevSets.reduce((s, a) => s + a.load, 0)
                const currentTotalWeight = currSets.reduce(
                    (s, a) => s + a.load,
                    0
                )
                const loadToGo = prevTotalWeight - currentTotalWeight
                const lastMaxWeight = prevSets.length
                    ? Math.max(...prevSets.map((s) => Number(s.weight) || 0))
                    : 0
                const totalReps = currSets.reduce(
                    (s, a) => s + (a.reps || 0),
                    0
                )
                const bestSet = currSets.length
                    ? Math.max(...currSets.map((s) => s.load))
                    : 0

                sections[type].exercises[exName] = {
                    prevTotalWeight,
                    currentTotalWeight,
                    loadToGo,
                    lastMaxWeight,
                    totalWeight: currentTotalWeight,
                    totalReps,
                    bestSet,
                }

                prevTotal += prevTotalWeight
                currTotal += currentTotalWeight
            }

            sections[type].prevTotalWeight = prevTotal
            sections[type].currentTotalWeight = currTotal
            sections[type].loadToGo = prevTotal - currTotal

            overallPrev += prevTotal
            overallCurr += currTotal
        }

        return {
            sections,
            overall: {
                prevTotalWeight: overallPrev,
                currentTotalWeight: overallCurr,
                loadToGo: overallPrev - overallCurr,
            },
        }
    }

    /** ⚙️ Static helper — get most recent previous day before a given date */
    static getPreviousDay(allWorkouts, today = new Date()) {
        const todayStr = today.toISOString().slice(0, 10)

        // Group all workouts by date
        const grouped = allWorkouts.reduce((acc, w) => {
            const d = new Date(w.created_at).toISOString().slice(0, 10)
            if (!acc[d]) acc[d] = []
            acc[d].push(w)
            return acc
        }, {})

        const prevDates = Object.keys(grouped)
            .filter((d) => d < todayStr)
            .sort((a, b) => new Date(b) - new Date(a))

        const prevDate = prevDates[0]
        if (!prevDate) return null
        return new WorkoutDay(prevDate, grouped[prevDate])
    }
}

export class WorkoutWeek {
    constructor(startDate, workouts = []) {
        this.startDate = startDate
        this.workouts = Array.isArray(workouts) ? workouts : []
        this.days = this._groupByDay()
        this.totalLoad = this.getTotalWeight() // initialize totalLoad
    }

    get avgLoadPerDay() {
        return this.totalLoad / this.getDaysCount()
    }

    _groupByDay() {
        const map = {}
        this.workouts.forEach((w) => {
            const d = new Date(w.created_at).toISOString().slice(0, 10)
            if (!map[d]) map[d] = []
            map[d].push(w)
        })
        return map
    }

    getDaysCount() {
        return Object.keys(this.days).length || 1
    }

    getTotalWeight() {
        return Object.values(this.days)
            .flat()
            .reduce((s, w) => s + (w.weight || 0) * (w.reps || 0), 0)
    }

    getSection(type) {
        const filtered = this.workouts.filter((w) => w.exercises?.type === type)
        const total = filtered.reduce(
            (s, w) => s + (w.weight || 0) * (w.reps || 0),
            0
        )
        return {
            type,
            totalWeight: total,
            avg: Math.round(total / this.getDaysCount()),
            exercises: filtered.reduce((acc, w) => {
                const name = w.exercises?.name || 'Unknown'
                if (!acc[name]) acc[name] = []
                acc[name].push(w)
                return acc
            }, {}),
        }
    }

    getExercise(type, name) {
        return this.workouts.filter(
            (w) => w.exercises?.type === type && w.exercises?.name === name
        )
    }

    compareTo(otherWeek) {
        const allTypes = new Set([
            ...this.workouts.map((w) => w.exercises?.type),
            ...otherWeek.workouts.map((w) => w.exercises?.type),
        ])

        const sections = {}
        let overallCurrentTotal = 0
        let overallPreviousTotal = 0

        for (const type of allTypes) {
            const curr = this.getSection(type)
            const prev = otherWeek.getSection(type)

            const currentWeekAvg = Math.round(
                curr.totalWeight / this.getDaysCount()
            )
            const previousWeekAvg = Math.round(
                prev.totalWeight / otherWeek.getDaysCount()
            )
            const loadToGo = prev.totalWeight - curr.totalWeight

            overallCurrentTotal += curr.totalWeight
            overallPreviousTotal += prev.totalWeight

            sections[type] = {
                type,
                previousLoad: prev.totalWeight,
                currentLoad: curr.totalWeight,
                loadToGo,
                avgWeeklyLoad: currentWeekAvg,
                toGoVsLastWeek: loadToGo,
                exercises: curr.exercises,
            }
        }

        this.totalLoad = overallCurrentTotal // ✅ update totalLoad

        sections.overall = {
            type: 'Overall',
            currentWeekAvg: overallCurrentTotal,
            previousWeekAvg: overallPreviousTotal,
            toGoVsLastWeek: overallPreviousTotal - overallCurrentTotal,
            totalLoad: overallCurrentTotal,
            diff: overallCurrentTotal - overallPreviousTotal,
        }

        return sections
    }
}

export class WorkoutMonth {
    constructor(startDate, workouts = []) {
        this.startDate = startDate
        this.workouts = Array.isArray(workouts) ? workouts : []
    }

    getMonthName() {
        return this.startDate.toLocaleString('default', { month: 'long' })
    }

    getTotalWeight() {
        return this.workouts.reduce(
            (s, w) => s + (w.weight || 0) * (w.reps || 0),
            0
        )
    }

    getSection(type) {
        const filtered = this.workouts.filter((w) => w.exercises?.type === type)
        return {
            type,
            totalWeight: filtered.reduce(
                (s, w) => s + (w.weight || 0) * (w.reps || 0),
                0
            ),
        }
    }

    compareTo(otherMonth) {
        const allTypes = new Set([
            ...this.workouts.map((w) => w.exercises?.type),
            ...otherMonth.workouts.map((w) => w.exercises?.type),
        ])

        const sections = {}
        for (const type of allTypes) {
            const currSec = this.getSection(type)
            const prevSec = otherMonth.getSection(type)
            sections[type] = {
                currentMonthLoad: currSec.totalWeight,
                previousMonthLoad: prevSec.totalWeight,
                loadToGo: prevSec.totalWeight - currSec.totalWeight,
            }
        }

        const overallCurr = Object.values(sections).reduce(
            (s, t) => s + t.currentMonthLoad,
            0
        )
        const overallPrev = Object.values(sections).reduce(
            (s, t) => s + t.previousMonthLoad,
            0
        )

        return {
            sections,
            overall: {
                currentMonthLoad: overallCurr,
                previousMonthLoad: overallPrev,
                loadToGo: overallPrev - overallCurr,
            },
        }
    }
}
