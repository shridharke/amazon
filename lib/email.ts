import nodemailer from 'nodemailer';

interface VETNotificationData {
  date: string;
  packages: number;
  scheduleId: number;
}

export async function sendVetNotification(
  emails: string[], 
  data: VETNotificationData
) {
  const confirmationLink = `${process.env.NEXT_PUBLIC_APP_URL}/vet-confirm/${data.scheduleId}`;

  console.log('Sending VET notification to:', emails);
  console.log('Confirmation link:', confirmationLink);

  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use custom SMTP settings
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASSWORD, // app password for your email
    },
  });

  // Create array of email objects
  const mailPromises = emails.map(email => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `VET Available for ${new Date(data.date).toLocaleDateString()}`,
      html: `
        <div>
          <h2>VET Opportunity Available</h2>
          <p>A VET opportunity is available for ${new Date(data.date).toLocaleDateString()}.</p>
          <p>Number of packages to be handled: ${data.packages}</p>
          <p>Click the link below to confirm your availability:</p>
          <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
            Confirm Availability
          </a>
        </div>
      `,
    };
    
    // Return promise for each email
    return transporter.sendMail(mailOptions);
  });
  
  // Send all emails in parallel
  await Promise.all(mailPromises);
}