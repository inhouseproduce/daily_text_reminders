const fs = require('fs');
const {google} = require('googleapis');


const CREDENTIALS = process.env.GOOGLE_CRED;
const TOKEN = process.env.GOOGLE_TOKEN;

function loadTextReminders(){
  try
  {
    // Load client secrets from a local file.
    return authorize(JSON.parse(CREDENTIALS), main);

    // var content = fs.readFileSync(CREDENTIALS, 'utf8')
      // return authorize(JSON.parse(content), main);
  }
  catch(err)
  {
    console.log("Here's an error in with credentials: " + err);

  }

}
function authorize(credentials, callback) {

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try{

    oAuth2Client.setCredentials(JSON.parse(TOKEN));
    return callback(oAuth2Client);  

}
  catch(err)
  {
    console.log("Here's an error: "+err);
  }
}

async function getMessages(auth) {

  //get messages from Google Sheets
  const sheets = google.sheets({ version: "v4", auth });
  const daily_check = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'System!A:A',
  });
  const seeding = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Seeding!A:A',
  });
  console.log(daily_check.data.values.flat())
  return [daily_check.data.values.flat(), seeding.data.values.flat()];
}

async function main(auth) {
  const data = await getMessages(auth);
  return data;
}

module.exports = {
  getTextReminders: loadTextReminders
};
