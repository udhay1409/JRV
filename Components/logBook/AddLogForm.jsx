"use client"

import { useState, useEffect, useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select"
import { Input } from "@/Components/ui/input"
import { Buttons } from "@/Components/ui/button"
import { Textarea } from "@/Components/ui/textarea"
import { X, Plus } from "lucide-react"
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { addDays } from "date-fns"
import axios from "axios"
import { toast } from "react-toastify"
import DamageLossSummary from "./DamageLossSummary"
import GrandTotalSummary from "./GrandTotalSummary"
import { useRouter } from 'next/navigation'
import EditLogFormSkeleton from "./EditLogFormSkeleton"

export default function AddLogForm({ logId }) {
  const isEditMode = !!logId;
  const [itemsIssued, setItemsIssued] = useState([{}])
  const [electricityReadings, setElectricityReadings] = useState([{}])
  const [totalAmount, setTotalAmount] = useState("")
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  })
  const [inventory, setInventory] = useState([])
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [electricityTypes, setElectricityTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allBookings, setAllBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [formData, setFormData] = useState({
    bookingId: "",
    customerName: "",
    mobileNo: "",
    propertyType: "",
    eventType: "",
    checkInTime: "",
    notes: ""
  })
  const [damageLossSummary, setDamageLossSummary] = useState([{}])
  const [totalRecoveryAmount, setTotalRecoveryAmount] = useState(0)
  const router = useRouter()

  // Calculate Electricity/Generator Total Amount
  const electricityTotalAmount = electricityReadings.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);

  // Calculate Damage/Loss Summary Totals
  const damageLossTotalItems = damageLossSummary.filter(row => row.category || row.subCategory || row.brand || row.model || row.quantity).length;

  // Make Damage/Loss Total Amount editable
  const handleDamageLossTotalAmountChange = useCallback((val) => {
    setTotalRecoveryAmount(val);
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchElectricityTypes();
    if (!isEditMode) {
      fetchBookings();
    }
  }, []);

  // Add effect to load log data when in edit mode
  useEffect(() => {
    const loadLogData = async () => {
      if (isEditMode && logId) {
        try {
          setIsLoading(true);
          const response = await axios.get(`/api/logBook/${logId}`);
          
          if (response.data.success) {
            const logData = response.data.data;
            console.log("Setting form data with:", logData); // Debug log

            // Set base form data
            setFormData({
              bookingId: logData.bookingId || "",
              customerName: logData.customerName || "",
              mobileNo: logData.mobileNo || "",
              propertyType: logData.propertyType || "",
              eventType: logData.eventType || "",
              checkInTime: logData.checkInTime || "",
              notes: logData.notes || ""
            });

            // Set date range
            if (logData.dateRange && logData.dateRange.from && logData.dateRange.to) {
              setDateRange({
                from: new Date(logData.dateRange.from),
                to: new Date(logData.dateRange.to)
              });
            }

            // Set items issued
            if (Array.isArray(logData.itemsIssued) && logData.itemsIssued.length > 0) {
              setItemsIssued(logData.itemsIssued);
            }

            // Set electricity readings
            if (Array.isArray(logData.electricityReadings) && logData.electricityReadings.length > 0) {
              setElectricityReadings(logData.electricityReadings);
            }

            // Set total amount
            setTotalAmount(logData.totalAmount?.toString() || "0");

            // Add the booking to filteredBookings for dropdowns
            const currentBooking = {
              bookingNumber: logData.bookingId,
              firstName: logData.customerName.split(' ')[0],
              lastName: logData.customerName.split(' ')[1] || '',
              mobileNo: logData.mobileNo,
              propertyType: logData.propertyType,
              eventType: logData.eventType,
              timeSlot: { fromTime: logData.checkInTime },
              checkInDate: logData.dateRange?.from,
              checkOutDate: logData.dateRange?.to
            };

            setFilteredBookings([currentBooking]);
            setAllBookings([currentBooking]);
          }
        } catch (error) {
          console.error('Error loading log data:', error);
          toast.error('Failed to load log data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadLogData();
  }, [logId, isEditMode]);

  // Effect to filter bookings when date range changes
  useEffect(() => {
    filterBookingsByDate()
  }, [dateRange, allBookings])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get('/api/inventory')
      if (response.data.success) {
        const inventoryData = response.data.data
        setInventory(inventoryData)
        
        // Extract unique values for dropdowns
        const uniqueCategories = [...new Set(inventoryData.map(item => item.category))]
        setCategories(uniqueCategories)
        
        const uniqueSubCategories = [...new Set(inventoryData.map(item => item.subCategory))]
        setSubCategories(uniqueSubCategories)
        
        const uniqueBrands = [...new Set(inventoryData.map(item => item.brandName))]
        setBrands(uniqueBrands)
        
        const uniqueModels = [...new Set(inventoryData.map(item => item.model))]
        setModels(uniqueModels)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchElectricityTypes = async () => {
    try {
      const response = await axios.get('/api/settings/inventory')
      if (response.data.success) {
        setElectricityTypes(response.data.settings.electricityTypes || [])
      }
    } catch (error) {
      console.error('Failed to fetch electricity types:', error)
    }
  }

  const fetchBookings = async () => {
    if (isEditMode) return; // Skip fetching bookings in edit mode
    
    try {
      setIsLoading(true);
      const response = await axios.get('/api/bookings?source=logbook');
      if (response.data.success) {
        const activeBookings = response.data.bookings.filter(booking => 
          // Show both booked and checkin status bookings
          (booking.status === "booked" || booking.status === "checkin") && 
          (booking.propertyType === "room" || booking.propertyType === "hall")
        );
        setAllBookings(activeBookings);
        filterBookingsByDate(activeBookings);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }

  const filterBookingsByDate = (bookings = allBookings) => {
    const selectedFromDate = new Date(dateRange.from)
    const selectedToDate = new Date(dateRange.to)
    
    // Reset time parts for accurate date comparison
    selectedFromDate.setHours(0, 0, 0, 0)
    selectedToDate.setHours(23, 59, 59, 999)

    const filtered = bookings.filter(booking => {
      const bookingCheckIn = new Date(booking.checkInDate)
      const bookingCheckOut = new Date(booking.checkOutDate)
      
      // Reset time parts for accurate date comparison
      bookingCheckIn.setHours(0, 0, 0, 0)
      bookingCheckOut.setHours(23, 59, 59, 999)

      // Check if booking overlaps with selected date range
      return (
        (bookingCheckIn <= selectedToDate && bookingCheckOut >= selectedFromDate) ||
        (bookingCheckIn >= selectedFromDate && bookingCheckIn <= selectedToDate) ||
        (bookingCheckOut >= selectedFromDate && bookingCheckOut <= selectedToDate)
      )
    })

    setFilteredBookings(filtered)
    
    // Only clear form data if there are no bookings or if the current booking is not in the filtered results
    if (filtered.length === 0 || !filtered.find(b => b.bookingNumber === formData.bookingId)) {
      setFormData({
        bookingId: "",
        customerName: "",
        mobileNo: "",
        propertyType: "",
        eventType: "",
        checkInTime: "",
        notes: ""
      })
    }
  }

  const handleBookingSelect = async (bookingId) => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`)
      if (response.data.success) {
        const booking = response.data.booking
        
        // Format check-in time properly
        const checkInTime = booking.timeSlot?.fromTime || 
          new Date(booking.checkInDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

        setFormData({
          ...formData,
          bookingId: booking.bookingNumber,
          customerName: `${booking.firstName} ${booking.lastName}`,
          mobileNo: booking.mobileNo,
          propertyType: booking.propertyType,
          eventType: booking.eventType || '',
          checkInTime: checkInTime,
          notes: booking.notes || ''
        })

        // Update date range based on booking dates
        if (booking.checkInDate && booking.checkOutDate) {
          setDateRange({
            from: new Date(booking.checkInDate),
            to: new Date(booking.checkOutDate)
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch booking details:', error)
      toast.error('Failed to load booking details')
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...itemsIssued]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    setItemsIssued(newItems)
  }

  const getFilteredSubCategories = (category) => {
    return [...new Set(inventory
      .filter(item => item.category === category)
      .map(item => item.subCategory))]
  }

  const getFilteredBrands = (category, subCategory) => {
    return [...new Set(inventory
      .filter(item => item.category === category && item.subCategory === subCategory)
      .map(item => item.brandName))]
  }

  const getFilteredModels = (category, subCategory, brand) => {
    return [...new Set(inventory
      .filter(item => 
        item.category === category && 
        item.subCategory === subCategory && 
        item.brandName === brand
      )
      .map(item => item.model))]
  }

  const getAvailableQuantity = (category, subCategory, brand, model) => {
    const item = inventory.find(item => 
      item.category === category && 
      item.subCategory === subCategory && 
      item.brandName === brand && 
      item.model === model
    )
    return item ? item.quantityInStock : 0
  }

  const getTotalIssuedQuantity = (category, subCategory, brand, model, currentIndex) => {
    return itemsIssued.reduce((total, item, index) => {
      // Skip the current item being edited
      if (index === currentIndex) return total;
      
      // Only count items that match the category, subcategory, brand, and model
      if (item.category === category && 
          item.subCategory === subCategory && 
          item.brand === brand && 
          item.model === model) {
        return total + (parseInt(item.quantity) || 0);
      }
      return total;
    }, 0);
  }

  const handleQuantityChange = (index, value) => {
    const item = itemsIssued[index]
    const availableQuantity = getAvailableQuantity(
      item.category,
      item.subCategory,
      item.brand,
      item.model
    )
    
    // Get total quantity already issued for this item (excluding current item)
    const alreadyIssuedQuantity = getTotalIssuedQuantity(
      item.category,
      item.subCategory,
      item.brand,
      item.model,
      index
    )
    
    // Calculate remaining available quantity
    const remainingQuantity = availableQuantity - alreadyIssuedQuantity
    
    // Ensure new quantity doesn't exceed remaining available quantity
    const newQuantity = Math.min(parseInt(value) || 0, remainingQuantity)
    
    handleItemChange(index, 'quantity', newQuantity)
  }

  const addItemRow = () => {
    setItemsIssued([...itemsIssued, {}])
  }

  const addElectricityRow = () => {
    setElectricityReadings([...electricityReadings, {}])
  }

  const removeItemRow = (index) => {
    const newItems = [...itemsIssued]
    newItems.splice(index, 1)
    setItemsIssued(newItems)
  }

  const removeElectricityRow = (index) => {
    const newReadings = [...electricityReadings]
    newReadings.splice(index, 1)
    setElectricityReadings(newReadings)
  }

  const handleFormChange = (field, value) => {
    // If selecting phone number or customer name, find and fill the corresponding booking data
    if (field === "mobileNo" || field === "customerName") {
      const selectedBooking = filteredBookings.find(booking => 
        field === "mobileNo" ? booking.mobileNo === value : `${booking.firstName} ${booking.lastName}` === value
      );
      
      if (selectedBooking) {
        setFormData({
          bookingId: selectedBooking.bookingNumber,
          customerName: `${selectedBooking.firstName} ${selectedBooking.lastName}`,
          mobileNo: selectedBooking.mobileNo,
          propertyType: selectedBooking.propertyType,
          eventType: selectedBooking.eventType || '',
          checkInTime: selectedBooking.timeSlot?.fromTime || '',
          notes: formData.notes // Preserve any existing notes
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  }

  const handleElectricityChange = (index, field, value) => {
    const newReadings = [...electricityReadings];
    const reading = { ...newReadings[index] };

    // Update the changed field
    reading[field] = value;

    // Calculate units consumed when start or end reading changes
    if (field === 'startReading' || field === 'endReading') {
      const start = parseFloat(reading.startReading) || 0;
      const end = parseFloat(reading.endReading) || 0;
      reading.unitsConsumed = Math.max(0, end - start).toString();
    }

    // Calculate total when units consumed or cost per unit changes
    if (field === 'unitsConsumed' || field === 'costPerUnit' || field === 'startReading' || field === 'endReading') {
      const units = parseFloat(reading.unitsConsumed) || 0;
      const cost = parseFloat(reading.costPerUnit) || 0;
      reading.total = (units * cost).toString();
    }

    newReadings[index] = reading;
    setElectricityReadings(newReadings);
  };

  const validateForm = () => {
    if (!formData.bookingId) {
      toast.error("Booking ID is required")
      return false
    }
    if (!formData.customerName) {
      toast.error("Customer name is required")
      return false
    }
    if (!formData.mobileNo) {
      toast.error("Mobile number is required")
      return false
    }
    if (!formData.propertyType) {
      toast.error("Property type is required")
      return false
    }
    if (formData.propertyType === "hall" && !formData.eventType) {
      toast.error("Event type is required for hall bookings")
      return false
    }
    if (!formData.checkInTime) {
      toast.error("Check-in time is required")
      return false
    }

    // Validate items issued
    if (itemsIssued.length < 1 || !itemsIssued[0].category) {
      toast.error("At least one item must be issued")
      return false
    }

    for (const item of itemsIssued) {
      if (!item.category || !item.subCategory || !item.brand || !item.model || !item.quantity) {
        toast.error("Please complete all fields for issued items")
        return false
      }
    }

    // Validate electricity readings if any are provided
    if (electricityReadings.length > 0 && electricityReadings[0].type) {
      for (const reading of electricityReadings) {
        if (!reading.type || !reading.startReading || !reading.unitType) {
          toast.error("Please complete all fields for electricity readings")
          return false
        }
      }
    }

    return true
  }

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);

      const grandTotal = (
        (parseFloat(totalAmount) || 0) +
        (electricityReadings.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0)) +
        (parseFloat(totalRecoveryAmount) || 0)
      );

      // Filter out empty items and readings
      const validItems = itemsIssued.filter(item => 
        item.category && 
        item.subCategory && 
        item.brand && 
        item.model && 
        item.quantity
      );
      
      const validReadings = electricityReadings.filter(reading => 
        reading.type && 
        reading.startReading && 
        reading.unitType
      );

      // Format the data to match the schema requirements
      const payload = {
        ...formData,
        dateRange: {
          from: dateRange.from,
          to: dateRange.to
        },
        itemsIssued: validItems.map(item => ({
          category: item.category,
          subCategory: item.subCategory,
          brand: item.brand,
          model: item.model,
          quantity: parseInt(item.quantity) || 1,
          condition: item.condition || 'Good',
          remarks: item.remarks || ''
        })),
        electricityReadings: electricityReadings.filter(r => r.type || r.startReading || r.endReading || r.unitsConsumed || r.unitType || r.costPerUnit || r.total || r.remarks).map(reading => ({
          type: reading.type,
          startReading: parseFloat(reading.startReading) || 0,
          endReading: parseFloat(reading.endReading) || 0,
          unitsConsumed: parseFloat(reading.unitsConsumed) || 0,
          unitType: reading.unitType,
          costPerUnit: parseFloat(reading.costPerUnit) || 0,
          total: parseFloat(reading.total) || 0,
          remarks: reading.remarks || ''
        })),
        damageLossSummary: damageLossSummary.filter(row => row.category || row.subCategory || row.brand || row.model || row.quantity || row.condition || row.remarks).map(row => ({
          category: row.category,
          subCategory: row.subCategory,
          brand: row.brand,
          model: row.model,
          quantity: parseInt(row.quantity) || 0,
          condition: row.condition,
          remarks: row.remarks,
          amount: row.amount !== undefined ? parseFloat(row.amount) || 0 : 0
        })),
        totalAmount: parseFloat(totalAmount) || 0,
        totalRecoveryAmount: parseFloat(totalRecoveryAmount) || 0,
        grandTotal,
        status: isEditMode ? 'Verified' : 'Issued'
      };

      const endpoint = isEditMode ? `/api/logBook/${logId}` : '/api/logBook';
      const method = isEditMode ? 'put' : 'post';
      
      const response = await axios[method](endpoint, payload);

      if (response.data.success) {
        toast.success(isEditMode ? 'Log entry verified successfully' : 'Log entry added successfully');
        router.push('/dashboard/logBook');
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'submitting'} log entry:`, error);
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'add'} log entry`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setItemsIssued([{}])
    setElectricityReadings([{}])
    setTotalAmount("")
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 1),
    })
    setFormData({
      bookingId: "",
      customerName: "",
      mobileNo: "",
      propertyType: "",
      eventType: "",
      checkInTime: "",
      notes: ""
    })
  }

  if (isLoading && isEditMode) {
    return <EditLogFormSkeleton />;
  }

  return (
    <div className="w-full px-4 py-2">
      <div className="p-4  rounded-lg shadow">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-hotel-primary-text font-[500]">
            {isEditMode ? 'Verify Issued Items' : 'Add New Log Entry'}
          </h2>
        </div>

        {/* Form content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date picker */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm text-gray-600">Date Range</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <DatePicker
                    selected={dateRange.from}
                    onChange={(date) => {
                      if (date) {
                        setDateRange(prev => ({
                          ...prev,
                          from: date,
                          to: date > prev.to ? date : prev.to
                        }));
                        filterBookingsByDate();
                      }
                    }}
                    selectsStart
                    startDate={dateRange.from}
                    endDate={dateRange.to}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Start Date"
                    className="w-full rounded-lg border border-gray-300 p-2 pl-10 text-sm focus:border-[#010B13] focus:ring-1 focus:ring-[#010B13] bg-white"
                    wrapperClassName="w-full"
                    calendarClassName="shadow-lg border-gray-300"
                    showPopperArrow={false}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-gray-500">to</span>
                </div>
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <DatePicker
                    selected={dateRange.to}
                    onChange={(date) => {
                      if (date) {
                        setDateRange(prev => ({
                          ...prev,
                          to: date,
                          from: date < prev.from ? date : prev.from
                        }));
                        filterBookingsByDate();
                      }
                    }}
                    selectsEnd
                    startDate={dateRange.from}
                    endDate={dateRange.to}
                    minDate={dateRange.from}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="End Date"
                    className="w-full rounded-lg border border-gray-300 p-2 pl-10 text-sm focus:border-[#010B13] focus:ring-1 focus:ring-[#010B13] bg-white"
                    wrapperClassName="w-full"
                    calendarClassName="shadow-lg border-gray-300"
                    showPopperArrow={false}
                  />
                </div>
              </div>
              {/* Date range summary */}
              <div className="text-xs text-gray-500 mt-1">
                {dateRange.from && dateRange.to && (
                  <span>
                    Selected period: {Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24))} day(s)
                  </span>
                )}
              </div>
            </div>

            {/* Booking Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Booking ID */}
              <div className="space-y-2">
                <label htmlFor="bookingId" className="text-sm text-gray-600">Booking Id</label>
                <Select 
                  value={formData.bookingId}
                  onValueChange={(value) => handleBookingSelect(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredBookings.length === 0 ? "No bookings available for selected dates" : "Select Booking"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBookings.map((booking) => (
                      <SelectItem key={booking.bookingNumber} value={booking.bookingNumber}>
                        {`${booking.bookingNumber} - ${booking.firstName} ${booking.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredBookings.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Please select a date range to view available bookings</p>
                )}
              </div>

              {/* Phone Number Selection */}
              <div className="space-y-2">
                <label htmlFor="initialPhoneSelect" className="text-sm text-gray-600">Select by Phone Number</label>
                <Select
                  value={formData.bookingId}
                  onValueChange={(value) => handleBookingSelect(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredBookings.length === 0 ? "No bookings available" : "Select by Phone"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBookings.map((booking) => (
                      <SelectItem key={booking.bookingNumber} value={booking.bookingNumber}>
                        {`${booking.mobileNo} - ${booking.firstName} ${booking.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm text-gray-600">Customer Name</label>
              <Select
                value={formData.customerName}
                onValueChange={(value) => handleFormChange("customerName", value)}
                disabled={!formData.bookingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Customer" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBookings
                    .filter(booking => !formData.bookingId || booking.bookingNumber === formData.bookingId)
                    .map(booking => (
                      <SelectItem key={booking.bookingNumber} value={`${booking.firstName} ${booking.lastName}`}>
                        {`${booking.firstName} ${booking.lastName}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm text-gray-600">Phone Number</label>
              <Select
                value={formData.mobileNo}
                onValueChange={(value) => handleFormChange("mobileNo", value)}
                disabled={!formData.bookingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Phone Number" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBookings
                    .filter(booking => !formData.bookingId || booking.bookingNumber === formData.bookingId)
                    .map(booking => (
                      <SelectItem key={booking.bookingNumber} value={booking.mobileNo}>
                        {booking.mobileNo}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label htmlFor="propertyType" className="text-sm text-gray-600">Property Type</label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => handleFormChange("propertyType", value)}
                disabled={!formData.bookingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBookings
                    .filter(booking => !formData.bookingId || booking.bookingNumber === formData.bookingId)
                    .map(booking => (
                      <SelectItem key={booking.bookingNumber} value={booking.propertyType}>
                        {booking.propertyType === 'hall' ? 'Hall' : 'Room'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Check-in Time */}
            <div className="space-y-2">
              <label htmlFor="checkInTime" className="text-sm text-gray-600">Check-in Time</label>
              <Select
                value={formData.checkInTime}
                onValueChange={(value) => handleFormChange("checkInTime", value)}
                disabled={!formData.bookingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBookings
                    .filter(booking => !formData.bookingId || booking.bookingNumber === formData.bookingId)
                    .map(booking => {
                      const time = booking.timeSlot?.fromTime || 
                        new Date(booking.checkInDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                      return (
                        <SelectItem key={booking.bookingNumber} value={time}>
                          {new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label htmlFor="eventType" className="text-sm text-gray-600">Event Type</label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => handleFormChange("eventType", value)}
                disabled={!formData.bookingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBookings
                    .filter(booking => !formData.bookingId || booking.bookingNumber === formData.bookingId)
                    .filter(booking => booking.eventType)
                    .map(booking => (
                      <SelectItem key={booking.bookingNumber} value={booking.eventType}>
                        {booking.eventType}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm text-gray-600">Notes</label>
              <Textarea 
                id="notes" 
                className="min-h-[80px]" 
                placeholder="Enter notes" 
                value={formData.notes}
                onChange={(e) => handleFormChange("notes", e.target.value)}
              />
            </div>
          </div>

          {/* Items Issued/Returned Section */}
          <div className="border-t border-dashed pt-6 mb-8">
            <h2 className="text-hotel-primary-text font-semibold text-lg mb-4">{isEditMode ? 'Items Returned' : 'Items Issued'}</h2>
            
            <Table aria-label="Items issued table">
              <TableHeader>
                <TableColumn>Category</TableColumn>
                <TableColumn>Sub Category</TableColumn>
                <TableColumn>Brand</TableColumn>
                <TableColumn>Model</TableColumn>
                <TableColumn>Quantity</TableColumn>
                <TableColumn>Condition</TableColumn>
                <TableColumn>Remarks</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {itemsIssued.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.category}
                        onValueChange={(value) => handleItemChange(index, 'category', value)}
                      >
                      <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.subCategory}
                        onValueChange={(value) => handleItemChange(index, 'subCategory', value)}
                        disabled={!item.category}
                      >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Sub Category" />
                      </SelectTrigger>
                      <SelectContent>
                          {getFilteredSubCategories(item.category).map((subCategory) => (
                            <SelectItem key={subCategory} value={subCategory}>
                              {subCategory}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.brand}
                        onValueChange={(value) => handleItemChange(index, 'brand', value)}
                        disabled={!item.category || !item.subCategory}
                      >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Brand" />
                      </SelectTrigger>
                      <SelectContent>
                          {getFilteredBrands(item.category, item.subCategory).map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.model}
                        onValueChange={(value) => handleItemChange(index, 'model', value)}
                        disabled={!item.category || !item.subCategory || !item.brand}
                      >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent>
                          {getFilteredModels(item.category, item.subCategory, item.brand).map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="text-xs h-9"
                        placeholder={item.category && item.subCategory && item.brand && item.model 
                          ? `${getAvailableQuantity(item.category, item.subCategory, item.brand, item.model)}`
                          : "Enter quantity"}
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        max={getAvailableQuantity(item.category, item.subCategory, item.brand, item.model)}
                        min="1"
                        disabled={!item.category || !item.subCategory || !item.brand || !item.model}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.condition}
                        onValueChange={(value) => handleItemChange(index, 'condition', value)}
                      >
                      <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Select Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        className="text-xs"
                        placeholder="Remarks"
                        value={item.remarks || ''}
                        onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                    <Buttons
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemRow(index)}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Buttons>
                    </TableCell>
                  </TableRow>
              ))}
              </TableBody>
            </Table>

              {/* Add Item button and Totals */}
              <div className="flex items-center mt-2">
                <Buttons variant="ghost" size="sm" className="gap-1" onClick={addItemRow}>
                  <Plus className="h-4 w-4" />
                </Buttons>

              <div className="ml-auto flex flex-col sm:flex-row gap-2 sm:gap-4 items-end">
                {/* Total Items */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Total Items</span>
                  <span className="text-lg font-bold text-hotel-primary-text">{itemsIssued.length.toString().padStart(2, '0')}</span>
                </div>
                {/* Total Amount */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Total Amount</span>
                  <div className="flex items-center gap-1 mt-1 w-full">
                    <span className="text-base text-gray-500">₹</span>
                    <Input
                      type="number"
                      min="0"
                      // step="0.01"
                      className="h-8 text-sm text-right bg-transparent border-0 focus:ring-0 focus-visible:ring-0"
                      placeholder="00.00"
                      value={totalAmount}
                      onChange={e => setTotalAmount(e.target.value)}
                      style={{ maxWidth: 80, textAlign: "right" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Electricity/Generator Section - always visible */}
          <div className="border-t border-dashed pt-6 mb-8">
            <h2 className="text-hotel-primary-text font-semibold text-lg mb-4">Electricity / Generator</h2>
            
            <Table aria-label="Electricity readings table">
              <TableHeader>
                <TableColumn>Type</TableColumn>
                <TableColumn>Start Reading</TableColumn>
                <TableColumn>End Reading</TableColumn>
                <TableColumn>Unit Type</TableColumn>
                <TableColumn>Units Consumed</TableColumn>
                <TableColumn>Cost/Unit</TableColumn>
                <TableColumn>Total</TableColumn>
                <TableColumn>Remarks</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {electricityReadings.map((reading, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={reading.type || ''}
                        onValueChange={(value) => handleElectricityChange(index, 'type', value)}
                      >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                          {electricityTypes.map((type) => (
                            <SelectItem key={type._id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter the Reading" 
                        className="h-9 text-xs"
                        value={reading.startReading || ''}
                        onChange={(e) => handleElectricityChange(index, 'startReading', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        placeholder="Enter End Reading" 
                        className="h-9 text-xs"
                        value={reading.endReading || ''}
                        onChange={(e) => handleElectricityChange(index, 'endReading', e.target.value)}
                        disabled={!isEditMode}
                        style={!isEditMode ? { background: '#f9f9f9' } : {}}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter the unit type (Eg: kWh, Hours)" 
                        className="h-9 text-xs"
                        value={reading.unitType || ''}
                        onChange={(e) => handleElectricityChange(index, 'unitType', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter Units Consumed" 
                        className="h-9 text-xs"
                        value={reading.unitsConsumed || ''}
                        onChange={(e) => handleElectricityChange(index, 'unitsConsumed', e.target.value)}
                        disabled={!isEditMode}
                        style={!isEditMode ? { background: '#f9f9f9' } : {}}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        placeholder="Enter Cost/Unit" 
                        className="h-9 text-xs"
                        value={reading.costPerUnit || ''}
                        onChange={(e) => handleElectricityChange(index, 'costPerUnit', e.target.value)}
                        disabled={!isEditMode}
                        style={!isEditMode ? { background: '#f9f9f9' } : {}}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter Total" 
                        className="h-9 text-xs"
                        value={reading.total || ''}
                        onChange={(e) => handleElectricityChange(index, 'total', e.target.value)}
                        disabled={!isEditMode}
                        style={!isEditMode ? { background: '#f9f9f9' } : {}}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        placeholder="Enter Remarks" 
                        className="h-9 text-xs"
                        value={reading.remarks || ''}
                        onChange={(e) => handleElectricityChange(index, 'remarks', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                    <Buttons
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-red-500"
                      onClick={() => removeElectricityRow(index)}
                    >
                      <X className="h-5 w-5" />
                    </Buttons>
                    </TableCell>
                  </TableRow>
              ))}
              </TableBody>
            </Table>

              <div className="flex items-center mt-2">
                <Buttons variant="ghost" size="sm" className="gap-1" onClick={addElectricityRow}>
                  <Plus className="h-4 w-4" />
                </Buttons>
            </div>
            <div className="flex justify-end mt-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
                <span className="text-xs text-gray-500 font-medium">Total Amount</span>
                <span className="text-lg font-bold text-hotel-primary-text">₹{electricityTotalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Only show these sections in edit/verify mode */}
          {isEditMode && <>
            {/* Damage/Loss Summary Section */}
            <div className="border-t border-dashed pt-6 mb-8">
              <h2 className="text-hotel-primary-text font-semibold text-lg mb-4">Damage/ Loss Summary:</h2>
              <DamageLossSummary
                damageLossSummary={damageLossSummary}
                setDamageLossSummary={setDamageLossSummary}
                categories={categories}
                subCategories={subCategories}
                brands={brands}
                models={models}
                inventory={inventory} // Add this prop
              />
              <div className="flex justify-end gap-8 mt-2">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[90px] shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Total Items</span>
                  <span className="text-lg font-bold text-hotel-primary-text">{damageLossTotalItems}</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-col items-end min-w-[120px] shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Total Amount</span>
                  <input
                    type="number"
                    min="0"
                    className="h-8 text-sm text-right bg-transparent border-0 focus:ring-0 focus-visible:ring-0 max-w-[100px] font-bold"
                    placeholder="0.00"
                    value={totalRecoveryAmount}
                    onChange={e => handleDamageLossTotalAmountChange(e.target.value)}
                    style={{ textAlign: "right" }}
                  />
                </div>
              </div>
            </div>

            {/* Grand Total Summary Section */}
            <div className="border-t border-dashed pt-6 mb-8">
              <GrandTotalSummary
                totalAmount={totalAmount}
                currentBill={electricityTotalAmount}
                damageLossSummary={damageLossSummary}
                totalRecoveryAmount={totalRecoveryAmount}
                setTotalRecoveryAmount={setTotalRecoveryAmount}
              />
            </div>
          </>}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8 border-t border-dashed pt-6">
            <Buttons 
              className="min-w-[120px] bg-hotel-primary text-hotel-primary-text"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isEditMode ? 'Verified' : isSubmitting ? 'Saving...' : 'Save'}
            </Buttons>
            <Buttons 
              variant="bordered" 
              className="min-w-[120px]"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Cancel
            </Buttons>
          </div>
        </div>
      </div>
    </div>
  )
}