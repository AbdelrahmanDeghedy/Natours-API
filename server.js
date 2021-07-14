const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('Uncaught Exception, Shutting down the server ... ');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' }); // the path of the config file
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    // console.log(con.connections);
    console.log('Connected to cluster successfully!');
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('Unhandled Rejection, Shutting down the server ... ');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
