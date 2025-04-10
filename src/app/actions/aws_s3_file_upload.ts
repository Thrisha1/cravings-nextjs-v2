'use server'

export async function uploadFileToS3(file: File, path: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error in uploadFileToS3:', error);
    throw error;
  }
}