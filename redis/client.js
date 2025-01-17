const { createClient } = require('redis');

const client = createClient({
 url: process.env.REDIS_URI
});


client.on('error', (err) => {
 console.error('Redis Error:', err);
});

(async () => {
 try {
   await client.connect();
   console.log('Connected to Redis');
 } catch (err) {
   console.error('Failed to connect to Redis:', err);
 }
})();

module.exports = client;
