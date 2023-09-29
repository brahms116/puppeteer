---
sidebar_label: FileChooser.accept
---

# FileChooser.accept() method

Chooses the given file paths.

This will not validate whether the file paths exists. Also, if a path is relative, then it is resolved against the [current working directory](https://nodejs.org/api/process.html#process_process_cwd).

For locals script connecting to remote chrome environments, paths must be absolute.

#### Signature:

```typescript
class FileChooser {
  accept(paths: string[]): Promise<void>;
}
```

## Parameters

| Parameter | Type       | Description |
| --------- | ---------- | ----------- |
| paths     | string\[\] |             |

**Returns:**

Promise&lt;void&gt;
