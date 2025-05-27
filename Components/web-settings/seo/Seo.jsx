import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Seo = ({ hasAddPermission, hasEditPermission }) => {
  const [seoData, setSeoData] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    try {
      const response = await axios.get('/api/web-settings/seo');
      if (response.data.success && response.data.data) {
        setSeoData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      toast.error('Failed to fetch SEO data');
    }
  };

  const handleChange = (e) => {
    if (!hasEditPermission && !hasAddPermission) {
      toast.error("You don't have permission to modify SEO settings");
      return;
    }
    setSeoData({
      ...seoData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasEditPermission && !hasAddPermission) {
      toast.error("You don't have permission to save SEO settings");
      return;
    }

    if (seoData._id && !hasEditPermission) {
      toast.error("You don't have permission to edit SEO settings");
      return;
    }

    if (!seoData._id && !hasAddPermission) {
      toast.error("You don't have permission to add SEO settings");
      return;
    }

    setIsLoading(true);
    try {
      const method = seoData._id ? 'put' : 'post';
      const response = await axios[method]('/api/web-settings/seo', seoData);
      if (response.data.success) {
        toast.success('SEO settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast.error('Error saving SEO settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-4">SEO Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input
              type="text"
              name="metaTitle"
              value={seoData.metaTitle}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter meta title"
              disabled={!hasEditPermission && !hasAddPermission}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              name="metaDescription"
              value={seoData.metaDescription}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Enter meta description"
              disabled={!hasEditPermission && !hasAddPermission}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Keywords</label>
            <input
              type="text"
              name="metaKeywords"
              value={seoData.metaKeywords}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter keywords separated by commas"
              disabled={!hasEditPermission && !hasAddPermission}
            />
          </div>
          {(hasEditPermission || hasAddPermission) && (
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-hotel-primary text-white px-4 py-2 rounded hover:bg-hotel-primary disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default Seo;