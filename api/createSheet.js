const { google } = require('googleapis');

export default async function handler(req, res) {
  // Add CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', 'https://theredsrt4.github.io'); // Replace with your GitHub Pages domain
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Respond OK to preflight requests
  }

  if (req.method === 'POST') {
    const { data, sheetName } = req.body;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // Step 1: Create a new spreadsheet
      const spreadsheetResponse = await drive.files.create({
        resource: {
          name: sheetName || 'New Spreadsheet',
          mimeType: 'application/vnd.google-apps.spreadsheet',
        },
        fields: 'id',
      });

      const spreadsheetId = spreadsheetResponse.data.id;

      // Step 2: Write data to the new spreadsheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: { values: data },
      });

      return res.status(200).json({ message: 'Spreadsheet created and data added!', spreadsheetId });
    } catch (error) {
      console.error('Error creating spreadsheet or writing data:', error);
      return res.status(500).json({ error: 'Failed to create spreadsheet or write data.' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}