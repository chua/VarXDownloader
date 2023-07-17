import { Controller, Get } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';

@Controller()
export class AppController {
  constructor(private readonly tgService: TelegramService) { }

  @Get('chats')
  async getChats() {
    const channels = await this.tgService.getChats();
    return {
      data: channels,
      ok: true,
    };
  }

  @Get('proccessMessages')
  async proccessMessages() {
    this.tgService.processMessages();
  }
}
