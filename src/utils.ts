import os from 'os';
import { v5 as uuidv5 } from 'uuid'; // Namespace UUID
import { toUint8Array } from 'hex-lite';
import getMac from 'getmac';

// Generate a deviceId that remains constant for this user on this machine
const generateDeviceId = (): string => {
  const fingerprint = os.platform() + os.arch() + os.hostname() + os.cpus()[0].model;
  const namespace = new Array(10).fill(0).concat(...toUint8Array(getMac().replace(/:/g, '')));
  return uuidv5(fingerprint, namespace);
};

export { generateDeviceId };
