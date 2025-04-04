import nodemailer from 'nodemailer';

// VET Notification Interfaces and Functions
interface VETNotificationData {
  date: string;
  packages: number;
  scheduleId: number;
  isReopened?: boolean;
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

  const formattedDate = new Date(data.date).toLocaleDateString();
  let subject = '';
  let htmlContent = '';

  if (data.isReopened) {
    subject = `URGENT: VET Reopened for ${formattedDate}`;
    htmlContent = `
      <div>
        <h2>VET Opportunity Reopened</h2>
        <p>A VET that was previously closed has been reopened for ${formattedDate}.</p>
        <p>Number of packages to be handled: ${data.packages}</p>
        <p>Click the link below to confirm your availability:</p>
        <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px;">
          Confirm Availability
        </a>
      </div>
    `;
  } else {
    subject = `VET Available for ${formattedDate}`;
    htmlContent = `
      <div>
        <h2>VET Opportunity Available</h2>
        <p>A VET opportunity is available for ${formattedDate}.</p>
        <p>Number of packages to be handled: ${data.packages}</p>
        <p>Click the link below to confirm your availability:</p>
        <a href="${confirmationLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
          Confirm Availability
        </a>
      </div>
    `;
  }

  // Create array of email objects
  const mailPromises = emails.map(email => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent,
    };
    
    // Return promise for each email
    return transporter.sendMail(mailOptions);
  });
  
  // Send all emails in parallel
  await Promise.all(mailPromises);
}

// VTO Notification Interfaces and Functions
interface VTONotificationData {
  date: string;
  scheduleId: number;
  isReopened?: boolean;
  isClosed?: boolean;
}

export async function sendVtoNotification(
  emails: string[], 
  data: VTONotificationData
) {
  const vtoLink = `${process.env.NEXT_PUBLIC_APP_URL}/vto-confirm/${data.scheduleId}`;

  console.log('Sending VTO notification to:', emails);
  console.log('VTO link:', vtoLink);

  // Create a transporter using SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use custom SMTP settings
    auth: {
      user: process.env.EMAIL_USER, // your email
      pass: process.env.EMAIL_PASSWORD, // app password for your email
    },
  });

  let subject = '';
  let htmlContent = '';
  const formattedDate = new Date(data.date).toLocaleDateString();

  if (data.isClosed) {
    subject = `VTO Opportunity Closed for ${formattedDate}`;
    htmlContent = `
      <div>
        <h2>VTO Opportunity Closed</h2>
        <p>The Voluntary Time Off (VTO) opportunity for ${formattedDate} has been closed.</p>
        <p>If you were interested in taking time off, this opportunity is no longer available.</p>
        <p>Please plan to report for your scheduled shift as normal.</p>
        <a href="${vtoLink}" style="display: inline-block; padding: 10px 20px; background-color: #d97706; color: white; text-decoration: none; border-radius: 5px;">
          View Schedule
        </a>
      </div>
    `;
  } else if (data.isReopened) {
    subject = `VTO Opportunity Reopened for ${formattedDate}`;
    htmlContent = `
      <div>
        <h2>VTO Opportunity Reopened</h2>
        <p>A Voluntary Time Off (VTO) opportunity that was previously closed has been reopened for ${formattedDate}.</p>
        <p>If you're interested in taking this day off, please contact your supervisor as soon as possible.</p>
        <a href="${vtoLink}" style="display: inline-block; padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px;">
          View Schedule Details
        </a>
      </div>
    `;
  } else {
    subject = `VTO Opportunity Available for ${formattedDate}`;
    htmlContent = `
      <div>
        <h2>VTO Opportunity Available</h2>
        <p>A Voluntary Time Off (VTO) opportunity is now available for ${formattedDate}.</p>
        <p>If you're interested in taking this day off without using PTO, please contact your supervisor.</p>
        <a href="${vtoLink}" style="display: inline-block; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px;">
          View Schedule Details
        </a>
      </div>
    `;
  }

  // Create array of email objects
  const mailPromises = emails.map(email => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent,
    };
    
    // Return promise for each email
    return transporter.sendMail(mailOptions);
  });
  
  // Send all emails in parallel
  await Promise.all(mailPromises);
}