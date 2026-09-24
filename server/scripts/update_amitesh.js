const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');

const updatedMember = {
  _id: {
    $oid: "67dfc15351c797667a434999"
  },
  basic: {
    salutation: "",
    name: "Amitesh R",
    gender: "Male",
    dateofbirth: {
      $date: "2006-08-20T00:00:00.000Z"
    },
    label: "BE 2017, CSE",
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
          stream: "Computer Science and Engineering",
          entity: "",
          start_year: 2013,
          start_month: 0,
          end_year: "2017",
          end_month: 0
        }
      ]
    }
  ],
  education_details: [
    {
      course: "Bachelor of Engineering",
      stream: "Computer Science and Engineering",
      institution: "National Engineering College, Kovilpatti",
      start_year: 2013,
      end_year: "2017",
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
    mobile: "7810013672",
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

async function updateDB() {
  const filePath = path.join(__dirname, '../../DB File/test.members.json');
  console.log("Reading test.members.json at:", filePath);

  let content = fs.readFileSync(filePath, 'utf-8');

  // Find the Amitesh R record at the beginning
  // It starts right after the opening '['
  const startIdx = content.indexOf('{');
  // Find where the first record ends (before the second record)
  const secondRecordIdx = content.indexOf('\n{\n  "_id": {\n    "$oid": "68dfc15351c797667a43453e"');
  
  if (startIdx !== -1 && secondRecordIdx !== -1) {
    const formattedMember = JSON.stringify(updatedMember, null, 2);
    const newContent = content.slice(0, startIdx) + formattedMember + ",\n" + content.slice(secondRecordIdx + 1);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log("Successfully updated Amitesh R in test.members.json!");
  } else {
    console.error("Could not find boundary for Amitesh R in test.members.json", { startIdx, secondRecordIdx });
  }

  // Update MongoDB
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/election_db";
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('election_db');

    const mongoDoc = {
      ...updatedMember,
      basic: {
        ...updatedMember.basic,
        dateofbirth: new Date("2006-08-20T00:00:00.000Z")
      }
    };
    delete mongoDoc._id;

    const result = await db.collection('members').updateOne(
      { 
        $or: [
          { 'basic.email_id': 'muthumayil13@gmail.com' },
          { 'basic.alternate_email_id': 'muthumayil13@gmail.com' }
        ]
      },
      { $set: mongoDoc },
      { upsert: true }
    );
    console.log("MongoDB update result:", result);
    console.log("Successfully updated Amitesh R in MongoDB members collection!");

    // Also verify whether user exists in 'users' collection, if so delete to allow clean re-registration
    const deleteUserRes = await db.collection('users').deleteOne({ email: 'muthumayil13@gmail.com' });
    if (deleteUserRes.deletedCount > 0) {
      console.log("Cleaned up previous user record from users collection.");
    }

    await client.close();
  } catch (err) {
    console.warn("MongoDB update error:", err.message);
  }
}

updateDB().catch(console.error);
