import React, { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePagePermission } from '../../../hooks/usePagePermission';

const GalleryTable = () => {
  const hasDeletePermission = usePagePermission('web-settings', 'delete');
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryImages();
  }, []); // This will run when the component is mounted/remounted due to key change

  const fetchGalleryImages = async () => {
    try {
      const response = await axios.get('/api/web-settings/gallery');
      setGalleryImages(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching images:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!hasDeletePermission) {
      toast.error('You don\'t have permission to delete gallery images');
      return;
    }
    try {
      await axios.delete(`/api/web-settings/gallery?id=${id}`); // Fixed endpoint path
      await fetchGalleryImages();
      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete image');
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">Gallery Images</h3>
        <p className="text-sm text-gray-500">Total images: {galleryImages.length}</p>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : galleryImages.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No images in gallery</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image) => (
            <div 
              key={image._id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="relative aspect-w-16 aspect-h-9">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                  loading="lazy"
                />
                {hasDeletePermission && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="p-2 bg-white rounded-full text-red-500 hover:text-red-700 transform hover:scale-110 transition-transform duration-200"
                      title="Delete image"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3 border-t">
                <p className="text-sm text-gray-600 truncate" title={image.name}>
                  {image.name}
                </p>
                <p className="text-xs text-gray-400">
                  Added: {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryTable;
