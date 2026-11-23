import { Body, Controller, Get, Header, Param, Post, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { FileIdParamDto, FileResponseDto, UploadFileDto } from './dto/file.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { MAX_UPLOAD_MB } from '../common/base64.util';

@ApiTags('files')
@ApiSecurity('basic-auth')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload an image or file (base64)',
    description:
      `Max ${MAX_UPLOAD_MB} MB. PNG, JPEG, GIF, WebP and HEIC images become IMAGE messages, anything else FILE. ` +
      'Send it in a chat by passing the returned `id` as `file_id` to `POST /message`.',
  })
  @ApiResponse({ status: 201, type: FileResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid base64, empty file, or not a real image' })
  @ApiResponse({ status: 413, description: `File larger than ${MAX_UPLOAD_MB} MB` })
  upload(@Body() body: UploadFileDto, @CurrentUser() user: any) {
    return this.fileService.upload(body, user.id);
  }

  @Get(':id/download')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({
    summary: 'Download a file (raw bytes)',
    description: 'Allowed for the uploader and for members of conversations where the file was sent.',
  })
  @ApiProduces('application/octet-stream', 'image/*')
  @ApiResponse({ status: 200, description: 'The file contents' })
  @ApiResponse({ status: 403, description: 'No access to this file' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async download(@Param() { id }: FileIdParamDto, @CurrentUser() user: any) {
    const file = await this.fileService.findAccessible(id, user.id);
    const disposition = file.kind === 'IMAGE' ? 'inline' : 'attachment'; // show images, download the rest

    return new StreamableFile(Buffer.from(file.data), {
      type: file.mimeType,
      disposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    });
  }
}
