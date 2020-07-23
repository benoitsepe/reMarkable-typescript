import { ItemResponse, ItemType } from './types';
import { v4 as uuidv4 } from 'uuid'; // Namespace UUID

export const generateItemResponse = (partial?: Partial<ItemResponse>): ItemResponse => ({
  ...partial,
  ID: uuidv4(),
  Version: 1,
  Message: 'message',
  Success: true,
  BlobURLGet: 'https://google.com',
  BlobURLGetExpires: '1595257974',
  ModifiedClient: 'client',
  Type: ItemType.DocumentType,
  VissibleName: 'name',
  CurrentPage: 1,
  Bookmarked: false,
  Parent: '',
});
