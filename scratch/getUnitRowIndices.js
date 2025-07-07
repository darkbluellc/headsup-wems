function getUnitRowIndices(tableId, unitId) {
    const table = document.getElementById(tableId);
    const rows = Array.from(table.rows);
    const matchingIndices = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].cells;

        // Look for a new unit block in column 2
        if (cells.length >= 2 && cells[2].textContent.replace(/\s+/g, ' ').trim().includes(unitId)) {
            const rowspan = parseInt(cells[2].getAttribute('rowspan') || '1', 10);

            for (let j = 0; j < rowspan; j++) {
                if (i + j < rows.length) {
                    matchingIndices.push(i + j);
                }
            }

            i += rowspan - 1; // skip ahead
        }
    }

    return matchingIndices;
}

