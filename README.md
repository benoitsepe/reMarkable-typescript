# reMarkable-typescript

This project was inspired by the work of https://github.com/kevlened/remarkable-node, adding typing and new features like the upload of a document.

Unofficial reMarkable api wrapper for node.js based on [these unofficial docs](https://github.com/splitbrain/ReMarkableAPI/wiki).
This module is typed for TypeScript, but you can still use JavaScript with it.

## Installation
```bash
`yarn add remarkable-typescript`
# OR
`npm install remarkable-typescript`
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
    * Params: { token?: string }
    * Returns: client: Remarkable
    */
    const client = new Remarkable();

    /*
    * Register your reMarkable. You must do this first to pair your device if you didn't specified a token. This may take a few seconds to complete.
    * Params: { code: string }
    * Returns: token: string
    */
    const token = await client.register({ code: 'created code' });

    // (optional) skip registration in the future with `new Remarkable({token})`
    console.log(token);

    /*
    * Refresh the token. For now, the token does not expire but this may change in the future
    * Params: none
    * Returns: token: string
    */
    const newToken = await client.refreshToken();

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
})();
```

## License
MIT



