"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ActionIcon } from "../../../Components/ui/ActionIcon";

const ProfilePage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // Set user data from session
    setUserData({
      name: session.user.name || 'N/A', // Fallback if name is undefined
      email: session.user.email,
      role: session.user.isEmployee ? session.user.role : "Mahal Admin",
      permissions: session.user.isEmployee ? session.user.permissions : []
    });
    setLoading(false);
  }, [session, status, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>No user data available</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Name
          </label>
          <p className="text-gray-900">{userData.name}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <p className="text-gray-900">{userData.email}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Role
          </label>
          <p className="text-gray-900">{userData.role}</p>
        </div>
        {session.user.isEmployee && (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Permissions</label>
            {userData.permissions && userData.permissions.length > 0 ? (
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Page
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          View
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Add
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Edit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userData.permissions.map((permission, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{permission.page}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ActionIcon isAllowed={permission.actions.view} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ActionIcon isAllowed={permission.actions.add} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ActionIcon isAllowed={permission.actions.edit} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ActionIcon isAllowed={permission.actions.delete} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-900">No permissions assigned.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

