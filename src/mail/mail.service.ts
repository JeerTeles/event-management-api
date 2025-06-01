import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly client = new SESClient({ region: process.env.AWS_REGION });

  async sendEmailVerification(user: User) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return;

    const token = Buffer.from(user.email).toString('base64');
    const verificationUrl = `https://your-api.com/auth/verify?token=${token}`;

    await this.client.send(
      new SendEmailCommand({
        Source: process.env.SES_EMAIL_FROM,
        Destination: { ToAddresses: [user.email] },
        Message: {
          Subject: { Data: 'Verify your email' },
          Body: {
            Text: { Data: `Click to verify: ${verificationUrl}` },
          },
        },
      }),
    );
  }
}
