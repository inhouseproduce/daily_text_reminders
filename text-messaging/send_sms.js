
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

function clientsFromDatabase(client_data)
{
  //return array of client name/ids from database at current moment

  var newClientList = [];
  client_data.clients.forEach(client =>
    newClientList.push(client.name+client.client)
  );
  return newClientList
}

function removeMissingClients(newClientList)
{
  //removes clients that previously had cron jobs but no longer in database at current moment

  Object.keys(cronJobs).forEach(client =>
  { 
      if (!(newClientList).includes(client))
      {    
        console.log("client's cron jobs have been stopped because they are no longer in the database")

        if (cronJobs[client]['seeding'] != 'null')
          cronJobs[client]['seeding'].stop();

        if (cronJobs[client]['daily_check'] != 'null')
          cronJobs[client]['daily_check'].stop();         
      }
  });

}

function rescheduleCrobJob(client, schedule, clientKey, customerPhone, type)
{
    //if there is a schedule in the database for the client, schedule it
    if(schedule != "null")
    { 
      console.log("   -new ", type, " schduled")

      if(cronJobs[clientKey][type] != "null")
      {      
          cronJobs[clientKey][type].setTime(new CronTime(schedule, "America/Los_Angeles"));
          cronJobs[clientKey][type].start();
      }
      else
        cronJobs[clientKey][type] = new CronJob(schedule, messageToCustomer.bind(this, customerPhone, type, client.name, client.client),  null, true, "America/Los_Angeles");
    }
    else
    {
      console.log("   -no ", type, " schduled")
      //if the client already had a cron job and no longer has one in the current database, stop the cron job
      if (cronJobs[clientKey][type] != "null")  
          cronJobs[clientKey][type].stop()
    }
}


function scheduleCronJob(client, schedule, clientKey, customerPhone, type)
{
  if(schedule != "null")
  { 
    console.log("   -", type, "  scheduled")
    cronJobs[clientKey][type] = new CronJob(schedule, messageToCustomer.bind(this, customerPhone, type, client.name, client.client),  null, true, "America/Los_Angeles");
  }
  else
  {
    console.log("   -no ", type, "  scheduled")
    cronJobs[clientKey][type] = "null"
  }

}

function main()
{

    console.log("in main")

    loadClients().then(client_data =>{

      //create newClientList from database in case of 
      //    newly added or deleted client
      var newClientList = clientsFromDatabase(client_data)

      //compare the previous users stored already to the current 
      //    database and remove users that are no longer in the database
      removeMissingClients(newClientList)
       

      //add new clients or create new schedule for an existing client
      client_data.clients.forEach(client => 
      {
        var clientKey = client.name + client.client;
        const customerPhone = client.phoneNo;

        //if the current client already has a cron job set up, reschedule the cron job with a new time
        if (Object.keys(cronJobs).includes(clientKey))
        {
          console.log("new scheduling at " + client.schedule_seeding + " and " + client.schedule_daily_checkups);

          rescheduleCrobJob(client, client.schedule_seeding, clientKey, customerPhone, 'seeding')
          rescheduleCrobJob(client, client.schedule_daily_checkups, clientKey, customerPhone, 'daily_check')
        }
        else
        {
          //this is for new clients from the database
          console.log("new client with schedules at " + client.schedule_seeding + " and " + client.schedule_daily_checkups);
         
          cronJobs[clientKey] = {};
          scheduleCronJob(client, client.schedule_seeding, clientKey, customerPhone, "seeding")
          scheduleCronJob(client, client.schedule_daily_checkups, clientKey, customerPhone, "daily_check")
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
        message = message_array[1][randomIndex(message_array[1].length)];
      else
        message =  message_array[0][randomIndex(message_array[0].length)];

      sendMessage(customerPhone, message.replace('%name%', name).replace('%client%', client));
    });
}