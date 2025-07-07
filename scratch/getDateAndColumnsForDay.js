function getDateAndColumnsForDay(tableId, targetDay) {
    const table = document.getElementById(tableId);
    const dayRow = table.rows[2]; // row index 1: weekday names
    const dateRow = table.rows[3]; // row index 2: dates below weekdays
    const result = [];

    let colIndex = 0;

    for (let i = 0; i < dayRow.cells.length; i++) {
        const cell = dayRow.cells[i];
        const dayText = cell.textContent.trim();
        const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);

        if (dayText.includes(targetDay)) {
            // Find the date cell that maps to colIndex
            const dateCell = dateRow.cells[Array.from(dateRow.cells).findIndex((_, idx, arr) => {
                let span = 0, k = 0;
                while (k <= idx) {
                    span += parseInt(arr[k].getAttribute('colspan') || '1', 10);
                    if (span > colIndex) break;
                    k++;
                }
                return span > colIndex;
            })];

            const dateText = dateCell ? dateCell.textContent.trim() : null;

            const columnNumbers = Array.from({ length: colspan }, (_, k) => colIndex + k);
            const columnLetters = columnNumbers.map(numToColLetter);

            result.push({
                day: dayText,
                date: dateText,
                columns: columnNumbers,
                columnLetters: columnLetters
            });
        }

        colIndex += colspan;
    }

    return result;
}

function numToColLetter(n) {
    let s = '';
    while (n > 0) {
        let r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}