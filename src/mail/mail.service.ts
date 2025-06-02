import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly client = new SESClient({ region: process.env.AWS_REGION });

  async sendEmailVerification(user: User, event: {name: string; date: string }) {
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.SES_EMAIL_FROM
    ) return;

    const formattedDate = new Date(event.date).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const body = `Hello ${user.name},

  You have successfully registered for the event: "${event.name}".

  Event Date: ${formattedDate}

  Thank you for your participation!`;

  const token = Buffer.from(user.email).toString('base64');
  //const verificationUrl = `https://your-api.com/auth/verify?token=${token}`;
  const verificationUrl = `${process.env.API_BASE_URL}/auth/verify?token=${token}`;


    await this.client.send(
      new SendEmailCommand({
        Source: process.env.SES_EMAIL_FROM,
        Destination: { ToAddresses: [user.email] },
        Message: {
          Subject: { Data: `Registration confirmed: ${event.name}` },
          Body: {
            Text: { Data: `Click to verify: ${verificationUrl}` },
          },
        },
      }),
    );
  }
}
