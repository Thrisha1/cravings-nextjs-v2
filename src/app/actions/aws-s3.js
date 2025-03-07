"use server";
import {
  S3Client,
  // PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY,
  },
  requestTimeout: 120000, 
  maxAttempts: 3,
});

// export async function uploadFileToS3(file, filename) {
//   try {
//     if (!file) throw new Error("File not provided");

//     let buffer;
//     let contentType;
//     let fileName = filename || `menu-images/${Date.now()}.jpg`;

//     if (typeof file === "string" && file.startsWith("data:")) {
//       // Convert base64 to buffer
//       const base64Data = file.split(",")[1];
//       buffer = Buffer.from(base64Data, "base64");
//       contentType = file.match(/^data:(.*?);base64/)?.[1] || "image/jpeg";
//     } else {
//       // Handle File object
//       const arrayBuffer = await file.arrayBuffer();
//       buffer = Buffer.from(arrayBuffer);
//       contentType = file.type || "image/jpeg";
//     }

//     const uploadParams = {
//       Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
//       Key: fileName,
//       Body: buffer,
//       ContentType: contentType,
//     };

//     // Use multi-part upload for large files
//     const upload = new Upload({
//       client: s3Client,
//       params: uploadParams,
//     });

//     await upload.done();

//     return `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${fileName}`;
//   } catch (error) {
//     console.error("Error in uploadFileToS3:", error);
//     throw error;
//   }
// }


export async function uploadFileToS3(file, filename){

  try {

    const res = await fetch(`${process.env.NEXT_PUBLIC_WWJS_API_URL}/aws/upload`,{
      method : 'POST',
      headers : {
        'Content-Type' : 'application/json'
      },
      body : JSON.stringify({
        filename : filename,
        imageUrl : file
      })
    })

    const data = await res.json();
    return data.url;
    
  } catch (error) {
    throw error;
  }

}

export async function deleteFileFromS3(fileUrl) {
  try {
    const key = fileUrl.split("/").pop();
    const deleteParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
      Key: key,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(deleteParams));
      return true;
    } catch (deleteError) {
      console.error("S3 Delete Error:", deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error("Error in deleteFileFromS3:", error);
    throw error;
  }
}
