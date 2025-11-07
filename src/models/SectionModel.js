// Aggregates multiple workouts for one section

export class SectionModel {
    constructor(sectionName, workouts = []) {
        this.name = sectionName
        this.workouts = workouts.filter((w) => w.section === sectionName)
        this.days = new Set(this.workouts.map((w) => w.ymd))
        this.totalLoad = this.workouts.reduce((sum, w) => sum + w.load, 0)
        this.totalReps = this.workouts.reduce((sum, w) => sum + w.reps, 0)
    }

    get avgLoadPerDay() {
        return this.days.size > 0 ? this.totalLoad / this.days.size : 0
    }

    toJSON() {
        return {
            name: this.name,
            totalLoad: Math.round(this.totalLoad),
            avgLoadPerDay: Math.round(this.avgLoadPerDay),
            days: this.days.size,
        }
    }
}
