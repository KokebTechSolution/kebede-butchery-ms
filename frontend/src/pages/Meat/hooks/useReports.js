import { useState, useEffect } from 'react';
import axios from 'axios';

export const useReports = (date) => {
  const [reportData, setReportData] = useState({
    totalSold: 0,
    totalRejected: 0,
    yesterdayTotalSold: 0,
    yesterdayTotalRejected: 0,
    dailySales: [],
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`/api/reports/dashboard-report/?date=${date}`);
        setReportData({
          totalSold: res.data.totalSold || 0,
          totalRejected: res.data.totalRejected || 0,
          yesterdayTotalSold: res.data.yesterdayTotalSold || 0,
          yesterdayTotalRejected: res.data.yesterdayTotalRejected || 0,
          dailySales: res.data.dailySales || [],
        });
      } catch (err) {
        setReportData({
          totalSold: 0,
          totalRejected: 0,
          yesterdayTotalSold: 0,
          yesterdayTotalRejected: 0,
          dailySales: [],
        });
      }
    };
    if (date) fetchReport();
  }, [date]);

  return { reportData };
};

export const useFoodReports = (date) => {
  const [reportData, setReportData] = useState({
    totalSold: 0,
    totalRejected: 0,
    yesterdayTotalSold: 0,
    yesterdayTotalRejected: 0,
    dailySales: [],
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`/api/reports/food-dashboard-report/?date=${date}`);
        setReportData({
          totalSold: res.data.totalSold || 0,
          totalRejected: res.data.totalRejected || 0,
          yesterdayTotalSold: res.data.yesterdayTotalSold || 0,
          yesterdayTotalRejected: res.data.yesterdayTotalRejected || 0,
          dailySales: res.data.dailySales || [],
        });
      } catch (err) {
        setReportData({
          totalSold: 0,
          totalRejected: 0,
          yesterdayTotalSold: 0,
          yesterdayTotalRejected: 0,
          dailySales: [],
        });
      }
    };
    if (date) fetchReport();
  }, [date]);

  return { reportData };
};