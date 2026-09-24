const nodemailer = require('nodemailer');

async function test() {
  console.log("Generating instant Ethereal email account...");
  const account = await nodemailer.createTestAccount();
  console.log("Account created:", account.user);
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const info = await transporter.sendMail({
    from: '"Alumni Election Commission" <election@alumni.org>',
    to: 'mursub313@gmail.com',
    subject: 'Official Election Notification 2026',
    html: '<h2>Official Gazette Notification</h2><p>Call for nominations is open.</p>'
  });

  console.log("Message sent successfully!");
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

test().catch(console.error);
