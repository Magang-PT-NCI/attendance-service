import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { mime } from 'serve-static';
import { FileResult } from '../interfaces/file.interfaces';

@Injectable()
export class FileService {
  public getFile(prefix: string, filename: string): FileResult {
    const filePath = `./public/upload/${prefix}/${filename}`;

    if (!existsSync(filePath)) {
      throw new NotFoundException(`file ${filename} tidak ditemukan`);
    }

    const mimeType = mime.lookup(filename) || 'application/octet-stream';

    return { path: filePath, mimeType };
  }
}
