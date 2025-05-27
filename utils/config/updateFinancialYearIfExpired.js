export async function updateFinancialYearIfExpired(financeSettings, forceUpdate = false) {
  // Skip if manual control is enabled and not forcing update
  if (!forceUpdate && financeSettings.manualYearControl) {
    return financeSettings;
  }

  // Skip automatic update if forceUpdate is false
  if (!forceUpdate) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const activeYear = financeSettings.financialYearHistory.find(y => y.isActive);
    
    // Only auto-update if no active year exists or current year has expired
    if (!activeYear || currentDate > new Date(activeYear.endDate)) {
      // Calculate new financial year dates based on current settings pattern
      const oldStartDate = new Date(financeSettings.financialYear.startDate);
      const yearDiff = currentDate.getFullYear() - oldStartDate.getFullYear();
      
      const newStartDate = new Date(
        currentDate.getFullYear(),
        oldStartDate.getMonth(),
        oldStartDate.getDate()
      );
      const newEndDate = new Date(
        currentDate.getFullYear() + 1,
        oldStartDate.getMonth(),
        oldStartDate.getDate()
      );

      // Deactivate current active year
      if (activeYear) {
        activeYear.isActive = false;
      }

      // Get or create new year record
      const newYearRecord = financeSettings.getFinancialYearSequence(newStartDate, newEndDate);
      newYearRecord.isActive = true;

      // Update current financial year
      financeSettings.financialYear = {
        startDate: newStartDate,
        endDate: newEndDate,
      };

      await financeSettings.save();
    }
  }

  return financeSettings;
}
