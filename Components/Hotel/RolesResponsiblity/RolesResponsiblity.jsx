"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Edit, Check } from "lucide-react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import axios from "axios";
import { toast } from "react-toastify";
import RolesResponsibilitySkeleton from "./RolesResponsibilitySkeleton";
import { usePagePermission } from "../../../hooks/usePagePermission";
import ConfirmationDialog from "../../../Components/ui/ConfirmationDialog";

const permissions = [
 
  "Calendar-View",
  "Dashboard",
  "bookings",
  "Rooms",
  "LogBook",
  "Inventory",
  "Employees",
  "Employees/roles-responsibility",

  // "crm/add-contact",

 /*  "financials", */
  "financials/invoices",
  "financials/expenses",
  "financials/Bank",
  "financials/LedgerBook",
  "contacts/guest",
  "crm",
  "web-settings"
/*   "Settings",
  "Settings/Inventory",
  "Settings/Complimentary" */
];
const actions = ["View", "Create", "Edit", "Delete"];

export default function RolesResponsibility() {
  // Update permission checks
  const hasAddPermission = usePagePermission(
    "Employees/roles-responsibility",
    "add"
  );
  const hasEditPermission = usePagePermission(
    "Employees/roles-responsibility",
    "edit"
  );
  const hasDeletePermission = usePagePermission(
    "Employees/roles-responsibility",
    "delete"
  );
  const [role, setRole] = useState("");
  const [permissionsState, setPermissionsState] = useState({});
  const [roles, setRoles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/rolesAndPermission`);
      setRoles(response.data.roles);
    } catch (error) {
      toast.error("Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <RolesResponsibilitySkeleton />;
  }

  const handlePermissionChange = (description, action) => {
    setPermissionsState((prev) => {
      const currentState = { ...prev };

      // If selecting any action other than View, ensure View is also selected
      if (action !== "View") {
        const newActionState = !(currentState[description]?.[action] || false);
        return {
          ...currentState,
          [description]: {
            ...currentState[description],
            [action]: newActionState,
            // Force View to be true if any other permission is being enabled
            View: newActionState
              ? true
              : // If disabling an action, keep View true if any other action is still enabled
                currentState[description]?.Create ||
                currentState[description]?.Edit ||
                currentState[description]?.Delete ||
                currentState[description]?.View,
          },
        };
      }

      // If unchecking View, uncheck all other permissions as well
      if (action === "View" && !!currentState[description]?.View) {
        return {
          ...currentState,
          [description]: {
            View: false,
            Create: false,
            Edit: false,
            Delete: false,
          },
        };
      }

      // Normal View toggle if enabling View
      return {
        ...currentState,
        [description]: {
          ...currentState[description],
          [action]: !(currentState[description]?.[action] || false),
        },
      };
    });
  };
  //   setPermissionsState((prev) => ({
  //     ...prev,
  //     [description]: {
  //       ...prev[description],
  //       [action]: !(prev[description]?.[action] || false),
  //     },
  //   }));
  // };

  const handleSubmit = async () => {
    if (!role.trim()) {
      toast.error("Role name is required");
      return;
    }

    // Check permissions before submitting
    if (isEditing && !hasEditPermission) {
      toast.error("You don't have permission to edit roles");
      return;
    }

    if (!isEditing && !hasAddPermission) {
      toast.error("You don't have permission to add roles");
      return;
    }

    const roleData = {
      role,
      permissions: Object.entries(permissionsState).map(([page, actions]) => ({
        page,
        url: `/dashboard/${page.toLowerCase()}`,
        actions: {
          view: actions.View || false,
          add: actions.Create || false,
          edit: actions.Edit || false,
          delete: actions.Delete || false,
        },
      })),
    };

    try {
      if (isEditing) {
        await axios.put(`/api/rolesAndPermission`, {
          ...roleData,
          id: editId,
        });
        toast.success("Role updated successfully!");
      } else {
        await axios.post(`/api/rolesAndPermission`, roleData);
        toast.success("Role added successfully!");
      }
      fetchRoles();
      resetForm();
    } catch (error) {
      console.error(
        "Error submitting role:",
        error.response?.data || error.message
      );
      toast.error(isEditing ? "Failed to update role" : "Failed to add role");
    }
  };

  const handleEdit = (role) => {
    if (!hasEditPermission) {
      toast.error("You don't have permission to edit roles");
      return;
    }
    setRole(role.role);
    const editPermissions = role.permissions.reduce((acc, permission) => {
      acc[permission.page] = {
        View: permission.actions.view || false,
        Create: permission.actions.add || false,
        Edit: permission.actions.edit || false,
        Delete: permission.actions.delete || false,
      };
      return acc;
    }, {});
    setPermissionsState(editPermissions);
    setIsEditing(true);
    setEditId(role._id);
  };

  const handleDeleteClick = (role) => {
    if (!hasDeletePermission) {
      toast.error("You don't have permission to delete roles");
      return;
    }
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await axios.delete(`/api/rolesAndPermission`, {
        data: { id: roleToDelete._id },
      });
      toast.success("Role deleted successfully!");
      fetchRoles();
    } catch (error) {
      toast.error("Failed to delete role");
    } finally {
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const resetForm = () => {
    setRole("");
    setPermissionsState({});
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="container mx-auto p-4 max-w-15xl border rounded-lg bg-white shadow-sm">
      <main>
        {" "}
        {/* Show form only if user has add or edit permission */}
        <>
          <div className="mb-6">
            <label
              htmlFor="role"
              className="block mb-2 font-semibold text-gray-700"
            >
              Role
            </label>
            <Input
              id="role"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Permissions
            </h2>
            <div className="rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-hotel-primary">
                    <th className="p-2 text-left font-semibold text-white">
                      Descriptions
                    </th>
                    {actions.map((action) => (
                      <th
                        key={action}
                        className="p-2 text-center font-semibold text-white"
                      >
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((description) => (
                    <tr key={description} className="border-b border-blue-100">
                      <td className="p-2 text-gray-700">{description}</td>
                      {actions.map((action) => (
                        <td
                          key={`${description}-${action}`}
                          className="p-2 text-center cursor-pointer"
                          onClick={() =>
                            handlePermissionChange(description, action)
                          }
                        >
                          {permissionsState[description]?.[action] ? (
                            <Check className="w-6 h-6 text-green-500 mx-auto" />
                          ) : (
                            <div className="w-6 h-6 mx-auto border border-gray-300 rounded" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center w-full">
            <Button
              className="mb-8 bg-hotel-primary hover:bg-hotel-primary text-lg  text-white text-center mx-auto  w-[200px]"
              onClick={handleSubmit}
            >
              {isEditing ? "Update" : "save"}
            </Button>
          </div>
        </>
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Roles List
          </h2>
          <div className="rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-hotel-primary">
                  <th className="p-2 text-left font-semibold text-white">No</th>
                  <th className="p-2 text-left font-semibold text-white">
                    Role
                  </th>
                  <th className="p-2 text-left font-semibold text-white">
                    Permissions
                  </th>
                  <th className="p-2 text-right font-semibold text-white">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role, index) => (
                  <tr key={role._id} className="border-b border-blue-100">
                    <td className="p-2 text-gray-700">{index + 1}</td>
                    <td className="p-2 text-gray-700">{role.role}</td>
                    <td className="p-2 text-gray-700">
                      {role.permissions.map((permission) => (
                        <div key={permission.page} className="mb-1">
                          {permission.page}:{" "}
                          {Object.entries(permission.actions)
                            .filter(([, value]) => value)
                            .map(([key]) => key)
                            .join(", ")}
                        </div>
                      ))}
                    </td>
                    <td className="p-2 text-right">
                      {hasEditPermission && (
                        <Button
                          isIconOnly
                          variant="light"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {hasDeletePermission && (
                        <Button
                          isIconOnly
                          variant="light"
                          onClick={() => handleDeleteClick(role)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        description={
          <>
            Are you sure you want to delete the role &quot;{roleToDelete?.role}
            &quot;?
            <br />
            <br />
            This action cannot be undone and will also delete all associated
            employee accounts.
          </>
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
