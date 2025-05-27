"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Calendar as CalendarIcon, Trash2, Edit } from "lucide-react"
import { Button } from "@heroui/button"
import { Input } from "../../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Calendar } from "../../ui/calendar"
import { Pagination } from "@heroui/pagination"
import { toast } from "react-toastify"
import axios from "axios"
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table"
import ConfirmationDialog from "../../ui/ConfirmationDialog"

export default function CalendarSettings() {
  const [occasions, setOccasions] = useState([])
  const [selectedOccasionName, setSelectedOccasionName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#FFB800")
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingOccasion, setEditingOccasion] = useState(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const colorInputRef = useRef(null)
  const [isAddingNewOccasion, setIsAddingNewOccasion] = useState(false)
  const [newOccasionName, setNewOccasionName] = useState("")
  const [occasionOptions, setOccasionOptions] = useState([])
 // Add these new states after your existing states
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const [occasionToDelete, setOccasionToDelete] = useState(null)

  const getExistingColor = (occasionType) => {
    return occasions.find(occ => 
      occ.name === occasionType && 
      (!editingOccasion || occ._id !== editingOccasion._id)
    )?.color;
  }

  useEffect(() => {
    fetchOccasions()
  }, [])

  useEffect(() => {
    // Get unique occasion names from the database occasions
    const uniqueOccasions = [...new Set(occasions.map(occ => occ.name))]
    setOccasionOptions(uniqueOccasions)
  }, [occasions])

  const fetchOccasions = useCallback(async () => {
    try {
      const response = await axios.get(`/api/settings/calendar`)
      if (response.data.success) {
        setOccasions(response.data.data.occasions || [])
      } else {
        toast.error("Failed to fetch occasions")
      }
    } catch (error) {
      console.error('Error fetching occasions:', error)
      toast.error("Error fetching occasions")
    }
  }, [])

  const handleSave = async () => {
    try {
      if (!selectedOccasionName || selectedDates.length === 0) {
        toast.error("Please fill in all required fields")
        return
      }

      const existingColor = getExistingColor(selectedOccasionName)
      if (existingColor && existingColor !== selectedColor) {
        toast.error(`This occasion type already uses color ${existingColor}. Please use the same color.`)
        return
      }

      const occasionData = {
        name: selectedOccasionName,
        dates: selectedDates,
        color: selectedColor.toUpperCase()
      }

      const response = await axios({
        method: isEditing ? 'put' : 'post',
        url: `/api/settings/calendar`,
        data: isEditing 
          ? { occasionId: editingOccasion._id, updates: occasionData }
          : { occasion: occasionData }
      })

      if (response.data.success) {
        toast.success(isEditing ? "Occasion updated successfully" : "Occasion added successfully")
        fetchOccasions()
        resetForm()
      } else {
        toast.error(response.data.error || "Failed to save occasion")
      }
    } catch (error) {
      console.error('Error saving occasion:', error)
      toast.error(error.response?.data?.error || "Error saving occasion")
    }
  }

  // Add this function to handle delete click
const handleDeleteClick = (occasion) => {
  setOccasionToDelete(occasion)
  setIsDeleteDialogOpen(true)
}

  // Modify your handleDelete function
const handleDelete = async () => {
  if (!occasionToDelete) return

  try {
    const response = await axios.delete(`/api/settings/calendar`, {
      data: { occasionId: occasionToDelete._id }
    })

    if (response.data.success) {
      toast.success("Occasion deleted successfully")
      fetchOccasions()
    } else {
      toast.error(response.data.error || "Failed to delete occasion")
    }
  } catch (error) {
    console.error('Error deleting occasion:', error)
    toast.error(error.response?.data?.error || "Error deleting occasion")
  }
}


  const handleEdit = (occasion) => {
    setIsEditing(true)
    setEditingOccasion(occasion)
    setSelectedOccasionName(occasion.name)
    setSelectedColor(occasion.color) // Color will be set but not editable
    setSelectedDates(occasion.dates.map(date => new Date(date)))
  }

  const resetForm = () => {
    setSelectedOccasionName("")
    setSelectedDates([])
    setSelectedColor("#FFB800")
    setIsEditing(false)
    setEditingOccasion(null)
  }

  const handleCancel = () => {
    resetForm()
  }

  const handleDateSelect = (dates) => {
    setSelectedDates(dates)
    setShowCalendar(false)
  }

  const triggerColorPicker = () => {
    colorInputRef.current?.click()
  }

  const handleAddNewOccasion = () => {
    if (!newOccasionName.trim()) {
      toast.error("Please enter an occasion name")
      return
    }

    if (occasionOptions.includes(newOccasionName.toLowerCase())) {
      toast.error("This occasion already exists")
      return
    }

    setOccasionOptions(prev => [...prev, newOccasionName.toLowerCase()])
    setNewOccasionName("")
    setIsAddingNewOccasion(false)
    toast.success("New occasion type added")
  }

  const paginatedOccasions = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return occasions.slice(start, end)
  }, [occasions, page, rowsPerPage])

  const pages = Math.ceil(occasions.length / rowsPerPage)

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, occasions.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {`Showing ${start}-${end} of ${occasions.length}`}
        </span>
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <div className="custom-pagination">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={pages}
              onChange={setPage}
              className="custom-pagination"
            />
          </div>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, occasions.length]);

  const topContent = useMemo(() => {
    return (
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          Total {occasions.length} occasions
        </span>
        <label className="flex items-center text-default-400 text-small">
          Rows per page:
          <select
            className="bg-transparent outline-none text-default-400 text-small"
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </label>
      </div>
    );
  }, [occasions.length]);

  return (
    <div className="mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px]">
      <div>
        <h1 className="text-2xl font-medium text-gray-700">
          {isEditing ? "Edit Occasion" : "Manage Occasions"}
        </h1>

        <div className="mt-8 space-y-6 mb-12 border-b pb-8">
          <div>
            <label htmlFor="occasion-name" className="block text-sm font-medium text-gray-700 mb-2">
              Occasion Name
            </label>
            <div className="space-y-2">
              {occasionOptions.length === 0 ? (
                // Show only input field when no occasions exist
                <div className="flex gap-2 w-full max-w-md">
                  <Input
                    value={newOccasionName}
                    onChange={(e) => setNewOccasionName(e.target.value)}
                    placeholder="Enter new occasion name"
                    className="border border-gray-300 rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewOccasion()
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddNewOccasion}
                    className="bg-hotel-primary text-white px-4 hover:opacity-90"
                  >
                    Add
                  </Button>
                </div>
              ) : (
                // Show dropdown and "Add New" button when occasions exist
                <div className="flex gap-2 w-full max-w-md">
                  <Select 
                    value={selectedOccasionName} 
                    onValueChange={(value) => {
                      setSelectedOccasionName(value)
                      const existingColor = occasions.find(occ => 
                        occ.name === value && 
                        (!editingOccasion || occ._id !== editingOccasion._id)
                      )?.color
                      
                      if (existingColor) {
                        setSelectedColor(existingColor)
                        toast.info(`Using existing color ${existingColor} for ${value}`)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border border-gray-300 rounded-md">
                      <SelectValue placeholder="Select Occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      {occasionOptions.map(option => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onPress={() => setIsAddingNewOccasion(true)}
                    className="bg-hotel-primary text-white px-4 hover:opacity-90"
                  >
                    Add New
                  </Button>
                </div>
              )}

              {/* Show add new occasion input when adding new and occasions exist */}
              {isAddingNewOccasion && occasionOptions.length > 0 && (
                <div className="flex gap-2 w-full max-w-md">
                  <Input
                    value={newOccasionName}
                    onChange={(e) => setNewOccasionName(e.target.value)}
                    placeholder="Enter new occasion name"
                    className="border border-gray-300 rounded-md"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNewOccasion()
                      }
                    }}
                  />
                  <Button
                    onPress={handleAddNewOccasion}
                    className="bg-hotel-primary text-white px-4 hover:opacity-90"
                  >
                    Add
                  </Button>
                  <Button
                    onPress={() => {
                      setIsAddingNewOccasion(false)
                      setNewOccasionName("")
                    }}
                    className="bg-[#404040] hover:opacity-90 text-white px-4"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="select-date" className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <div className="relative w-full max-w-md">
              <Input 
                id="select-date" 
                placeholder="Select Dates"
                value={selectedDates.map(date => date.toLocaleDateString()).join(", ")}
                readOnly
                onClick={() => setShowCalendar(!showCalendar)}
                className="border border-gray-300 rounded-md pr-10 cursor-pointer" 
              />
              <CalendarIcon 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" 
                size={18}
                onClick={() => setShowCalendar(!showCalendar)}
              />
              {showCalendar && (
                <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="select-color" className="block text-sm font-medium text-gray-700 mb-2">
              Select Color
            </label>
            <div className="flex w-full max-w-md items-center">
              <Input
                id="select-color"
                value={selectedColor}
                className={`h-10 border border-gray-300 rounded-l-md ${isEditing ? 'bg-gray-100' : ''}`}
                readOnly
                disabled={isEditing}
              />
              <div 
                className={`w-24 h-10 rounded-r-md ${isEditing ? 'cursor-not-allowed' : 'cursor-pointer'} border border-l-0 border-gray-300`}
                style={{ backgroundColor: selectedColor }}
                onClick={() => !isEditing && triggerColorPicker()}
              />
              <input
                type="color"
                ref={colorInputRef}
                value={selectedColor}
                onChange={(e) => !isEditing && setSelectedColor(e.target.value.toUpperCase())}
                className="hidden"
                disabled={isEditing}
              />
            </div>
            {isEditing && (
              <p className="mt-2 text-sm text-gray-500">
                Color cannot be changed for existing occasions
              </p>
            )}
          </div>

          <div className="flex justify-center space-x-4 pt-6">
            <Button 
              className="bg-hotel-primary text-white px-8 min-w-[120px] h-10 hover:opacity-90"
              onPress={handleSave}
            >
              {isEditing ? "Update" : "Save"}
            </Button>
            <Button 
              variant="bordered" 
              className="bg-[#404040] hover:opacity-90 text-white px-8 min-w-[120px] h-10"
              onPress={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <Table
            aria-label="Calendar Settings table"
            isHeaderSticky
            bottomContent={bottomContent}
            bottomContentPlacement="inside"
            classNames={{
              wrapper: "",
            }}
            topContent={topContent}
            topContentPlacement="inside"
          >
            <TableHeader>
              <TableColumn key="name">OCCASION NAME</TableColumn>
              <TableColumn key="date">SELECT DATE</TableColumn>
              <TableColumn key="color">COLOR</TableColumn>
              <TableColumn key="actions">ACTION</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={"No occasions found"}
              items={paginatedOccasions || []}
            >
              {(occasion) => (
                <TableRow key={occasion._id}>
                  <TableCell>{occasion.name}</TableCell>
                  <TableCell>
                    {occasion.dates.map(date => 
                      new Date(date).toLocaleDateString()
                    ).join(", ")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-md" 
                        style={{ backgroundColor: occasion.color }}
                      />
                      <span className="text-gray-600 text-sm">{occasion.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-md"
                        onClick={() => handleEdit(occasion)}
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-md"
                        onClick={() => handleDeleteClick(occasion)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
<ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Occasion"
        description={`Are you sure you want to delete the occasion "${occasionToDelete?.name}"?`}
        confirmText="Delete"
      />
    </div>
  )
}