"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Buttons } from "@/Components/ui/button"
import { usePagePermission } from "@/hooks/usePagePermission"
import { AlertCircle, ArrowLeft, LogIn } from "lucide-react"
import { motion } from "framer-motion"

const UnauthorizedPage = () => {
  const router = useRouter()
  const [firstAccessiblePage, setFirstAccessiblePage] = useState<string | null>(null)

  const pages = useMemo(() => [
    { path: "/dashboard", permission: "Dashboard" },
    { path: "/dashboard/calendar-view", permission: "CalendarView" },
    { path: "/dashboard/bookings", permission: "bookings" },
    { path: "/dashboard/rooms", permission: "Rooms" },
    { path: "/dashboard/logBook", permission: "LogBook" },
    { path: "/dashboard/inventory", permission: "Inventory" },
    { path: "/dashboard/employees", permission: "Employees" },
    { path: "/dashboard/employees/roles-responsibility", permission: "Employees/roles-responsibility" },
    { path: "/dashboard/financials/invoices", permission: "financials/Invoices" },
    { path: "/dashboard/financials/expenses", permission: "financials/Expenses" },
    { path: "/dashboard/financials/Bank", permission: "financials/Bank" },
    { path: "/dashboard/financials/ledger-book", permission: "financials/LedgerBook" },
    { path: "/dashboard/contacts/guest", permission: "contacts/guest" },
    { path: "/dashboard/crm", permission: "crm" },
    { path: "/dashboard/web-settings", permission: "web-settings" },
    /* { path: "/dashboard/crm/add-contact", permission: "crm/add-contact" }, */
    
/*     { path: "/dashboard/financials", permission: "financials" }, */
    
  ], [])

  const permissions = pages.map((_, index) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePagePermission(pages[index].permission)
  })

  useEffect(() => {
    Promise.all(permissions).then((results) => {
      for (let i = 0; i < results.length; i++) {
        if (results[i]) {
          setFirstAccessiblePage(pages[i].path)
          break
        }
      }
    })
  }, [permissions, pages])

  const handleGoBack = () => {
    router.push("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center p-8 bg-white dark:bg-gray-800 shadow-2xl rounded-xl max-w-lg w-full mx-4 transform transition-all hover:shadow-3xl"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="mb-6 flex justify-center"
        >
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">403 Unauthorized</h1>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an
          error.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Buttons
            onClick={handleGoBack}
            variant="outline"
            className="w-full sm:w-auto px-6 py-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Buttons>

          {firstAccessiblePage && (
            <Link href={firstAccessiblePage} passHref>
              <Buttons className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                <LogIn className="mr-2 h-4 w-4" />
                Accessible Page
              </Buttons>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default UnauthorizedPage

