//node packages
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const unzipper = require('unzipper');
const cheerio = require('cheerio');
require('dotenv').config();

//local packages

//globals
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CREDENTIALS_PATH = './google-creds.json';
let schedule = '';

const getSundayPrefix = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    return `${sunday.getMonth() + 1} ${sunday.getDate()}`;
};

const getSchedule = async () => {

    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(CREDENTIALS_PATH),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    
    const expectedPrefix = getSundayPrefix(); 

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const res = await drive.files.export(
        {
            fileId: SPREADSHEET_ID,
            mimeType: 'application/zip',
        },
        { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
        let found = false;

        res.data
            .pipe(unzipper.Parse())
            .on('entry', async (entry) => {
                const fileName = entry.path;

                if (fileName.startsWith(expectedPrefix) && fileName.endsWith('.html')) {
                    found = true;
                    const chunks = [];
                    entry.on('data', chunk => chunks.push(chunk));
                    entry.on('end', () => {
                        const html = Buffer.concat(chunks).toString('utf8');
                        resolve(html);
                    });
                } else {
                    entry.autodrain();
                }
            })
            .on('close', () => {
                if (!found) reject(new Error(`No HTML file starting with "${expectedPrefix}" found.`));
            })
            .on('error', reject);
    });
};

const normalizeSoftmergeCells = ($) => {
    $('td.softmerge').each((_, td) => {
        const $td = $(td);
        const divText = $td.find('div').first().text().trim();
        $td.text(divText);
        $td.removeClass('softmerge');
    });
};

const getUnitRowIndices = async ($, unitId) => {
    const table = $('table');
    const rows = table.find('tr').toArray();
    const matchingIndices = [];

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const firstCells = $(row).find('td').toArray().slice(0,2);

        if (firstCells.length >= 2) {
            const unitCell = firstCells[1];  
            const unitText = $(unitCell).text().trim();

            if (unitText.replace(/\s+/g, ' ').trim().includes(unitId)) {
                const rowspan = parseInt($(unitCell).attr('rowspan') || '1', 10);
                for (let i = 0; i < rowspan; i++) {
                    matchingIndices.push(rowIndex + i);
                }
                break;
            }
        }
    }

    return matchingIndices;
};

const getDateAndColumnsForDay = ($, targetDay) => {
    const table = $('table');
    const rows = table.find('tr').toArray();
    console.log($(rows[3]).text());
    const headerRow = $(rows[2]).find('td').toArray();
    // console.log(headerRow);
    const subHeaderRow = $(rows[3]).find('td').toArray();

    // console.log($(subHeaderRow).html());

    const results = [];
    let colIndex = 0;

    for (let i = 0; i < headerRow.length; i++) {
        const cell = $(headerRow[i]);
        const text = cell.text().trim();

        const colspan = parseInt(cell.attr('colspan') || '1', 10);
        if (text.startsWith(targetDay)) {
            const subcols = [];
            for (let offset = 0; offset < colspan; offset++) {
                const subcol = subHeaderRow[colIndex + offset];
                const date = $(subcol).text().trim();
                subcols.push({ date, columns: [colIndex + offset + 1] }); // 1-based
            }

            // flatten and merge columns for same date
            const dateMap = {};
            for (const item of subcols) {
                if (!dateMap[item.date]) dateMap[item.date] = [];
                dateMap[item.date].push(...item.columns);
            }

            for (const [date, columns] of Object.entries(dateMap)) {
                results.push({ date, columns });
            }
        }

        colIndex += colspan;
    }

    return results;

};

function numToColLetter(n) {
    let s = '';
    while (n > 0) {
        let r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

const getSupercellBeautData = async ($, schedule, truck, day) => {
    const table = $('table');
    const rows = table.find('tr').toArray();
    const unitRowIndices = getUnitRowIndices($, truck);
    const dayInfo = getDateAndColumnsForDay($, schedule, day)[0];

    if (!dayInfo || unitRowIndices.length === 0) return { assignments: [], notes: [] };

    const [col1, col2] = dayInfo.columns;
    const assignments = [];
    const notes = [];

    for (const [i, rowIndex] of unitRowIndices.entries()) {
        const row = $(rows[rowIndex]);
        const cells = row.find('td').toArray();

        let colPointer = 1;
        const cellMap = new Map();

        for (const cell of cells) {
            const colspan = parseInt($(cell).attr('colspan') || '1', 10);
            const content = $(cell).text().trim();

            for (let offset = 0; offset < colspan; offset++) {
                cellMap.set(colPointer, content);
                colPointer++;
            }
        }

        const time = cellMap.get(col1);
        const name = cellMap.get(col2);

        if (time && !name) {
            assignments.push({ time, name: '<OPEN>' });
        } else if (time && name) {
            assignments.push({ time, name });
        } else if (!time && name) {
            notes.push(name);
        }
    }

    return { assignments, notes };
};

const getScheduleByDayMerged = ($, tableId, unitIds) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const schedule = {};

    for (const day of days) {
        const daySchedule = {};

        for (const unit of unitIds) {
            const result = getSupercellBeautData($, tableId, unit, day);
            const grouped = {};

            for (const { time, name } of result.assignments) {
                if (!grouped[time]) grouped[time] = [];
                grouped[time].push(name);
            }

            const assignments = Object.entries(grouped).map(([time, names]) => ({
                time,
                names
            }));

            daySchedule[unit] = {
                assignments,
                notes: result.notes
            };
        }

        schedule[day] = daySchedule;
    }

    return schedule;
};

(async  () => {
    const schedule = await getSchedule();
    const $ = cheerio.load(await schedule);
    normalizeSoftmergeCells($);
    console.log(await getDateAndColumnsForDay($, 'Mon'));
    // const x = await getSupercellBeautData($, schedule, 'A11', 'Wed');
    // console.log(x);
    // getSupercell(schedule, 'A11', 'Mon');
})();

