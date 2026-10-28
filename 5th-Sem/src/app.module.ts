import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { BotModule } from './bot/bot.module';

const isBotMode = process.env.BOT_MODE === 'true';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ConversationModule,
    MessageModule,
    // BotModule only loaded when BOT_MODE=true
    ...(isBotMode ? [BotModule] : []),
  ],
})
export class AppModule {}
