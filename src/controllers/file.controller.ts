import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { FileService } from '../services/file.service';
import { ApiFile } from '../decorators/api-file.decorator';
import { ApiTags } from '@nestjs/swagger';
import { FileParams } from '../dto/file.dto';

@Controller('files')
@ApiTags('File')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('/:type/:filename')
  @ApiFile()
  checkInFile(@Param() params: FileParams, @Res() res: Response) {
    const { path, mimeType } = this.fileService.getFile(
      params.type,
      params.filename,
    );
    const fileStream = createReadStream(path);

    res.set({ 'Content-Type': mimeType });
    fileStream.pipe(res);
  }
}
