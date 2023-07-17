import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, writeFileSync } from 'fs';

import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

import input from 'input'; // npm i input
import { AppConfig, ITgChannel } from './telegram.interfaces';

@Injectable()
export class TelegramService {
  private _logger = new Logger('TelegramService');
  private _client: TelegramClient;
  private _isSessionActive = false;
  private _channels: ITgChannel[] = [];
  private _channelsToCopy = ['-1001519159775' /*, '-1001639389789'*/];
  private _configKey = '.config';
  public config: AppConfig = {
    stringSession: '',
    apiId: -1,
    apiHash: '',
  };

  async init() {
    this._logger.log('Initializing Telegram Client');
    this.loadConfig();

    if (this.config.apiId === undefined || this.config.apiId < 0) {
      this._logger.warn('No user apiId found, enter it now:');
      this.config.apiId = await input.text('apiId: ');
    }

    if (this.config.apiHash === undefined || this.config.apiHash === '') {
      this._logger.warn('No user apiHash found, enter it now:');
      this.config.apiHash = await input.text('apiHash: ');
    }

    const stringSession = new StringSession(this.config.stringSession);

    this._client = new TelegramClient(
      stringSession,
      this.config.apiId,
      this.config.apiHash,
      { connectionRetries: 3 },
    );

    await this._client.session.load();
    this._isSessionActive = await this._client.checkAuthorization();

    if (!this._isSessionActive) {
      await this.connect();
    } else {
      this._logger.log('Restored previous session');
    }

    const user = await this.getMe();
    this._logger.log(`Usuario: ${user['username'] || '!! No user'}`);
  }

  isConnected(): boolean {
    return this._isSessionActive;
  }

  async connect() {
    await this._client.start({
      phoneNumber: async () => await input.text('¿Número de teléfono?'),
      password: async () => await input.text('¿Contraseña?'),
      phoneCode: async () => await input.text('¿Código de verificación?'),
      onError: (err) => this._logger.error(`Critial Error:\n${err}`),
    });
    this.config.stringSession =
      (await this._client.session.save()) as unknown as string;
    this._logger.log('You should now be connected.');
    this.saveConfig();
  }

  async getMe() {
    return await this._client.getMe();
  }

  async getChats() {
    this._logger.log('Getting Channels');
    const res = await this._client.getDialogs();
    //this._logger.log("-->", res);
    res.forEach((dialog) => {
      //if (dialog.isChannel) {
      //console.log('\n', dialog);
      this._channels.push({
        name: dialog.title,
        id: dialog.id.toString(),
        follow: this._channelsToCopy.includes(dialog.id.toString()),
        destId: this.getTwin(dialog.id.toString()),
      });
      //}
    });
    return this._channels;
  }

  getTwin(number: string): string {
    if (number === '-1001639389789') return '-823899362'; // adofor social
    if (number === '-1001519159775') return '-831559400'; // adofor
    return null;
  }

  async stop() {
    await this._client.disconnect();
    this._logger.log('Telegram Client Stopped');
  }

  loadConfig(): void {
    this.config = JSON.parse(readFileSync(this._configKey, 'utf8') || '{}');
    this._logger.log('Loaded config');
  }

  saveConfig(): void {
    writeFileSync(this._configKey, JSON.stringify(this.config));
    this._logger.log('Saved config');
  }

  async processMessages() {
    //if (this._channels.length === 0) {
    this._client.addEventHandler(async (update: Api.TypeUpdate) => {
      if (update instanceof Api.UpdateNewChannelMessage) {
        // eslint-disable-next-line prettier/prettier
        const grpNumber = `-100${update.message.peerId['channelId'].value.toString()}`;
        const grupo = this._channels.find((c) => c.id === grpNumber);
        if (grupo.follow && grupo.destId) {
          this._logger.log(grupo.name, '-->', grpNumber);
          this._client.forwardMessages(grupo.destId, {
            fromPeer: update.message.peerId,
            messages: update.message.id,
          });
        }
      }
    });
  }
}
