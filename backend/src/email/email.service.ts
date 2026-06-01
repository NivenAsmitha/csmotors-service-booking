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
      subject: 'Verify your CS Motors email',
      text: `Hello ${name}, your CS Motors email verification code is ${otp}. It expires in 10 minutes.`,
    });
  }

  sendPasswordResetOtp(to: string, name: string, otp: string): Promise<void> {
    return this.send({
      to,
      subject: 'Reset your CS Motors password',
      text: `Hello ${name}, your CS Motors password reset code is ${otp}. It expires in 10 minutes.`,
    });
  }

  sendNewBookingToItSupport(
    to: string,
    details: NewBookingEmailDetails,
  ): Promise<void> {
    return this.send({
      to,
      subject: 'New Service Booking',
      text: [
        'A new service booking has been created.',
        `Booking ID: ${details.bookingId}`,
        `Client: ${details.clientName}`,
        `Client email: ${details.clientEmail}`,
        `Client phone: ${details.clientPhone || 'Not provided'}`,
        `Service: ${details.serviceName}`,
        `Date: ${details.bookingDate}`,
        `Slot: ${details.slotLabel}`,
        `Time: ${details.startTime} - ${details.endTime}`,
        `Bike number: ${details.bikeNumber || 'Not provided'}`,
        `Bike model: ${details.bikeModel || 'Not provided'}`,
        `Notes: ${details.notes || 'None'}`,
        `Status: ${details.status}`,
      ].join('\n'),
    });
  }

  private async send(email: {
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
    });

    if (error) {
      throw new Error(`Resend email failed: ${error.message}`);
    }
  }
}
