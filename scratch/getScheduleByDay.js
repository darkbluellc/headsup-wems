function getScheduleByDay(tableId, unitIds) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const schedule = {};

    for (const day of days) {
        const daySchedule = {};

        for (const unit of unitIds) {
            const result = getSupercellBeautData(tableId, unit, day);

            daySchedule[unit] = {
                assignments: result.assignments, // array of { time, name }
                notes: result.notes              // array of strings
            };
        }

        schedule[day] = daySchedule;
    }

    return schedule;
}
