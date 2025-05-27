
import { useState } from 'react';

function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const file = e.target.image.files[0];
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      setUploadedUrl(data.imageUrl);
      alert('Upload successful! URL: ' + data.imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Upload Image</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input 
            type="file" 
            name="image" 
            accept="image/*" 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {uploadedUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Uploaded successfully:</p>
          <img 
            src={uploadedUrl} 
            alt="Uploaded" 
            className="max-w-full h-auto rounded border"
          />
          <p className="text-xs text-gray-500 mt-2 break-all">{uploadedUrl}</p>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
