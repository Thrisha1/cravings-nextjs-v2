import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const { image, fileName, contentType } = await request.json();

    if (!image || !fileName) {
      return NextResponse.json(
        { error: 'Image and fileName are required' },
        { status: 400 }
      );
    }

    // Remove data:image/jpeg;base64, from the base64 string
    const base64Data = image.toString().replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Log environment variables (remove in production)
    console.log('Region:', process.env.NEXT_PUBLIC_S3_REGION);
    console.log('Bucket:', process.env.NEXT_PUBLIC_S3_BUCKET);

    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_S3_REGION,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY!,
        secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY!,
      },
    });

    const key = `menu-images/${fileName}`;
    
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType || 'image/jpeg',
          ContentEncoding: 'base64',
        })
      );
    } catch (uploadError) {
      console.error('S3 Upload Error:', uploadError);
      throw uploadError;
    }

    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error in upload-s3 route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload to S3',
        details: error 
      },
      { status: 500 }
    );
  }
} 