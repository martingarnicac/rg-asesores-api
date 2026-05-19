import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import * as Handlebars from 'handlebars';

export interface MailTemplateData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailTemplatesService {
  private readonly logger = new Logger(MailTemplatesService.name);
  private readonly templatesDir: string;
  private readonly partialsDir: string;
  private readonly emailsDir: string;
  private readonly layoutsDir: string;

  constructor() {
    const prodDir = join(__dirname, 'templates');
    const devDir = join(process.cwd(), 'src', 'common', 'mail', 'templates');
    this.templatesDir = existsSync(prodDir) ? prodDir : devDir;

    this.partialsDir = join(this.templatesDir, 'partials');
    this.emailsDir = join(this.templatesDir, 'emails');
    this.layoutsDir = join(this.templatesDir, 'layouts');

    this.registerPartials();
    this.logger.log(`Handlebars templates loaded from: ${this.templatesDir}`);
  }

  private registerPartials(): void {
    if (!existsSync(this.partialsDir)) return;

    const files = readdirSync(this.partialsDir).filter((f) => f.endsWith('.hbs'));
    for (const file of files) {
      const name = file.replace('.hbs', '');
      const content = readFileSync(join(this.partialsDir, file), 'utf-8');
      Handlebars.registerPartial(name, content);
    }
  }

  private compileTemplate(templatePath: string, context: Record<string, any>): string {
    const source = readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);
    return template(context);
  }

  private renderEmail(emailFile: string, context: Record<string, any>): string {
    const body = this.compileTemplate(join(this.emailsDir, emailFile), context);
    const layoutSource = readFileSync(join(this.layoutsDir, 'main.hbs'), 'utf-8');
    const layout = Handlebars.compile(layoutSource);

    return layout({
      ...context,
      body,
    });
  }

  welcomeEmail(name: string, loginUrl: string): MailTemplateData {
    return {
      to: '',
      subject: 'Bienvenido a RG Contratos',
      html: this.renderEmail('welcome.hbs', {
        title: 'Bienvenido a RG Contratos',
        headerColor: '#1a73e8',
        name,
        loginUrl,
      }),
    };
  }

  emailVerification(name: string, verifyUrl: string): MailTemplateData {
    return {
      to: '',
      subject: 'Verifica tu correo electrónico - RG Contratos',
      html: this.renderEmail('email-verification.hbs', {
        title: 'Verifica tu correo electrónico',
        headerColor: '#1a73e8',
        name,
        verifyUrl,
      }),
    };
  }

  passwordReset(name: string, resetUrl: string): MailTemplateData {
    return {
      to: '',
      subject: 'Recuperación de contraseña - RG Contratos',
      html: this.renderEmail('password-reset.hbs', {
        title: 'Recuperación de contraseña',
        headerColor: '#ea4335',
        name,
        resetUrl,
      }),
    };
  }

  emailChangeRequest(name: string, confirmUrl: string): MailTemplateData {
    return {
      to: '',
      subject: 'Cambio de correo electrónico - RG Contratos',
      html: this.renderEmail('email-change.hbs', {
        title: 'Cambio de correo electrónico',
        headerColor: '#fbbc05',
        name,
        confirmUrl,
      }),
    };
  }

  passwordChangeConfirmation(name: string): MailTemplateData {
    return {
      to: '',
      subject: 'Contraseña actualizada - RG Contratos',
      html: this.renderEmail('password-change-confirmation.hbs', {
        title: 'Contraseña actualizada',
        headerColor: '#34a853',
        name,
      }),
    };
  }

  emailChangeConfirmation(name: string, newEmail: string): MailTemplateData {
    return {
      to: '',
      subject: 'Correo actualizado - RG Contratos',
      html: this.renderEmail('email-change-confirmation.hbs', {
        title: 'Correo electrónico actualizado',
        headerColor: '#34a853',
        name,
        newEmail,
      }),
    };
  }
}
