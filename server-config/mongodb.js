const mongoose = require('mongoose');

module.exports = () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/inhouse';

    

    const mdbConfig = {
        useCreateIndex: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        promiseLibrary: global.Promise
    };

    mongoose.connect(MONGODB_URI, mdbConfig);
    mongoose.connection.once('open', () => {
        console.log('mongoose connection successful');
    });
};