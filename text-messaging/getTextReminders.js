const {google} = require('googleapis');
const CREDENTIALS = process.env.GOOGLE_CRED 
const TOKEN = process.env.GOOGLE_TOKEN 

function loadTextReminders(){
  try
  {
    // Load client secrets
    return authorize(JSON.parse(CREDENTIALS), messages);
  }
  catch(err)
  {
    console.log("Here's an error in with credentials: " + err);
  }
}

function loadClientInfo(){
  try
  {
    // Load client secrets 
    return authorize(JSON.parse(CREDENTIALS), clientInfo);
  }
  catch(err)
  {
    console.log("Here's an error in with credentials: " + err);
  }
}

function authorize(credentials, callback) {

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  try
  {
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

  return [daily_check.data.values.flat(), seeding.data.values.flat()];
}

async function getClients(auth) {

  //get client data from Google Sheets
  const sheets = google.sheets({ version: "v4", auth });
  const clients = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'Client Info!A:E',
  });

  return clients.data.values;
}

async function messages(auth) {
  const data = await getMessages(auth);
  return data;
}

async function clientInfo(auth) {
  const data = await getClients(auth);
  data.shift()
  return convertToJSON(data);
}

function convertToJSON(data){

    // convert client data into a json object
    var clientJSON = {};
    clientJSON['clients'] = []
    data.forEach(element => {

      var clientEntry = {}
      clientEntry['name'] = element[0] || 'null'
      clientEntry['client'] = element[1] || 'null'
      clientEntry['phoneNo'] = element[2] || 'null'
      clientEntry['schedule_seeding'] = element[3] || 'null'
      clientEntry['schedule_daily_checkups'] = element[4] || 'null'

      clientJSON['clients'].push(clientEntry)
    });
    return clientJSON
}

module.exports = {
  getTextReminders: loadTextReminders,
  getClientInfo: loadClientInfo
};
