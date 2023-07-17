import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { TelegramModule } from './telegram/telegram.module';
import { TelegramService } from './telegram/telegram.service';

@Module({
  imports: [TelegramModule],
  controllers: [AppController],
})
export class AppModule implements OnModuleDestroy, OnModuleInit {
  constructor(private readonly tgService: TelegramService) { }

  async onModuleInit() {
    await this.tgService.init();
    if (this.tgService.isConnected()) this.tgService.processMessages();
  }

  onModuleDestroy() {
    this.tgService.stop();
  }
}
