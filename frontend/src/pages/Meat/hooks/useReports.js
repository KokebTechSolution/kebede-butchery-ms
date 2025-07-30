import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';

export const useReports = (filterDate) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async (date) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`reports/dashboard-report/?date=${date}`);
      setReports(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterDate) {
      fetchReports(filterDate);
    }
  }, [filterDate]);

  return {
    reports,
    loading,
    fetchReports
  };
};

export const useFoodReports = (filterDate) => {
  const [foodReports, setFoodReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFoodReports = async (date) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`reports/food-dashboard-report/?date=${date}`);
      setFoodReports(res.data);
    } catch (error) {
      console.error("Error fetching food reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filterDate) {
      fetchFoodReports(filterDate);
    }
  }, [filterDate]);

  return {
    foodReports,
    loading,
    fetchFoodReports
  };
};