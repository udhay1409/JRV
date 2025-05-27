import React, { useEffect, useState } from 'react';
import { FiTrash2, FiEdit } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePagePermission } from '../../../hooks/usePagePermission';

const GeneralTable = ({ onEdit }) => {
  const hasEditPermission = usePagePermission('web-settings', 'edit');
  const hasDeletePermission = usePagePermission('web-settings', 'delete');
  const [heroSections, setHeroSections] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/web-settings');
      setHeroSections(response.data.heroSections || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleEdit = (item) => {
    if (!hasEditPermission) {
      toast.error('You don\'t have permission to edit hero sections');
      return;
    }
    onEdit({
      id: item._id,
      title: item.title,
      quote: item.quote,
      image: item.image
    });
  };

  const handleDelete = async (id) => {
    if (!hasDeletePermission) {
      toast.error('You don\'t have permission to delete hero sections');
      return;
    }
    try {
      await axios.delete(`/api/web-settings?heroSectionId=${id}`);
      await fetchData();
      toast.success('Item deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete item');
      console.error('Error deleting item:', error);
    }
  };

  const ImageComponent = ({ src, alt }) => (
    <img
      src={src}
      alt={alt}
      className="h-16 w-24 object-cover rounded"
      onError={(e) => {
        toast.error('Failed to load image');
      }}
      loading="lazy"
    />
  );

  return (
    <div className="mt-6">
      {heroSections.length === 0 ? (
        <div className="text-center text-gray-500">No hero sections added yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-hotel-primary text-white">
              <tr> 
                <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  Hero Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  Hero Quote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {heroSections.map((item) => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ImageComponent 
                      src={item.image} 
                      alt={item.title} 
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <h1 className="text-sm font-medium text-gray-900">{item.title}</h1>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-500 line-clamp-2">{item.quote}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GeneralTable;
