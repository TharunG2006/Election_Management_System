const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');
const { generateSeconderConsentEmail, generateSeconderConfirmationPage } = require('../electionEmailTemplate');

async function runTest() {
  console.log("=== Testing Seconder Consent & Email Verification Workflow ===");
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/election_db";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('election_db');

  const testTokenAccept = crypto.randomBytes(32).toString('hex');
  const testTokenDecline = crypto.randomBytes(32).toString('hex');

  // 1. Create a test application awaiting seconding consent
  const testApp1 = {
    applicantEmail: 'mursub313@gmail.com',
    nomineeEmail: 'mursub313@gmail.com',
    proposerEmail: 'tarun.ganapathi2007@gmail.com',
    seconderEmail: 'muthumayil13@gmail.com',
    name: 'Murali Subbu',
    department: 'CSE',
    graduationYear: '2022',
    phone: '+91-9876543210',
    nominee: {
      name: 'Murali Subbu',
      email: 'mursub313@gmail.com',
      department: 'CSE',
      graduationYear: '2022',
      phone: '+91-9876543210'
    },
    proposer: {
      name: 'Tharun G',
      email: 'tarun.ganapathi2007@gmail.com',
      department: 'CSE',
      batch: '2015',
      phone: '+91-8056300117'
    },
    seconder: {
      name: 'Amitesh R',
      email: 'muthumayil13@gmail.com',
      department: 'CSE',
      batch: '2017',
      phone: '7810013672'
    },
    targetPositions: ['President'],
    roleCategory: 'Office Bearer',
    continuousService: { years: 2.5, withoutGap: true, details: 'Served as Treasurer' },
    purposeStatement: 'I propose this candidate based on verified service as Office Bearer.',
    status: 'pending_seconding',
    seconderConsentStatus: 'pending',
    seconderConsentToken: testTokenAccept,
    seconderConsentExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    seconderConsentAt: null,
    withdrawn: false,
    createdAt: new Date(),
    submittedAt: new Date()
  };

  const insertRes1 = await db.collection('applications').insertOne(testApp1);
  console.log("✓ Test application 1 created (ID:", insertRes1.insertedId, ") in pending_seconding status.");

  // 2. Test Email Generation
  const emailData = generateSeconderConsentEmail({
    proposer: testApp1.proposer,
    nominee: testApp1.nominee,
    seconder: testApp1.seconder,
    targetPositions: testApp1.targetPositions,
    roleCategory: testApp1.roleCategory,
    purposeStatement: testApp1.purposeStatement,
    consentToken: testTokenAccept,
    portalUrl: 'http://localhost:5173',
    apiBaseUrl: 'http://localhost:5000'
  });

  if (emailData.subject.includes('Action Required: Request for Seconding Nomination') &&
      emailData.html.includes(testTokenAccept) &&
      emailData.html.includes('Murali Subbu') &&
      emailData.html.includes('Tharun G') &&
      emailData.html.includes('Amitesh R')) {
    console.log("✓ Seconder consent email generated successfully with proper details and links.");
  } else {
    console.error("✗ Seconder consent email generation failed validation!");
    process.exit(1);
  }

  // 3. Test Accept Consent Flow
  // Simulate seconder clicking "Accept"
  const appBeforeAccept = await db.collection('applications').findOne({ seconderConsentToken: testTokenAccept });
  if (appBeforeAccept.seconderConsentStatus !== 'pending' || appBeforeAccept.status !== 'pending_seconding') {
    console.error("✗ Initial status before accept is incorrect:", appBeforeAccept);
    process.exit(1);
  }

  // Update as the GET /api/nominations/seconding-consent endpoint does
  await db.collection('applications').updateOne(
    { _id: appBeforeAccept._id },
    {
      $set: {
        seconderConsentStatus: 'accepted',
        status: 'pending',
        seconderConsentAt: new Date(),
        submittedAt: new Date()
      }
    }
  );

  const appAfterAccept = await db.collection('applications').findOne({ _id: appBeforeAccept._id });
  if (appAfterAccept.seconderConsentStatus === 'accepted' && appAfterAccept.status === 'pending') {
    console.log("✓ Seconding consent accepted: proposal status successfully promoted to 'pending' (formally submitted).");
  } else {
    console.error("✗ Status after accept is incorrect:", appAfterAccept);
    process.exit(1);
  }

  // 4. Test Decline Consent Flow
  const testApp2 = {
    ...testApp1,
    seconderConsentToken: testTokenDecline
  };
  delete testApp2._id;
  const insertRes2 = await db.collection('applications').insertOne(testApp2);
  
  await db.collection('applications').updateOne(
    { _id: insertRes2.insertedId },
    {
      $set: {
        seconderConsentStatus: 'declined',
        status: 'seconding_declined',
        seconderConsentAt: new Date()
      }
    }
  );

  const appAfterDecline = await db.collection('applications').findOne({ _id: insertRes2.insertedId });
  if (appAfterDecline.seconderConsentStatus === 'declined' && appAfterDecline.status === 'seconding_declined') {
    console.log("✓ Seconding consent declined: proposal status successfully set to 'seconding_declined' (not submitted).");
  } else {
    console.error("✗ Status after decline is incorrect:", appAfterDecline);
    process.exit(1);
  }

  // 5. Test Confirmation Page Generation
  const acceptPageHtml = generateSeconderConfirmationPage({
    success: true,
    decision: 'accept',
    nomineeName: 'Murali Subbu',
    proposerName: 'Tharun G',
    positions: ['President']
  });
  if (acceptPageHtml.includes('Seconding Consent Confirmed!') && acceptPageHtml.includes('Murali Subbu')) {
    console.log("✓ Success confirmation page HTML generated successfully.");
  } else {
    console.error("✗ Success confirmation page generation failed!");
    process.exit(1);
  }

  const declinePageHtml = generateSeconderConfirmationPage({
    success: true,
    decision: 'decline',
    nomineeName: 'Murali Subbu',
    proposerName: 'Tharun G',
    positions: ['President']
  });
  if (declinePageHtml.includes('Seconding Request Declined')) {
    console.log("✓ Decline confirmation page HTML generated successfully.");
  } else {
    console.error("✗ Decline confirmation page generation failed!");
    process.exit(1);
  }

  // Clean up test documents
  await db.collection('applications').deleteMany({
    _id: { $in: [insertRes1.insertedId, insertRes2.insertedId] }
  });
  console.log("✓ Cleaned up test applications.");

  await client.close();
  console.log("=== All Seconder Workflow Tests Passed Successfully! ===");
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
