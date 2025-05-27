import fs from 'fs';
import path from 'path';

export const deleteFile = async (logoPath) => {
  try {
    if (!logoPath) return;
    
    // Handle DigitalOcean Spaces deletion
    if (logoPath.includes('digitaloceanspaces.com') && process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) {
      try {
        const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        
        const s3Client = new S3Client({
          endpoint: 'https://blr1.digitaloceanspaces.com',
          region: 'blr1',
          credentials: {
            accessKeyId: process.env.DO_SPACES_KEY,
            secretAccessKey: process.env.DO_SPACES_SECRET,
          },
        });

        const key = logoPath.split('/').slice(-2).join('/'); // Extract "uploads/filename"
        await s3Client.send(new DeleteObjectCommand({
          Bucket: 'jrvdynamicimage',
          Key: key,
        }));
        
        console.log('Old logo deleted from DigitalOcean Spaces successfully:', logoPath);
        return true;
      } catch (error) {
        console.error('Error deleting from DigitalOcean Spaces:', error);
        throw error;
      }
    }
    
    // Handle local file deletion
    const filePath = path.join(process.cwd(), 'public', logoPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Old logo deleted successfully:', logoPath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting old logo:', error);
    throw error;
  }
  return false;
};

export const saveFile = async (base64Data, hotelDb, oldLogoPath) => {
  try {
    // Delete old logo first
    if (oldLogoPath) {
      await deleteFile(oldLogoPath);
    }

    // Extract mime type and base64 content
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 string');

    const [, mimeType, content] = matches;
    const extension = mimeType.split('/')[1];
    
    // Create filename
    const filename = `logo-${hotelDb}-${Date.now()}.${extension}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save new file
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(content, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    console.log('New logo saved successfully:', filename);
    
    // Return the public URL path
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

export const saveToObjectStorage = async (base64Data, hotelDb, oldLogoPath) => {
  try {
    // Extract mime type and base64 content
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 string');

    const [, mimeType, content] = matches;
    const extension = mimeType.split('/')[1];
    const filename = `logo-${hotelDb}-${Date.now()}.${extension}`;
    const buffer = Buffer.from(content, 'base64');

    // Try DigitalOcean Spaces first if configured
    if (process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) {
      try {
        const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        
        const s3Client = new S3Client({
          endpoint: 'https://blr1.digitaloceanspaces.com',
          region: 'blr1',
          credentials: {
            accessKeyId: process.env.DO_SPACES_KEY,
            secretAccessKey: process.env.DO_SPACES_SECRET,
          },
        });

        // Delete old logo if it exists on Spaces
        if (oldLogoPath && oldLogoPath.includes('digitaloceanspaces.com')) {
          try {
            const oldKey = oldLogoPath.split('/').slice(-2).join('/'); // Extract "uploads/filename"
            await s3Client.send(new DeleteObjectCommand({
              Bucket: 'jrvdynamicimage',
              Key: oldKey,
            }));
          } catch (deleteError) {
            console.log('Could not delete old file from Spaces:', deleteError.message);
          }
        }

        const uploadParams = {
          Bucket: 'jrvdynamicimage',
          Key: `uploads/${filename}`,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        
        const publicUrl = `https://jrvdynamicimage.blr1.digitaloceanspaces.com/uploads/${filename}`;
        console.log('New logo saved to DigitalOcean Spaces successfully:', filename);
        return publicUrl;
        
      } catch (spacesError) {
        console.log('DigitalOcean Spaces failed, trying Replit Object Storage:', spacesError.message);
      }
    }

    // Try Object Storage as fallback
    try {
      const { Client } = await import('@replit/object-storage');
      const client = new Client();

      // Delete old logo first if using Object Storage
      if (oldLogoPath && oldLogoPath.startsWith('https://')) {
        try {
          const oldFileName = oldLogoPath.split('/').pop();
          await client.delete(oldFileName);
        } catch (deleteError) {
          console.log('Could not delete old file:', deleteError.message);
        }
      }

      // Extract mime type and base64 content
      const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid base64 string');

      const [, mimeType, content] = matches;
      const extension = mimeType.split('/')[1];
      
      // Create filename
      const filename = `logo-${hotelDb}-${Date.now()}.${extension}`;
      const buffer = Buffer.from(content, 'base64');

      // Upload to Object Storage
      const result = await client.uploadFromBuffer(filename, buffer);
      
      if (result && result.url) {
        console.log('New logo saved to Object Storage successfully:', filename);
        return result.url;
      }
      
      // Construct URL if not provided
      const publicUrl = `https://objectstorage.replit.com/${filename}`;
      console.log('New logo saved to Object Storage successfully:', filename);
      return publicUrl;
      
    } catch (objectStorageError) {
      console.log('Object Storage failed, falling back to local storage:', objectStorageError.message);
      // Fall back to local storage
      return await saveFile(base64Data, hotelDb, oldLogoPath);
    }
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};
