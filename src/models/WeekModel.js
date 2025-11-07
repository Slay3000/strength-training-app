import { WorkoutModel } from './WorkoutModel'
import { SectionModel } from './SectionModel'

// Utility: find the Monday of any given date
function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day + 6) % 7 // shift so Monday is start
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
}

export class WeekModel {
    constructor(workouts = [], referenceDate = new Date()) {
        this.start = getMonday(referenceDate)
        this.end = new Date(this.start)
        this.end.setDate(this.start.getDate() + 7)
        this.ymdStart = this.start.toISOString().slice(0, 10)
        this.ymdEnd = this.end.toISOString().slice(0, 10)

        // normalize workouts
        this.workouts = workouts
            .map((w) => new WorkoutModel(w))
            .filter((w) => w.date >= this.start && w.date < this.end)

        // build sections
        this.sections = this._buildSections()
    }

    _buildSections() {
        const map = {}
        this.workouts.forEach((w) => {
            if (!map[w.section]) map[w.section] = []
            map[w.section].push(w)
        })
        const result = {}
        Object.keys(map).forEach((name) => {
            result[name] = new SectionModel(name, map[name])
        })
        return result
    }

    get totalLoad() {
        return Object.values(this.sections).reduce(
            (sum, s) => sum + s.totalLoad,
            0
        )
    }

    get totalDays() {
        return new Set(this.workouts.map((w) => w.ymd)).size || 1
    }

    get avgLoadPerDay() {
        return this.totalLoad / this.totalDays
    }

    // compare with another WeekModel
    compare(otherWeek) {
        if (!otherWeek || !otherWeek.sections) {
            return {
                sectionDetails: {},
                overall: {
                    currAvg: Math.round(this.avgLoadPerDay),
                    prevAvg: 0,
                    diff: Math.round(this.avgLoadPerDay),
                },
            }
        }
        const allSections = new Set([
            ...Object.keys(this.sections),
            ...Object.keys(otherWeek.sections),
        ])

        const sectionComparison = {}
        for (let name of allSections) {
            const curr = this.sections[name]
            const prev = otherWeek.sections[name]
            const currAvg = curr?.avgLoadPerDay || 0
            const prevAvg = prev?.avgLoadPerDay || 0
            sectionComparison[name] = {
                prevAvg,
                currAvg,
                diff: Math.round(currAvg - prevAvg),
            }
        }

        return {
            overall: {
                prevAvg: Math.round(otherWeek.avgLoadPerDay),
                currAvg: Math.round(this.avgLoadPerDay),
                diff: Math.round(this.avgLoadPerDay - otherWeek.avgLoadPerDay),
            },
            sectionComparison,
        }
    }
}
