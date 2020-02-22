
const CronJob = require('cron').CronJob;
const CronTime = require('cron').CronTime;
const fetch = require("node-fetch");
const loadTextReminders = require('./getTextReminders.js').getTextReminders;
const loadClients = require('./getTextReminders.js').getClientInfo;

var cronJobs = {};

module.exports = (  ) => {

  console.log("In send_sms.js ");

  //initial start of jobs 
  main();

  //at midnight, recheck the jobs 
  new CronJob("0 0 0 * * *", main,  null, true, "America/Los_Angeles");

};

function main()
{

    console.log("in main")

    loadClients().then(client_data =>{

      //create newClientList from database in case of 
      //    newly added or deleted client
      var newClientList = [];
      client_data.clients.forEach(client =>
        {
          newClientList.push(client.name+client.client);
        }
      );

      //compare the previous users stored already to the current 
      //    database and remove users that are no longer in the database
      Object.keys(cronJobs).forEach(client =>
        { 
          if (!(newClientList).includes(client))
         {    

          //for debugging
          //   console.log("client " + client + " no longer in database so they're cronjobs are getting stopped");
          console.log("client's cron jobs have been stopped because they are no longer in the database")
          cronJobs[client]['seeding'].stop();
          cronJobs[client]['daily_check'].stop();         
        }
       });
       

      //add new clients or create new schedule for an existing client
      client_data.clients.forEach(client => 
      {
        var clientKey = client.name + client.client;

        if (Object.keys(cronJobs).includes(clientKey))
        {
          //for debugging
          // console.log("new schedule for " + client.name + " at " + client.schedule_seeding + " and " + client.schedule_daily_checkups);
          console.log("new scheduling at " + client.schedule_seeding + " and " + client.schedule_daily_checkups);

          cronJobs[clientKey]['seeding'].setTime(new CronTime(client.schedule_seeding, "America/Los_Angeles"));
          cronJobs[clientKey]['daily_check'].setTime(new CronTime(client.schedule_daily_checkups, "America/Los_Angeles"));
        
          cronJobs[clientKey]['seeding'].start();
          cronJobs[clientKey]['daily_check'].start();

        }
        else
        {
          //for debugging
          // console.log("new client named " + client.name + " at " + client.schedule_seeding + " and " + client.schedule_daily_checkups);
          console.log("new client with schedules at " + client.schedule_seeding + " and " + client.schedule_daily_checkups);

          const customerPhone = client.phoneNo;
          cronJobs[clientKey] = {};
          cronJobs[clientKey]['seeding'] = new CronJob(client.schedule_seeding, messageToCustomer.bind(this, customerPhone, 'seeding', client.name, client.client),  null, true, "America/Los_Angeles");
          cronJobs[clientKey]['daily_check'] = new CronJob(client.schedule_daily_checkups, messageToCustomer.bind(this, customerPhone, 'daily_check', client.name, client.client),  null, true,"America/Los_Angeles");
      }

      });

    })

}

function randomIndex(arrayLength)
{
  // returns a random number
  return Math.floor(Math.random() * arrayLength);
}

function sendMessage(phoneNo, message)
{
  // send a SMS message, message, to phoneNo from the Twilio Number
  
  console.log("Sending SMS Message!");

  fetch('http://localhost:3001/api/messages', {
    method: 'POST',
    headers: 
    {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"to":phoneNo,"body": message})
  }).catch(err => console.error("Here's an error from sendMessage(): " + err));

}


function messageToCustomer(customerPhone, typeOfMessage, name, client)
{
  // checks which type of message to send (seeding or daily check) and calls sendMessage to send the message
  
  loadTextReminders().then(message_array => {
      var message = "";
      if (typeOfMessage === "seeding")
      {
        message = message_array[1][randomIndex(message_array[1].length)];
      }
      else
      {
        message =  message_array[0][randomIndex(message_array[0].length)];
      }

      sendMessage(customerPhone, message.replace('%name%', name).replace('%client%', client));

    });

}