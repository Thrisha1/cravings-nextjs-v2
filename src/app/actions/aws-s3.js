"use server";
import { S3Client , PutObjectCommand , DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY,
  },
});


export async function uploadFileToS3(file) {
  
  try {
    if (!file) {
      throw new Error("File not provided");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: file.name,
      Body: buffer,
      ContentType: file.type,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${file.name}`;

  } catch (e) {
    console.error(e);
    return null;
  }
} 


export async function deleteFileFromS3(fileUrl) {
  try {
    const key = fileUrl.split('/').pop();
    const deleteParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return true;

  } catch (e) {
    console.error(e);
    return false;
  }
}