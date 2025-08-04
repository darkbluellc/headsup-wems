function getSupercellBeautData(tableId, unitId, dayName) {
    const table = document.getElementById(tableId);
    console.log(table);
    const rows = Array.from(table.rows);
    const unitRowIndices = getUnitRowIndices(tableId, unitId);
    const dayInfo = getDateAndColumnsForDay(tableId, dayName)[0];

    if (!dayInfo || unitRowIndices.length === 0) {
        return [];
    }

    const dayCols = dayInfo.columns; // e.g., [9, 10, 11, 12]
    const colPairs = [];
    for (let i = 0; i < dayCols.length - 1; i += 2) {
        colPairs.push([dayCols[i], dayCols[i + 1]]);
    }

    const assignments = [];
    const notes = [];

    for (const rowIndex of unitRowIndices) {
        const row = rows[rowIndex];
        const cells = Array.from(row.cells);
        const cellMap = new Map();

        // Check if this row contains the unit ID (i.e., is the first row of the supercell)
        const hasUnitCell = cells.some(cell =>
            cell.textContent.trim().includes(unitId)
        );

        // If unit cell is missing (as in second+ row of rowspan), shift columns by 1
        const colOffset = hasUnitCell ? 0 : 1;

        let currentCol = 0;
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            const text = cell.textContent.trim();

            for (let offset = 0; offset < colspan; offset++) {
                cellMap.set(currentCol + offset + colOffset, text);
            }

            currentCol += colspan;
        }

        // Now use the mapped columns to extract time/name pairs or notes
        for (const [timeCol, nameCol] of colPairs) {
            const time = cellMap.get(timeCol);
            const name = cellMap.get(nameCol);

            if (time && name) {
                assignments.push({ time, name });
            } else if (time && !name) {
                assignments.push({ time, name: '<OPEN>' });
            } else if (!time && name) {
                notes.push(name);
            }
            // If both time and name are missing, skip
        }
    }

    return { assignments, notes };
}
