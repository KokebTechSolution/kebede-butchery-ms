import { useState } from 'react';

const mockReportData = {
  totalSold: 45,
  totalRejected: 8,
  yesterdayTotalSold: 38,
  yesterdayTotalRejected: 12,
  dailySales: [
    { date: '2025-01-01', sold: 32, rejected: 5 },
    { date: '2025-01-02', sold: 28, rejected: 8 },
    { date: '2025-01-03', sold: 35, rejected: 6 },
    { date: '2025-01-04', sold: 42, rejected: 4 },
    { date: '2025-01-05', sold: 38, rejected: 12 },
    { date: '2025-01-06', sold: 45, rejected: 8 },
  ]
};

export const useReports = () => {
  const [reportData] = useState(mockReportData);

  return {
    reportData
  };
};