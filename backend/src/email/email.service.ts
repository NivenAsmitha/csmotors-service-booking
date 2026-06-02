import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export type NewBookingEmailDetails = {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  serviceName: string;
  bookingDate: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  bikeNumber?: string | null;
  bikeModel?: string | null;
  notes?: string | null;
  status: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;
  private readonly resend?: Resend;

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('RESEND_API_KEY')?.trim();

    this.from =
      configService.get<string>('MAIL_FROM')?.trim() ||
      'CS Motors <onboarding@resend.dev>';
    this.resend = apiKey ? new Resend(apiKey) : undefined;
  }

  sendEmailVerificationOtp(
    to: string,
    name: string,
    otp: string,
  ): Promise<void> {
    return this.send({
      to,
      subject: 'Verify your email - CS Motors',
      text: `Hello ${name}, your CS Motors email verification code is ${otp}. It expires in 10 minutes.`,
      html: otpEmailTemplate({
        name,
        otp,
        title: 'Verify your email',
        description:
          'Use the verification code below to confirm your email address and activate your CS Motors account.',
        securityNote:
          'If you did not create a CS Motors account, you can safely ignore this email.',
      }),
    });
  }

  sendPasswordResetOtp(to: string, name: string, otp: string): Promise<void> {
    return this.send({
      to,
      subject: 'Reset your password - CS Motors',
      text: `Hello ${name}, your CS Motors password reset code is ${otp}. It expires in 10 minutes.`,
      html: otpEmailTemplate({
        name,
        otp,
        title: 'Reset your password',
        description:
          'Use the password reset code below to choose a new password for your CS Motors account.',
        securityNote:
          'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.',
      }),
    });
  }

  sendNewBookingToItSupport(
    to: string,
    details: NewBookingEmailDetails,
  ): Promise<void> {
    return this.send({
      to,
      subject: 'New service booking - CS Motors',
      text: [
        'A new CS Motors service booking has been created.',
        `Booking ID: ${details.bookingId}`,
        `Client name: ${details.clientName}`,
        `Client email: ${details.clientEmail}`,
        `Client phone: ${details.clientPhone || 'Not provided'}`,
        `Service: ${details.serviceName}`,
        `Date: ${details.bookingDate}`,
        `Slot label: ${details.slotLabel}`,
        `Exact internal time: ${details.startTime} - ${details.endTime}`,
        `Bike number: ${details.bikeNumber || 'Not provided'}`,
        `Bike model: ${details.bikeModel || 'Not provided'}`,
        `Notes: ${details.notes || 'None'}`,
        `Status: ${details.status}`,
      ].join('\n'),
      html: newBookingEmailTemplate(details),
    });
  }

  private async send(email: {
    html: string;
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.log(
        `RESEND_API_KEY is not configured. Email fallback:\n${JSON.stringify(email, null, 2)}`,
      );
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (error) {
      throw new Error(`Resend email failed: ${error.message}`);
    }
  }
}

type OtpEmailTemplateParams = {
  description: string;
  name: string;
  otp: string;
  securityNote: string;
  title: string;
};

function otpEmailTemplate({
  description,
  name,
  otp,
  securityNote,
  title,
}: OtpEmailTemplateParams) {
  return emailLayout({
    title,
    previewText: `${title}. Your code expires in 10 minutes.`,
    content: `
      <p style="${paragraphStyle}">Hello ${escapeHtml(name)},</p>
      <p style="${paragraphStyle}">${escapeHtml(description)}</p>
      <div style="margin: 28px 0; border-radius: 14px; background: #f0fdf4; padding: 24px; text-align: center;">
        <p style="margin: 0 0 10px; color: #166534; font-size: 12px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;">Your verification code</p>
        <p style="margin: 0; color: #14532d; font-family: Arial, sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 8px;">${escapeHtml(otp)}</p>
      </div>
      <p style="${paragraphStyle}"><strong>This code expires in 10 minutes.</strong> For your security, do not share this code with anyone.</p>
      <p style="${mutedParagraphStyle}">${escapeHtml(securityNote)}</p>
    `,
  });
}

function newBookingEmailTemplate(details: NewBookingEmailDetails) {
  return emailLayout({
    title: 'New service booking',
    previewText: `New service booking for ${details.serviceName} on ${details.bookingDate}.`,
    content: `
      <p style="${paragraphStyle}">A new service booking has been created and is ready for workshop coordination.</p>
      <div style="margin: 24px 0; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden;">
        ${detailRow('Booking ID', details.bookingId)}
        ${detailRow('Client name', details.clientName)}
        ${detailRow('Client email', details.clientEmail)}
        ${detailRow('Client phone', details.clientPhone || 'Not provided')}
        ${detailRow('Service', details.serviceName)}
        ${detailRow('Date', details.bookingDate)}
        ${detailRow('Slot label', details.slotLabel)}
        ${detailRow('Exact internal time', `${details.startTime} - ${details.endTime}`, true)}
        ${detailRow('Bike number', details.bikeNumber || 'Not provided')}
        ${detailRow('Bike model', details.bikeModel || 'Not provided')}
        ${detailRow('Notes', details.notes || 'None')}
        ${detailRow('Status', details.status)}
      </div>
      <p style="${mutedParagraphStyle}">This notification is for internal scheduling. Exact time details should be used by staff when coordinating workshop assignments.</p>
    `,
  });
}

function detailRow(label: string, value: string, highlight = false) {
  return `
    <div style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; ${highlight ? 'background: #f0fdf4;' : ''}">
      <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase;">${escapeHtml(label)}</p>
      <p style="margin: 0; color: ${highlight ? '#166534' : '#0f172a'}; font-size: 14px; font-weight: ${highlight ? '700' : '500'}; line-height: 1.6;">${escapeHtml(value)}</p>
    </div>
  `;
}

function emailLayout({
  content,
  previewText,
  title,
}: {
  content: string;
  previewText: string;
  title: string;
}) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin: 0; background: #f1f5f9; padding: 24px 12px; font-family: Arial, sans-serif; color: #0f172a;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${escapeHtml(previewText)}</div>
        <div style="margin: 0 auto; max-width: 640px;">
          <div style="padding: 0 4px 16px;">
            <p style="margin: 0; color: #166534; font-size: 22px; font-weight: 800;">CS Motors</p>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;">Service Booking</p>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff; padding: 28px; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);">
            <h1 style="margin: 0 0 18px; color: #0f172a; font-size: 24px; line-height: 1.25;">${escapeHtml(title)}</h1>
            ${content}
          </div>
          <p style="margin: 18px 0 0; color: #64748b; font-size: 12px; text-align: center;">CS Motors Service Booking System</p>
        </div>
      </body>
    </html>
  `;
}

const paragraphStyle =
  'margin: 0 0 14px; color: #334155; font-size: 15px; line-height: 1.7;';
const mutedParagraphStyle =
  'margin: 18px 0 0; color: #64748b; font-size: 13px; line-height: 1.6;';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
