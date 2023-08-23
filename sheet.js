import express from 'express';
import { google } from 'googleapis';
import credentials from '../GooglesheetsAPI/secrets.json' assert { type: 'json' };

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

export const sheets = google.sheets({ version: 'v4', auth });
export const drive = google.drive({ version: 'v3', auth });

const app = express();
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

    // Grant access to the user at Google Drive level
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

app.post('/update-spreadsheet', async (req, res) => {
  try {
    const { spreadsheetId, data } = req.body;

    const sheets = google.sheets({ version: 'v4', auth });

    // Get the current data in the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1',
    });
    const values = response.data.values;

    // Determine the next empty row
    const nextRow = values ? values.length + 1 : 2;

    // Trim the values in the data array
    const trimmedData = data.map(value => value.trim());

    // Update the data in the spreadsheet
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [trimmedData],
      },
    });

    console.log('Spreadsheet data updated:', updateResponse.data);

    res.status(200).json({
      message: 'Spreadsheet data updated successfully.',
    });
  } catch (error) {
    console.error('Error updating spreadsheet data:', error);
    res.status(500).json({
      error: 'An error occurred while updating the spreadsheet data.',
    });
  }
});

app.post('/delete-content', async (req, res) => {
  try {
    const { spreadsheetId, data } = req.body;

    const sheets = google.sheets({ version: 'v4', auth });

    // Get the current data in the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1',
    });
    const values = response.data.values;

    // Find the index of the row to be deleted based on the provided data
    const rowIndex = values.findIndex(row => row.join('') === data.join(''));

    if (rowIndex !== -1) {
      // Calculate the range of the row to be deleted
      const range = `Sheet1!A${rowIndex + 1}:${rowIndex + 1}`;

      // Delete the row
      const deleteResponse = await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });

      console.log('Row deleted:', deleteResponse.data);

      res.status(200).json({
        message: 'Row deleted successfully.',
      });
    } else {
      res.status(404).json({
        error: 'Row not found for deletion.',
      });
    }
  } catch (error) {
    console.error('Error deleting row:', error);
    res.status(500).json({
      error: 'An error occurred while deleting the row.',
    });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000.');
});
