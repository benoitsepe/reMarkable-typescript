import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { describe, it } from 'mocha';
import sinon from 'sinon';
import sinonStubPromise from 'sinon-stub-promise';

import got from 'got';

import Remarkable from './remarkable';

import { generateItemResponse } from './fixtures';

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
    localSandbox.stub((client as any).gotClient, 'get').resolves(Promise.resolve(itemsToBeFetched));

    const results = await client.getAllItems();
    expect(results).to.be.equal(itemsToBeFetched);
  });
});
