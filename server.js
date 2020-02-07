const express = require('express');
const app = express();
const sendText = require('./text-messaging/send_sms.js');
const client = require('twilio')(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);
const twilioNo = process.env.TWILIO_PHONE;
const PORT = process.env.PORT || 3001;

const mongoConnection = require('./server-config/mongodb');
const setHeader = require('./server-config/header');

if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
};

// Mongo connection
mongoConnection();


// SMS messages sender
sendText();

// Use header
setHeader(app);

//Routes
// require('./routes')(app, db);

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, './client/build/index.html'));
// });

app.post('/api/messages', (req, res) => {
  res.header('Content-Type', 'application/json');
  client.messages
    .create({
      from: twilioNo,
      to: req.body.to,
      body: req.body.body
    })
    .then(() => {
      res.send(JSON.stringify({ success: true }));
    })
    .catch(err => {
      console.log(err);
      res.send(JSON.stringify({ success: false }));
    });
});

app.listen(PORT, () => {
    console.log(`🌎 ==> Server now on port ${PORT}!`);
});



