
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cluster = require('cluster');
const os = require('os');

process.on('uncaughtException', (err) => {
  console.log('uncaught exception');
  console.log(err.name, err.message);
  process.exit(1);
 });

dotenv.config({path: './config.env'});

const client = require('./redis/client');
const app = require('./app');

const DB = process.env.DATABASE.replace(
 '<PASSWORD>',
 process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log('DB connection successful'))

const numCPUs = process.env.NUM_CPUs;

if(cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);

  for(let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Spawning a new worker...');
    cluster.fork();
  });
} else {
  const port = process.env.PORT || 3000;

  console.log(`🚀 Worker ${process.pid} is running on port ${port}`);


const server = app.listen(port, () => {
  console.log(`${process.pid} App running on ${port}`);
});

 process.on('unhandledRejection', (err) => {
  console.log('Unhandled reject');
  console.log(err.name, err.message);
 
  server.close(() => {
   process.exit(1);
  });
 });
}



 





