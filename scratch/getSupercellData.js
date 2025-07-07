function getSupercellData(tableId, unitId, dayName) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.rows);
    const unitRowIndices = getUnitRowIndices(tableId, unitId);
    const dayInfo = getDateAndColumnsForDay(tableId, dayName)[0];

    if (!dayInfo || unitRowIndices.length === 0) {
        return [];
    }

    const { columns: dayColumns } = dayInfo;

    const data = [];

    for (const rowIndex of unitRowIndices) {
        const row = rows[rowIndex];
        let colCursor = 1; // 1-based column tracking
        for (const cell of row.cells) {
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            const colIndices = Array.from({ length: colspan }, (_, i) => colCursor + i);

            // Check if any of the cell’s spanned columns intersect with the day's columns
            if (colIndices.some(ci => dayColumns.includes(ci))) {
                data.push(cell.textContent.trim());
            }

            colCursor += colspan;
        }
    }

    return data;
}
