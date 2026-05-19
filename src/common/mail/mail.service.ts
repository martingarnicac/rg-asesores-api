import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { MailTemplatesService } from '@/common/mail/mail-templates.service';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;

  constructor(
    private readonly templates: MailTemplatesService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from = this.config.get<string>('RESEND_FROM', 'no-reply@rgcontratos.com');

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend client configurado');
    } else {
      this.logger.warn('RESEND_API_KEY no configurado. Los correos se loguearán pero no se enviarán.');
    }
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`[MAIL MOCK] To: ${options.to} | Subject: ${options.subject}`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error(`Error enviando correo vía Resend: ${error.message}`);
      } else {
        this.logger.debug(`Correo enviado a ${options.to} vía Resend`);
      }
    } catch (err) {
      this.logger.error(`Excepción enviando correo: ${err.message}`);
    }
  }

  async sendWelcomeEmail(to: string, name: string, loginUrl: string): Promise<void> {
    const tpl = this.templates.welcomeEmail(name, loginUrl);
    await this.sendMail({ ...tpl, to });
  }

  async sendEmailVerification(to: string, name: string, verifyUrl: string): Promise<void> {
    const tpl = this.templates.emailVerification(name, verifyUrl);
    await this.sendMail({ ...tpl, to });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
    const tpl = this.templates.passwordReset(name, resetUrl);
    await this.sendMail({ ...tpl, to });
  }

  async sendEmailChangeRequest(to: string, name: string, confirmUrl: string): Promise<void> {
    const tpl = this.templates.emailChangeRequest(name, confirmUrl);
    await this.sendMail({ ...tpl, to });
  }

  async sendPasswordChangeConfirmation(to: string, name: string): Promise<void> {
    const tpl = this.templates.passwordChangeConfirmation(name);
    await this.sendMail({ ...tpl, to });
  }

  async sendEmailChangeConfirmation(to: string, name: string, newEmail: string): Promise<void> {
    const tpl = this.templates.emailChangeConfirmation(name, newEmail);
    await this.sendMail({ ...tpl, to });
  }
}
