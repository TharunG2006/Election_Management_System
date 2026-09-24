const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('election_db');

  // Ensure tarun.ganapathi2007@gmail.com has valid bcrypt password and role: 'alumni'
  const hashedPassword = await bcrypt.hash("Password@123", 10);
  await db.collection('users').updateOne(
    { email: 'tarun.ganapathi2007@gmail.com' },
    { 
      $set: { 
        password: hashedPassword,
        role: 'alumni',
        name: 'Tharun G',
        graduationYear: '2015',
        department: 'CSE',
        phone: '+91-8056300117'
      } 
    },
    { upsert: true }
  );
  console.log("Updated tarun.ganapathi2007@gmail.com with role='alumni' and Password@123");

  // Ensure a test member exists in 'members' collection for registration tests
  await db.collection('members').updateOne(
    { 'basic.email_id': 'verified.alumni.candidate@nec.edu.in' },
    {
      $set: {
        basic: {
          name: "Test Candidate",
          email_id: "verified.alumni.candidate@nec.edu.in",
          dateofbirth: "1994-06-20"
        },
        education_details: [
          { end_year: "2016", degree: "B.E", department: "ECE" }
        ]
      }
    },
    { upsert: true }
  );
  console.log("Seeded verified.alumni.candidate@nec.edu.in into members collection for registration testing");

  await client.close();
}

main().catch(console.error);
