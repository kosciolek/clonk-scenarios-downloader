import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const DOWNLOAD_PATH = path.resolve(import.meta.dirname, 'clonk-downloads');

if (!existsSync(DOWNLOAD_PATH)) {
    await mkdir(DOWNLOAD_PATH);
}
