import { S3 } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

const s3 = new S3();

export async function uploadFileToS3(file: Express.Multer.File, folder: string): Promise<string> {
  const fileExt = path.extname(file.originalname);
  const fileName = `${folder}${uuid()}${fileExt}`;

  await s3.putObject({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  });

  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}
