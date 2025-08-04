const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CREDENTIALS_PATH = './google-creds.json'; // Service account JSON file
const OUTPUT_PATH = './file.zip';

async function exportSheetAsHtml() {
    const auth = new google.auth.GoogleAuth({
        keyFile: path.resolve(CREDENTIALS_PATH),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    // const metadata = await drive.files.get({
    //     fileId: SPREADSHEET_ID,
    //     fields: 'id, name, mimeType',
    // });
    // console.log(metadata.data);

    const res = await drive.files.export(
        {
            fileId: SPREADSHEET_ID,
            mimeType: 'application/zip',
        },
        { responseType: 'stream' }
    );

    //start
    const dest = fs.createWriteStream(OUTPUT_PATH);
    await new Promise((resolve, reject) => {
        res.data
            .on('end', () => {
                console.log(`Exported sheet saved to ${OUTPUT_PATH}`);
                resolve();
            })
            .on('error', err => {
                console.error('Error downloading file:', err);
                reject(err);
            })
            .pipe(dest);
    });
}

exportSheetAsHtml().catch(console.error);

//end

//     const chunks = [];
//     await new Promise((resolve, reject) => {
//         res.data
//             .on('data', chunk => chunks.push(chunk))
//             .on('end', resolve)
//             .on('error', reject);
//     });

//     const htmlContent = Buffer.concat(chunks).toString('utf8');
//     return htmlContent;
// }

// // === USAGE ===
// exportSheetAsHtml()
//     .then(html => {
//         console.log('Sheet HTML content:\n');
//         console.log(html); // ← HTML stored in the `html` variable
//     })
//     .catch(err => {
//         console.error('Failed to export sheet:', err);
//     });