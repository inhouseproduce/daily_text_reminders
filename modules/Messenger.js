const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const MessagingSchema = new Schema({

});

const Messenger = mongoose.model("messaging", MessagingSchema, "messaging");
module.exports = Messenger;