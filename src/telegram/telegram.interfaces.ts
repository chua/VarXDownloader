export interface ITgChannel {
  name: string;
  id: string;
  follow: boolean;
  destId?: string;
}

export interface AppConfig {
  stringSession: string | undefined;
  apiId: number | undefined;
  apiHash: string | undefined;
}
