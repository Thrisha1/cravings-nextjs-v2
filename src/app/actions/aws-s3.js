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

    // Convert base64 to buffer if it's a base64 string
    let buffer;
    let contentType;
    let fileName;

    if (typeof file === 'string' && file.startsWith('data:')) {
      // Handle base64 string
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
      contentType = file.split(';')[0].split(':')[1];
      fileName = `menu-images/${Date.now()}.${contentType.split('/')[1]}`;
    } else {
      // Handle File object
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = file.type;
      fileName = `menu-images/${file.name}`;
    }

    const uploadParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
      ContentEncoding: typeof file === 'string' ? 'base64' : undefined,
    };

    try {
      await s3Client.send(new PutObjectCommand(uploadParams));
    } catch (uploadError) {
      console.error('S3 Upload Error:', uploadError);
      throw uploadError;
    }

    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${fileName}`;

  } catch (error) {
    console.error('Error in uploadFileToS3:', error);
    throw error;
  }
}

export async function deleteFileFromS3(fileUrl) {
  try {
    const key = fileUrl.split('/').pop();
    const deleteParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: key,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(deleteParams));
      return true;
    } catch (deleteError) {
      console.error('S3 Delete Error:', deleteError);
      throw deleteError;
    }

  } catch (error) {
    console.error('Error in deleteFileFromS3:', error);
    throw error;
  }
}