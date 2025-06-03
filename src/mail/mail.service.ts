/*import { Injectable } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { User } from '../users/entities/user.entity';
import { createEvent } from 'ics'

@Injectable()
export class MailService {
  private readonly client = new SESClient({ region: process.env.AWS_REGION });

  async sendRegistrationConfirmation(user: User, event: {name: string; date: string }) {
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
}*/

import { Injectable } from '@nestjs/common';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { User } from '../users/entities/user.entity';
import { createEvent } from 'ics';
import { SESService }  from '../aws/ses.service'

@Injectable()
export class MailService {
  private readonly client = new SESClient({ region: process.env.AWS_REGION });
  constructor(private readonly sesService: SESService) {}

  async sendEmailVerification(user: { name: string; email: string; id: string }) {
    const subject = 'Verifique seu e-mail';
    const body = `
      <p>Olá ${user.name},</p>
      <p>Obrigado por se registrar! Por favor, verifique seu e-mail clicando no link abaixo:</p>
      <a href="https://sua-aplicacao.com/verify-email?user=${user.id}">Verificar e-mail</a>
    `;

    await this.sesService.sendEmail({
      to: user.email,
      subject,
      html: body,
    });

    /*await this.sesService.sendEmail(
      user.email,
      subject,
      body,
    );*/

  }

  async sendRegistrationConfirmation(user: User, event: { name: string; date: string }) {
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.SES_EMAIL_FROM
    ) return;

    // 📅 Cria o evento iCalendar (.ics)
    const startDate = new Date(event.date);
    const start: [number, number, number, number, number] = [
      startDate.getUTCFullYear(),
      startDate.getUTCMonth() + 1,
      startDate.getUTCDate(),
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
    ];

    const { error, value: icsContent } = createEvent({
      start,
      duration: { hours: 1 },
      title: event.name,
      description: `Você está inscrito no evento "${event.name}"`,
      status: 'CONFIRMED',
      organizer: {
        name: 'Event Platform',
        email: process.env.SES_EMAIL_FROM!,
      },
      attendees: [{ name: user.name, email: user.email }],
    });

    if (error) throw error;

    const emailBody = `Olá ${user.name},

Você se inscreveu com sucesso no evento "${event.name}".

A data do evento é: ${startDate.toUTCString()}

Obrigado por participar!
`;

    const rawEmail = [
      `From: ${process.env.SES_EMAIL_FROM}`,
      `To: ${user.email}`,
      `Subject: Confirmação de inscrição + Evento no calendário`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/mixed; boundary="NextPart"',
      '',
      '--NextPart',
      'Content-Type: text/plain; charset="utf-8"',
      '',
      emailBody,
      '',
      '--NextPart',
      'Content-Type: text/calendar; method=REQUEST; name="event.ics"',
      'Content-Disposition: attachment; filename="event.ics"',
      '',
      icsContent,
      '',
      '--NextPart--',
    ].join('\n');

    await this.client.send(
      new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawEmail),
        },
      }),
    );
  }
}
