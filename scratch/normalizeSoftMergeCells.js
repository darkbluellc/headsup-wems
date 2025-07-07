function normalizeSoftMergeCells(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const cells = table.querySelectorAll('td');

    cells.forEach(cell => {
        const softmergeDiv = cell.querySelector('div.softmerge');
        if (softmergeDiv) {
            const text = softmergeDiv.textContent.trim();
            cell.textContent = text;
        }
    });
}
