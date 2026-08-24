require('dotenv').config({ path: '../.env' });
const { MongoClient } = require('mongodb');

async function deleteUser() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB.");
    
    const db = client.db('election_db');
    const result = await db.collection('users').deleteMany({ email: 'tarun.ganapathi2007@gmail.com' });
    
    console.log(`Successfully deleted ${result.deletedCount} user(s) with email tarun.ganapathi2007@gmail.com.`);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    await client.close();
  }
}

deleteUser();
