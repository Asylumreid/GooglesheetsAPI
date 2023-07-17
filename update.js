import express from 'express';
import { sheets, drive } from './GooglesheetsAPI/auth.js';

app.use(express.json());

app.post('/update-spreadsheet', async (req, res) => {
  try {
    const { spreadsheetId, data } = req.body;

    const sheets = google.sheets({ version: 'v4', auth });

    // Update the data in the spreadsheet
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A2', // Assuming the data starts from the second row (excluding headers)
      valueInputOption: 'RAW',
      requestBody: {
        values: [data],
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

app.listen(3000, () => {
  console.log('Server is running on port 3000.');
});