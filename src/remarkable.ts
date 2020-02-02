import got, { Got, ExtendOptions } from 'got';
import os from 'os';
import queryString from 'query-string';
import uuidv5 from 'uuid/v5'; // Namespace UUID
import uuidv4 from 'uuid/v4'; // Random UUID
import { toUint8Array } from 'hex-lite';
import getMac from 'getmac';
import JSZip from 'jszip';

import { version as pkgVersion } from '../package.json';
import {
  ItemResponse, ReturnType, ItemType, UploadRequestReturnType,
} from './types';


const gotConfiguration: ExtendOptions = {
  responseType: 'json',
  headers: {
    'User-Agent': `remarkable-typescript/${pkgVersion}`,
  },
};

const defaultPDFContent = {
  extraMetadata: {},
  fileType: 'pdf',
  lastOpenedPage: 0,
  lineHeight: -1,
  margins: 180,
  pageCount: 0,
  textScale: 1,
  transform: {},
};

const defaultPDFmetadata = {
  deleted: false,
  lastModified: new Date().toISOString(),
  ModifiedClient: new Date().toISOString(),
  metadatamodified: false,
  modified: false,
  parent: '',
  pinned: false,
  synced: true,
  type: ItemType.DocumentType,
  version: 1,
  VissibleName: 'New Document',
};

type Props = {
  token?: string;
};

export default class Remarkable {
  private token?: string;
  private client: Got = got.extend(gotConfiguration);
  private storageUrl?: string;
  private notificationUrl?: string;
  private zip: JSZip;

  constructor({ token }: Props = {}) {
    if (token) this.setToken(token);
    this.zip = new JSZip();
  }

  private setToken(token: string) {
    this.client = got.extend(
      {
        ...gotConfiguration,
        headers: {
          ...gotConfiguration.headers,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    this.token = token;
    return token;
  }

  public async refreshToken() {
    if (!this.token) throw new Error('You must register your reMarkable first');
    const { body }: { body: string } = await got.post('https://my.remarkable.com/token/json/2/user/new', {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'User-Agent': `remarkable-typescript/${pkgVersion}`,
      },
    });
    this.setToken(body);
    return body;
  }

  public async getStorageUrl({ environment = 'production', group = 'auth0|5a68dc51cb30df3877a1d7c4', apiVer = 2 } = {}) {
    if (this.storageUrl) return this.storageUrl;
    const { body } = await this.client.get(`https://service-manager-production-dot-remarkable-production.appspot.com/service/json/1/document-storage?environment=${environment}&group=${group}&apiVer=${apiVer}`);
    this.storageUrl = `https://${body.Host}`;
    return this.storageUrl;
  }

  public async getNotificationsUrl({ environment = 'production', group = 'auth0|5a68dc51cb30df3877a1d7c4', apiVer = 1 } = {}) {
    if (this.notificationUrl) return this.notificationUrl;
    const { body } = await this.client.get(`https://service-manager-production-dot-remarkable-production.appspot.com/service/json/1/notifications?environment=${environment}&group=${group}&apiVer=${apiVer}`);
    this.notificationUrl = `wss://${body.Host}`;
    return this.notificationUrl;
  }

  public async register({ code, deviceDesc = 'desktop-windows', deviceId }: {code: string, deviceDesc?: string, deviceId?: string}) {
    if (!code) {
      throw new Error('Must provide a code from https://my.remarkable.com/connect/desktop');
    }

    // Generate a deviceId that remains constant for this user on this machine
    const generateDeviceId = () => {
      const fingerprint = os.platform() + os.arch() + os.hostname() + os.cpus()[0].model;
      const namespace = new Array(10)
        .fill(0)
        .concat(
          ...toUint8Array(getMac().replace(/:/g, '')),
        );
      return uuidv5(fingerprint, namespace);
    };
    // Make request
    return got.post('https://my.remarkable.com/token/json/2/device/new', {
      json: { code, deviceDesc, deviceId: deviceId || generateDeviceId() },
    })
      .then(({ body }) => {
        this.setToken(body);
        return this.refreshToken();
      });
  }

  private async listItems({ doc, withBlob = true }: { doc?: string, withBlob?: boolean } = {}) {
    const query = {
      doc,
      withBlob,
    };
    const stringifiedQuery = queryString.stringify(query);
    const url = `${await this.getStorageUrl()}/document-storage/json/2/docs?${stringifiedQuery}`;

    const { body }: { body: ItemResponse[] } = await this.client.get(url);
    return body;
  }

  public async getItemWithId(id: string) {
    return (await this.listItems({ doc: id }))[0];
  }

  public async getAllItems() {
    return this.listItems();
  }

  public async deleteItem(id: string, version: number) {
    const url = `${await this.getStorageUrl()}/document-storage/json/2/delete`;
    const { body }: {body: ReturnType[]} = await this.client.put(url, {
      json: [{
        ID: id,
        Version: version,
      }],
    });
    return body[0].Success;
  }

  public async downloadZip(id: string): Promise<Buffer> {
    const { BlobURLGet } = await this.getItemWithId(id);
    if (!BlobURLGet) {
      throw new Error('Couldn\'t find BlobURLGet in response');
    }

    const readStream = got.stream(BlobURLGet);

    return new Promise((resolve) => {
      const chunks: any[] = [];

      readStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      // Send the buffer or you can put it into a var
      readStream.on('end', async () => {
        const zipBuffer = Buffer.concat(chunks);
        resolve(zipBuffer);
      });
    });
  }

  public async uploadZip(name: string, ID: string, zipFile: Buffer) {
    const url = `${await this.getStorageUrl()}/document-storage/json/2/upload/request`;

    // First, let's create an upload request
    const { body }: { body: UploadRequestReturnType[] } = await this.client.put(url, {
      json: [{
        ID,
        Type: ItemType.DocumentType,
        Version: 1,
      }],
    });
    if (!body[0].Success || !body[0].BlobURLPut) {
      throw new Error('Error during the creation of the upload request');
    }

    // And we upload it
    const { statusCode } = await got.put(body[0].BlobURLPut, {
      body: zipFile,
      headers: {
        ...gotConfiguration.headers,
        'Content-Type': '',
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (statusCode !== 200) {
      throw new Error('Error during the upload of the document');
    }

    // Then we update the metadata
    const { body: bodyUpdateStatus }: { body: ReturnType[] } = await this.client.put(`${await this.getStorageUrl()}/document-storage/json/2/upload/update-status`, {
      json: [{
        ...defaultPDFmetadata,
        ID,
        VissibleName: name,
        lastModified: new Date().toISOString(),
        ModifiedClient: new Date().toISOString(),
      }],
    });

    if (!bodyUpdateStatus[0].Success) {
      throw new Error('Error during the update status of the metadata');
    }

    return bodyUpdateStatus[0].ID;
  }

  public async uploadPDF(name: string, file: Buffer) {
    const ID = uuidv4();

    // We create the zip file to get uploaded
    this.zip.file(`${ID}.content`, JSON.stringify(defaultPDFContent));
    this.zip.file(`${ID}.pagedata`, []);
    this.zip.file(`${ID}.pdf`, file);
    const zipContent = await this.zip.generateAsync({ type: 'nodebuffer' });

    await this.uploadZip(name, ID, zipContent);

    this.zip = new JSZip();
    return ID;
  }
}
