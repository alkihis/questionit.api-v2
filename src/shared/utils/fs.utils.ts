import fs from 'fs';

export function createDirectoryTree(path: string) {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch {}
}
