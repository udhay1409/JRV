import React, { useState } from 'react';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import axios from 'axios';
import { toast } from 'react-toastify';
import GeneralTable from './GeneralTable';

const General = ({ hasAddPermission, hasEditPermission, hasDeletePermission }) => {
  const [heroData, setHeroData] = useState({
    id: null,
    title: '',
    quote: '',
    image: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleImageUpload = async (e) => {
    if (!hasAddPermission && !hasEditPermission) {
      toast.error("You don't have permission to upload images");
      return;
    }
    const file = e.target.files[0];
    if (file) {
      try {
        // Convert image to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          setHeroData(prev => ({ ...prev, image: base64String }));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error('Error uploading image');
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (data) => {
    if (!hasEditPermission) {
      toast.error("You don't have permission to edit hero sections");
      return;
    }
    setHeroData(data);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isEditing && !hasEditPermission) {
      toast.error("You don't have permission to edit hero sections");
      return;
    }
    if (!isEditing && !hasAddPermission) {
      toast.error("You don't have permission to add hero sections");
      return;
    }

    try {
      if (!heroData.title || !heroData.quote || !heroData.image) {
        return toast.error('Please fill all fields');
      }

      const response = await axios.get('/api/web-settings');
      if (response.data.heroSections?.length >= 1 && !isEditing) {
        return toast.error('Maximum 1 hero section allowed');
      }

      if (isEditing) {
        await axios.put('/api/web-settings', {
          heroSectionId: heroData.id,
          heroSection: heroData
        });
      } else {
        await axios.post('/api/web-settings', {
          heroSection: heroData
        });
      }

      setHeroData({ id: null, title: '', quote: '', image: null });
      setIsEditing(false);
      toast.success(`Hero section ${isEditing ? 'updated' : 'saved'} successfully!`);
      
      // Trigger reload after 1 second
      setTimeout(() => {
        setReloadTrigger(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error(`Error ${isEditing ? 'updating' : 'saving'} hero section`);
      console.error('Error:', error);
    }
  };

  // If user has no add/edit permissions, only show the table
  if (!hasAddPermission && !hasEditPermission) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Hero Sections List</h2>
          <GeneralTable 
            key={reloadTrigger} 
            onEdit={() => {}} 
            hasEditPermission={hasEditPermission}
            hasDeletePermission={hasDeletePermission}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          {isEditing ? 'Edit' : 'Add'} Hero Section
        </h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hero Image</label>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {heroData.image && (
                <div className="mt-2 relative rounded-lg overflow-hidden">
                  <img
                    src={heroData.image}
                    alt="Hero preview"
                    className="w-full h-[200px] object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hero Title</label>
            <Input
              type="text"
              value={heroData.title}
              onChange={(e) => setHeroData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter hero title"
              className="w-full px-3 py-2  border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hero Quote</label>
            <textarea
              value={heroData.quote}
              onChange={(e) => setHeroData(prev => ({ ...prev, quote: e.target.value }))}
              placeholder="Enter hero quote"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end mt-6 space-x-4">
            {isEditing && (
              <Button 
                onClick={() => {
                  setHeroData({ id: null, title: '', quote: '', image: null });
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleSave}
              className="px-4 py-2 bg-hotel-primary text-white rounded-md hover:bg-hotel-primary focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isEditing ? 'Update' : 'Save'} Changes
            </Button>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Hero Sections List</h2>
          <GeneralTable 
            key={reloadTrigger} 
            onEdit={handleEdit}
            hasEditPermission={hasEditPermission}
            hasDeletePermission={hasDeletePermission}
          />
        </div>
      </div>
    </div>
  );
};
 
export default General;