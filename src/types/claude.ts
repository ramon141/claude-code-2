export interface ApiKeyItem {
  id: number;
  name: string;
  prefix: string;
  createdAt: string;
}

export interface ApiKeyWithSecretItem extends ApiKeyItem {
  key: string;
}
