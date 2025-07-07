function getScheduleForUnits(tableId, unitIds) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const schedule = {};

    for (const unit of unitIds) {
        const unitSchedule = {};

        for (const day of days) {
            const result = getSupercellBeautData(tableId, unit, day);

            unitSchedule[day] = {
                assignments: result.assignments, // array of { time, name }
                notes: result.notes              // array of notes (strings)
            };
        }

        schedule[unit] = unitSchedule;
    }

    return schedule;
}
