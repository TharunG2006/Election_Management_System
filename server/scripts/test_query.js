const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('election_db');
  const users = await db.collection('users').find({}, { projection: { name: 1, email: 1, role: 1 } }).toArray();
  console.log("Current Users in DB:", users);
  
  const sampleMember = await db.collection('members').findOne({}, { projection: { 'basic.name': 1, 'basic.email_id': 1, 'basic.dateofbirth': 1, 'education_details.end_year': 1 } });
  console.log("Sample Member in DB:", JSON.stringify(sampleMember));
  await client.close();
}

main().catch(console.error);
