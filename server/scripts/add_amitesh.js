const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const newMember = {
  _id: {
    $oid: "67dfc15351c797667a434999"
  },
  basic: {
    salutation: "",
    name: "Amitesh R",
    gender: "",
    dateofbirth: null,
    label: "BE ECE 2027",
    email_id: "muthumayil13@gmail.com",
    alternate_email_id: "muthumayil13@gmail.com",
    profile_updated_on: {
      $date: new Date().toISOString()
    },
    profile_links: {
      facebook: "",
      linkedin: "",
      twitter: "",
      website: "",
      youtube: "",
      instagram: ""
    }
  },
  pictures: {
    profile: "",
    thumb: "",
    full: ""
  },
  membership_details: [
    {
      site_id: "151571399",
      status: "Accepted",
      registered_on: {
        $date: "2025-09-23T00:00:00.000Z"
      },
      approved_on: {
        $date: "2026-04-29T00:00:00.000Z"
      },
      admin_note: "",
      details: [
        {
          relation: "Student",
          roll_no: "",
          course: "Bachelor of Engineering",
          stream: "Electronics & Communication Engineering",
          entity: "",
          start_year: 2023,
          start_month: 0,
          end_year: "2027",
          end_month: 0
        }
      ]
    }
  ],
  education_details: [
    {
      course: "Bachelor of Engineering",
      stream: "Electronics & Communication Engineering",
      institution: "National Engineering College, Kovilpatti",
      start_year: 2023,
      end_year: "2027",
      site_id: "151571399"
    }
  ],
  professional_details: {
    experience_years: null,
    skills: [],
    industries: [],
    roles: []
  },
  work_details: [],
  contact_details: {
    mobile: "+91-9876543210",
    home: "",
    office: "",
    current_location: {
      location: "Kovilpatti, India",
      city: "Kovilpatti",
      country: "India"
    },
    address: []
  },
  member_roles: [],
  other: []
};

async function run() {
  const filePath = path.join(__dirname, '../../DB File/test.members.json');
  console.log("Reading test.members.json at:", filePath);
  
  // Read file content
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if muthumayil13@gmail.com is already present
  if (content.includes("muthumayil13@gmail.com")) {
    console.log("muthumayil13@gmail.com is already present in test.members.json");
  } else {
    // Insert newMember at the beginning of the JSON array
    // The file starts with [
    const firstBracketIdx = content.indexOf('[');
    if (firstBracketIdx !== -1) {
      const formattedMember = JSON.stringify(newMember, null, 2);
      const rest = content.slice(firstBracketIdx + 1).trimStart();
      // If rest starts with {, prepend newMember with comma
      const newContent = content.slice(0, firstBracketIdx + 1) + "\n" + formattedMember + (rest.startsWith('{') ? ",\n" : "") + rest;
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log("Successfully inserted Amitesh R into test.members.json!");
    } else {
      console.error("Could not find opening '[' in test.members.json");
    }
  }

  // Also sync to MongoDB if connected
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/election_db";
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('election_db');
    
    // Upsert into members collection
    const mongoDoc = { ...newMember };
    delete mongoDoc._id;
    await db.collection('members').updateOne(
      { 'basic.email_id': 'muthumayil13@gmail.com' },
      { $set: mongoDoc },
      { upsert: true }
    );
    console.log("Successfully upserted Amitesh R into MongoDB members collection!");
    
    await client.close();
  } catch (err) {
    console.warn("MongoDB update error (will rely on test.members.json):", err.message);
  }
}

run().catch(console.error);
