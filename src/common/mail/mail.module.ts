import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MailService } from '@/common/mail/mail.service';
import { MailTemplatesService } from '@/common/mail/mail-templates.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService, MailTemplatesService],
  exports: [MailService, MailTemplatesService],
})
export class MailModule {}
