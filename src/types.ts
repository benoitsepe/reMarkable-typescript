export type ItemResponse = {
  ID: string,
  Version: number,
  Message: string,
  Success: boolean,
  BlobURLGet?: string,
  BlobURLGetExpires?: string,
  ModifiedClient: string,
  Type: ItemType,
  VissibleName: string,
  CurrentPage: number,
  Bookmarked: boolean,
  Parent: string,
};

export enum ItemType {
  DocumentType='DocumentType',
  CollectionType='CollectionTyp',
}

export type ReturnType = {
  ID: string,
  Version: number,
  Message: string,
  Success: boolean,
};

export type UploadRequestReturnType = {
  ID: string,
  Version: number,
  Message: string,
  Success: boolean,
  BlobURLPut: string,
  BlobURLPutExpires: string,
};
