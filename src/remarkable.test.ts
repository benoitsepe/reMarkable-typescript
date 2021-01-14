import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import got from 'got';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';
import { generateItemResponse } from './fixtures';
import Remarkable from './remarkable';

chai.use(chaiAsPromised);
sinonStubPromise(sinon);

let localSandbox: sinon.SinonSandbox;
beforeEach(function () {
  localSandbox = sinon.createSandbox();
});

afterEach(function () {
  localSandbox.restore();
});

describe('Client initialization', () => {
  it('should not set the deviceToken if not provided', () => {
    const client = new Remarkable();
    expect(client.deviceToken).to.be.undefined;
  });
  it('should set the deviceToken if provided', () => {
    const client = new Remarkable({ deviceToken: 'test' });
    expect(client.deviceToken).to.be.equal('test');
  });
});

describe('Register a device', () => {
  it('should register a device ', async () => {
    localSandbox.stub(got, 'post').resolves(
      Promise.resolve({
        body: 'token',
      }),
    );
    const client = new Remarkable();
    const deviceToken = await client.register({
      code: 'code',
    });
    const accessToken = client.token;
    expect(deviceToken).to.be.equal('token');
    expect(accessToken).to.be.equal('token');
  });
});

describe('Refresh token', () => {
  it('should throw an error if the device token is not set', async () => {
    const client = new Remarkable();
    expect(client.refreshToken()).to.be.rejectedWith(Error);
  });
  it('should set the token after fetching it', async () => {
    localSandbox.stub(got, 'post').resolves(
      Promise.resolve({
        body: 'token',
      }),
    );
    const client = new Remarkable({ deviceToken: 'test' });
    const accessToken = await client.refreshToken();
    expect(accessToken).to.be.equal('token');
    expect(client.token).to.be.equal('token');
  });
});

describe('Get items', () => {
  it('should throw an error if the access token is not set', async () => {
    const client = new Remarkable({ deviceToken: 'device-token' });
    expect(client.getAllItems()).to.be.rejectedWith(Error);
    expect(client.getItemWithId('dsf')).to.be.rejectedWith(Error);
  });
  it('should fetch all items', async () => {
    localSandbox.stub(got, 'post').resolves(
      Promise.resolve({
        body: 'token',
      }),
    );

    const client = new Remarkable({ deviceToken: 'test' });
    await client.refreshToken();

    const itemsToBeFetched = [generateItemResponse(), generateItemResponse()];
    localSandbox.stub((client as any).gotClient, 'get').resolves(Promise.resolve({ body: itemsToBeFetched }));
    localSandbox.stub(client, 'getStorageUrl').resolves(await Promise.resolve('http://localhost'));

    const results = await client.getAllItems();
    expect(results).to.be.equal(itemsToBeFetched);
  });
});

describe('Upload Zip', async function () {
  it('passes the correct parameters to remarkable API', async function () {
    // SETUP
    localSandbox.stub(got, 'post').resolves(
      Promise.resolve({
        body: 'token',
      }),
    );
    const client = new Remarkable({
      deviceToken: 'stubToken',
    });
    await client.refreshToken();
    // configure stubbing for calls to the document apis
    const mockFileId = 'b8710f71-c86e-5037-8ef2-bac047709355';
    const mockFolderId = '71e70cd9-8d72-5c8b-addc-0d18c74364bc';
    const putStub = localSandbox
      .stub((client as any).gotClient, 'put')
      .resolves(Promise.resolve({ body: [{ Success: true, BlobURLPut: 'someURL' }] }))
      .onSecondCall()
      .resolves(Promise.resolve({ body: [{ Success: true, ID: mockFileId }] }));

    localSandbox.stub(client, 'getStorageUrl').resolves(await Promise.resolve('http://localhost'));

    localSandbox.stub(got, 'put').resolves(
      Promise.resolve({
        statusCode: 200,
        body: mockFileId,
      }),
    );

    const testEpub = Buffer.from('oogabooga');
    // ACT
    await client.uploadZip('testID', mockFileId, testEpub, mockFolderId);
    // ASSERT
    const argsToRmAPI = putStub.getCall(1).args[1];
    const unwrappedArgs = argsToRmAPI.json[0];
    expect(unwrappedArgs.parent).to.be.equal(mockFolderId);
    expect(unwrappedArgs.ID).to.be.equal(mockFileId);
    expect(unwrappedArgs.VisibleName).to.be.equal('testID');
    return;
  });
});
