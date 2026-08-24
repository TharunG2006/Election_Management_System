require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB.");

    const database = client.db('election_db');
    const members = database.collection('members');

    try {
      await members.drop();
      console.log("Dropped existing 'members' collection.");
    } catch (e) {
      console.log("'members' collection does not exist, skipping drop.");
    }

    const filePath = path.join(__dirname, '../../DB File/test.members.json');
    console.log(`Reading data from ${filePath}...`);
    
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    
    console.log(`Successfully read ${data.length} records. Cleaning up ObjectIds...`);
    
    // Fix ObjectIds from EJSON to native ObjectIds
    data.forEach(item => {
      if (item._id && item._id.$oid) {
        item._id = new ObjectId(item._id.$oid);
      }
    });

    console.log("Beginning bulk insert...");
    
    const batchSize = 5000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await members.insertMany(batch);
      console.log(`Inserted records ${i} to ${i + batch.length - 1}`);
    }

    console.log("Import finished successfully!");
  } catch (err) {
    console.error("An error occurred during import:");
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
