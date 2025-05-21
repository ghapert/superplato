import React, { useEffect, useState } from 'react';
import { secureFetchJson } from '../api/auth';
import AttendanceForm from '../components/AttendanceForm';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const data = await secureFetchJson(`${baseUrl}/api/attendance/status`);
        setAttendanceData(data);
      } catch (err) {
        setError('Failed to fetch attendance data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  if (loading) {
    return (
      <div className="page-bg">
        <div className="attendance-card attendance-loading">
          Loading attendance information...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-bg">
        <div className="attendance-card attendance-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div className="attendance-card">
        <h1 className="attendance-title">Attendance Information</h1>
        {attendanceData.can_attend ? (
          <AttendanceForm />
        ) : (
          <div className="attendance-status-msg">{attendanceData.message}</div>
        )}
      </div>
    </div>
  );
};

export default Attendance;