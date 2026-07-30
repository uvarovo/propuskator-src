import { promisify } from 'util';

import S3 from 'aws-sdk/clients/s3.js';

import config from '../config.js';

const s3Client = new S3({ ...config.s3, s3ForcePathStyle: true });

s3Client.uploadAsync = promisify(s3Client.upload);
s3Client.deleteObjectsAsync = promisify(s3Client.deleteObjects);

export default s3Client;
export const BUCKET_NAME = config.s3.bucket;
