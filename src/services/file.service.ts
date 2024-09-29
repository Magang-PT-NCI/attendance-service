import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { mime } from 'serve-static';

@Injectable()
export class FileService {
  getFile(
    prefix: string,
    filename: string,
  ): { path: string; mimeType: string } {
    const filePath = `./public/upload/${prefix}/${filename}`;

    if (!existsSync(filePath)) {
      throw new NotFoundException(`file ${filename} tidak ditemukan`);
    }

    const mimeType = mime.lookup(filename) || 'application/octet-stream';

    return { path: filePath, mimeType };
  }
}
