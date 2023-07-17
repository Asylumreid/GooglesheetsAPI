import express from 'express';
import { google } from 'googleapis';

const app = express();

// Load the service account credentials JSON file
import credentials from '../GooglesheetsAPI/secrets.json' assert { type: 'json' };

// Authenticate using the service account credentials
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

app.use(express.json());

app.post('/create-spreadsheet', async (req, res) => {
  try {
    const { eventTitle, columnHeaders } = req.body;

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create the spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: eventTitle,
        },
      },
    });
    const spreadsheetId = createResponse.data.spreadsheetId;

    // Update the first sheet with column headers
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [columnHeaders],
      },
    });

    // Grant access to the user at the Drive level
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: 'shoulderinjury5@gmail.com', // Replace with your main account's email address
      },
    });

    console.log('Access granted to the user.');
    console.log('New spreadsheet created:', createResponse.data);

    res.status(200).json({
      message: 'Spreadsheet created successfully.',
      spreadsheetId,
    });
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    res.status(500).json({
      error: 'An error occurred while creating the spreadsheet.',
    });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000.');
});