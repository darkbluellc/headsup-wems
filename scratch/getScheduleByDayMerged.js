function getScheduleByDayMerged(tableId, unitIds) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const schedule = {};

    for (const day of days) {
        const daySchedule = {};

        for (const unit of unitIds) {
            const result = getSupercellBeautData(tableId, unit, day);

            // Merge assignments by time range
            const mergedAssignments = {};
            for (const { time, name } of result.assignments) {
                if (!mergedAssignments[time]) {
                    mergedAssignments[time] = [];
                }
                mergedAssignments[time].push(name);
            }

            const assignments = Object.entries(mergedAssignments).map(
                ([time, names]) => ({
                    time,
                    names
                })
            );

            daySchedule[unit] = {
                assignments,
                notes: result.notes
            };
        }

        schedule[day] = daySchedule;
    }

    return schedule;
}
