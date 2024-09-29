import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FileService } from '../services/file.service';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('/:type/:filename')
  checkInFile(
    @Param('type') type: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const { path, mimeType } = this.fileService.getFile('check_in', filename);
    const fileStream = createReadStream(path);

    res.set({ 'Content-Type': mimeType });
    fileStream.pipe(res);
  }
}
