# reMarkable-typescript

This project was inspired by the work of https://github.com/kevlened/remarkable-node, adding typing and new features like the upload of a document.

Unofficial reMarkable api wrapper for node.js based on [these unofficial docs](https://github.com/splitbrain/ReMarkableAPI/wiki).
This module is typed for TypeScript, but you can still use JavaScript with it.

## Installation
```bash
yarn add remarkable-typescript
# OR
npm install remarkable-typescript
```

Then, go to [reMarkable's website](https://my.remarkable.com/connect/remarkable) to genereate a code to pair your reMarkable. This code is only available 5 minutes.

## Example

```ts
import { Remarkable, ItemResponse } from 'remarkable-typescript';
// const { Remarkable, ItemResponse } = require('remarkable-typescript');
const fs = require('fs');

(async () => {
    /*
    * Create the reMarkable client
    * Params: { deviceToken?: string }
    * Returns: client: Remarkable
    */
    const client = new Remarkable();

    /*
    * Register your reMarkable and generate a device token. You must do this first to pair your device if you didn't specify a token. This may take a few seconds to complete. It seems that the deviceToken never expires.
    * Params: { code: string }
    * Returns: deviceToken: string
    */
    const deviceToken = await client.register({ code: 'created code' });

    // (optional) skip registration in the future with `new Remarkable({deviceToken})`
    console.log(deviceToken);

    /*
    * (Re)generate a token from the deviceToken. You MUST call this function after creating the client. This token, used to interact with storage, is different from the deviceToken. This function is automatically called in register(). This token expires.
    * Params: none
    * Returns: token: string
    */
    await client.refreshToken();

    /*
    * List all items, files and folders.
    * Params: none
    * Returns: ItemResponse[]
    */
    const items = await client.getAllItems();

    /*
    * Get an item by id
    * Params: id: string
    * Returns: ItemResponse | null
    */
    const item = await client.getItemWithId('some uuid');

    /*
    * Delete an item by is ID and document version
    * Params: id: string, version: number
    * Returns: success: boolean
    */
    await client.deleteItem('some uuid', 1);

    const myPDF = fs.readFileSync('./my/PDF/location.pdf');
    /*
    * Upload a PDF to your reMarkable
    * Params: name: string, file: Buffer
    * Returns: id: string
    */
    const pdfUploadedId = await client.uploadPDF('My PDF name', myPDF);

    /*
    * Download a ZIP file to your reMarkable (with the annotations)
    * Params: id: string
    * Returns: Buffer
    */
    const zipFile = await client.downloadZip(pdfUploadedId);

    /*
    * Upload a ZIP file to your reMarkable (must be a supported reMarkable format). You can generate the ID using uuidv4.
    * Params: name: string, id: string, zipFile: Buffer
    * Returns: id: string
    */
    const zipFileId = await client.uploadZip('My document name', ID: 'f831481c-7d2d-4776-922d-36e708d9d680', zipFile);
})();
```

## License
MIT



