import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService {
  private readonly client: S3Client;

  constructor(private readonly config: ConfigService) {
    const s3_region = this.config.get<string>('S3_REGION');

    this.client = new S3Client({
      region: s3_region,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFileToS3(file: Express.Multer.File): Promise<string> {
    const uniqueFileName = `${uuid()}${extname(file.originalname)}`;
    const bucketName = this.config.get<string>('S3_BUCKET_NAME');

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.client.send(command);
      const fileUrl = `https://${bucketName}.s3.${this.config.get('S3_REGION')}.amazonaws.com/${uniqueFileName}`;
      return fileUrl;
    } catch {
      throw new Error('Failed to upload file');
    }
  }

  async uploadFile(file: Express.Multer.File, folderType: string) {
    const uploadPath = join(
      __dirname,
      '..',
      '..',
      '..',
      `uploads/${folderType}`,
    );

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueFileName = `${uuid()}${extname(file.originalname)}`;
    const filePath = join(uploadPath, uniqueFileName);

    const writeStream = createWriteStream(filePath);
    writeStream.write(file.buffer);
    writeStream.end();

    return new Promise<string>((resolve, reject) => {
      writeStream.on('finish', () => resolve(filePath));
      writeStream.on('error', reject);
    });
  }
}
