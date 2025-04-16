"use server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY,
  },
  requestTimeout: 120000,
  maxAttempts: 3,
});

export async function uploadFileToS3(file, filename) {
  try {
    if (!file) throw new Error("File not provided");

    if (file.includes("cravingsbucket")) {
      return file;
    }

    let buffer;
    let contentType;
    let fileName = filename || `menu-images/${Date.now()}.jpg`;

    if (typeof file === "string" && file.startsWith("data:")) {
      const base64Data = file.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
      contentType = file.match(/^data:(.*?);base64/)?.[1] || "image/jpeg";
    } else if (file instanceof Buffer) {
      buffer = file;
      contentType = "application/octet-stream";
    } else if (file instanceof Blob) {
      buffer = Buffer.from(await file.arrayBuffer());
      contentType = file.type || "image/jpeg";
    } else {
      throw new Error("Unsupported file format");
    }

    const uploadParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    return `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Error in uploadFileToS3:", error);
    throw error;
  }
}

export async function deleteFileFromS3(fileUrl) {
  try {
    if (!fileUrl) throw new Error("File URL is required");

    const key = decodeURIComponent(
      new URL(fileUrl).pathname.replace(/^\/+/, "")
    );

    const deleteParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));

    return true;
  } catch (error) {
    console.error("Error in deleteFileFromS3:", error);
    throw error;
  }
}
