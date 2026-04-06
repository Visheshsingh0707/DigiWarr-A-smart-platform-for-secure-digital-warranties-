import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

cloudinary.config({
  secure: true
});

/**
 * Saves an encrypted buffer to Cloudinary using secure raw stream.
 * Returns the Cloudinary secure_url.
 */
export async function saveEncryptedFile(
  encryptedBuffer: Buffer,
  originalName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalName);
    const filename = `${uuidv4()}${ext}.enc`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: `digiwarr/${filename}`,
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary Upload Error:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    // End the stream with the buffer
    uploadStream.end(encryptedBuffer);
  });
}

/**
 * Reads an encrypted file directly from the Cloudinary URL.
 */
export async function readEncryptedFile(storagePath: string): Promise<Buffer> {
  try {
    const response = await fetch(storagePath, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file from Cloudinary: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Cloudinary Read Error:", err);
    throw err;
  }
}

/**
 * Deletes an encrypted file from Cloudinary.
 */
export async function deleteEncryptedFile(storagePath: string): Promise<void> {
  try {
    const urlParts = storagePath.split('/upload/');
    if (urlParts.length !== 2) {
      console.warn('Could not parse Cloudinary URL for deletion:', storagePath);
      return;
    }
    
    // Remove the version string, e.g. "v1234567/digiwarr/xyz.enc" -> "digiwarr/xyz.enc"
    const pathAfterUpload = urlParts[1];
    const slashIndex = pathAfterUpload.indexOf('/');
    const publicId = pathAfterUpload.substring(slashIndex + 1);

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
  }
}

