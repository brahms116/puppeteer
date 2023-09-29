---
sidebar_label: FileChooser
---

# FileChooser class

[FileChooser](./puppeteer.filechooser.md) represents a file picker that appears for file input elements.

#### Signature:

```typescript
export declare class FileChooser
```

## Example

```ts
const [fileChooser] = await Promise.all([
  page.waitForFileChooser(),
  page.click('#upload-file-button'), // some button that triggers file selection
]);
await fileChooser.accept(['/tmp/myfile.pdf']);
```

## Properties

| Property | Modifiers             | Type    | Description                                                                                                               |
| -------- | --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| multiple | <code>readonly</code> | boolean | Whether [multiple](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-multiple) files are allowed. |

## Methods

| Method                                                | Modifiers | Description                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [accept(paths)](./puppeteer.filechooser.accept.md)    |           | <p>Chooses the given file paths.</p><p>This will not validate whether the file paths exists. Also, if a path is relative, then it is resolved against the [current working directory](https://nodejs.org/api/process.html#process_process_cwd).</p><p>For locals script connecting to remote chrome environments, paths must be absolute.</p> |
| [cancel()](./puppeteer.filechooser.cancel.md)         |           | Closes the file chooser without selecting any files.                                                                                                                                                                                                                                                                                          |
| [isMultiple()](./puppeteer.filechooser.ismultiple.md) |           |                                                                                                                                                                                                                                                                                                                                               |
