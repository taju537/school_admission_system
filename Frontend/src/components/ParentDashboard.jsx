import React, { useState } from 'react';
import { StudentIdBar } from './StudentIdBar';
import { MyApplications } from './MyApplications';
import { ClassList } from './ClassList';
import { HoldLookup } from './HoldLookup';
import { useClassesPolling } from '../hooks/useClassesPolling';

export function ParentDashboard() {
  const { classes, loading, refreshing, refresh } = useClassesPolling(4000);
  const [existingHolds, setExistingHolds] = useState([]);
  const [myApplicationsRefreshTrigger, setMyApplicationsRefreshTrigger] = useState(0);

  const handleHoldCreated = () => {
    // Refresh both classes and my applications
    refresh();
    setMyApplicationsRefreshTrigger((prev) => prev + 1);
  };

  const handleHoldsUpdated = (holdsList) => {
    setExistingHolds(holdsList);
  };

  return (
    <div className="dashboard-content parent-dashboard">
      {/* 1. Student ID Header Section */}
      <StudentIdBar onIdChanged={() => setMyApplicationsRefreshTrigger((prev) => prev + 1)} />

      {/* 2. My Applications Section (Active holds with countdown & past applications) */}
      <MyApplications
        key={myApplicationsRefreshTrigger}
        onHoldsUpdated={handleHoldsUpdated}
      />

      {/* 3. Class List Section (Seat availability & Apply button) */}
      <ClassList
        classes={classes}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onHoldCreated={handleHoldCreated}
        existingHolds={existingHolds}
      />

      {/* 4. Direct Hold Lookup Tool (For API checking) */}
      <HoldLookup />
    </div>
  );
}
