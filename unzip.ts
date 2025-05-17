import { readdir, unlink } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createUnzip } from 'node:zlib';
import { DOWNLOAD_PATH } from './shared.js';
import path from 'node:path';

async function unzipAndDeleteFiles() {
  const files = await readdir(DOWNLOAD_PATH);
  
  for (const file of files) {
    if (file.endsWith('.zip')) {
        console.log(`Unzipping ${file}`);
      const zipPath = path.join(DOWNLOAD_PATH, file);
      const unzipPath = path.join(DOWNLOAD_PATH, file.replace('.zip', ''));
      
      try {
        await pipeline(
          createReadStream(zipPath),
          createUnzip(),
          createWriteStream(unzipPath)
        );
        
        await unlink(zipPath);
        console.log(`Unzipped and deleted ${file}`);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }
}

await unzipAndDeleteFiles();
