import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from '../pages/Home';
import ManageLectures from '../pages/ManageLectures';
import Attendance from '../pages/Attendance';
import AccountEdit from '../pages/AccountEdit';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AttendanceDetail from '../pages/AttendanceDetail';
import Onboarding from '../pages/Onboarding';
import BruteAttendOptions from '../pages/BruteAttendOptions';
import AdminProKeys from '../pages/AdminProKeys';
import ProKeyVerify from '../pages/ProKeyVerify';
import ProAd from '../pages/ProAd';
import AttendanceLogs from '../pages/AttendanceLogs';
import Terms from '../pages/Terms';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import BugReport from '../pages/BugReport';
import AssignmentReview from '../pages/AssignmentReview';
import AdminUsers from '../pages/AdminUsers';
import AdminUserRunners from '../pages/AdminUserRunners';
import AdminDashboard from '../pages/AdminDashboard';
import AdminLectureDetail from '../pages/AdminLectureDetail';
import NotFound from '../pages/NotFound';
import Forbidden from '../pages/Forbidden';

const RedirectOnboarding = ({ onboarding }) => {
  const location = useLocation();
  // /privacy, /terms는 예외로 허용
  if (
    onboarding &&
    location.pathname !== '/onboarding' &&
    location.pathname !== '/privacy' &&
    location.pathname !== '/terms'
  ) {
    return <Navigate to="/onboarding" replace />;
  }
  return null;
};

const AppRouter = ({ isLoggedIn, onboarding, isAdmin, isPro }) => {
  // userStatus가 결정되기 전에는 아무것도 렌더링하지 않음
  if (
    isLoggedIn === undefined ||
    onboarding === undefined ||
    isAdmin === undefined ||
    isPro === undefined
  ) {
    return null;
  }

  // 새로고침 없이 진입 시, react-router의 <Router>가 먼저 마운트되고
  // App에서 userStatus 등 비동기 상태가 결정되기 전까지는
  // isLoggedIn 등이 false로 평가되어 라우트가 등록되지 않음 → 화면이 안 보임
  // 해결: <Router> 바깥에서 조건 체크하지 말고, App에서 userStatus === undefined일 때 전체 AppRouter 렌더링 자체를 막아야 함

  // PrivacyPolicy, Terms 경로에서는 Footer를 렌더링하지 않도록 처리
  const location = window.location; // useLocation은 Router 내부에서만 사용 가능하므로 window.location 사용

  const hideFooter =
    location.pathname === "/privacy" || location.pathname === "/terms";

  return (
    <Router>
      <RedirectOnboarding onboarding={onboarding} />
      {isLoggedIn && !onboarding && <Navbar isAdmin={isAdmin} isPro={isPro} />}
      <Routes>
        <Route path="/" element={<Home isPro={isPro} />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/lectures/manage"
          element={isLoggedIn && !onboarding ? <ManageLectures /> : <Navigate to="/" replace />}
        />
        <Route
          path="/attendance"
          element={isLoggedIn && !onboarding ? <Attendance /> : <Navigate to="/" replace />}
        />
        <Route
          path="/attendance/:courseId"
          element={isLoggedIn && !onboarding ? <AttendanceDetail /> : <Navigate to="/" replace />}
        />
        <Route
          path="/attendance/logs"
          element={isLoggedIn && !onboarding ? <AttendanceLogs /> : <Navigate to="/" replace />}
        />
        <Route
          path="/account/edit"
          element={isLoggedIn && !onboarding ? <AccountEdit /> : <Navigate to="/" replace />}
        />
        <Route
          path="/brute-attend-options"
          element={
            isLoggedIn && !onboarding && isPro
              ? <BruteAttendOptions />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/prokey/verify"
          element={
            isLoggedIn && !onboarding && !isPro
              ? <ProKeyVerify />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/pro-ad"
          element={
            isLoggedIn && !onboarding && !isPro
              ? <ProAd />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            isLoggedIn && !onboarding && isAdmin
              ? <AdminDashboard />
              : null
          }
        />
        <Route
          path="/admin/prokeys"
          element={
            isLoggedIn && !onboarding && isAdmin
              ? <AdminProKeys />
              : null
          }
        />
        <Route
          path="/admin/users"
          element={
            isLoggedIn && !onboarding && isAdmin
              ? <AdminUsers />
              : null
          }
        />
        <Route
          path="/admin/user-runners"
          element={
            isLoggedIn && !onboarding && isAdmin
              ? <AdminUserRunners />
              : null
          }
        />
        <Route
          path="/admin/lecture/:lectureId"
          element={
            isLoggedIn && !onboarding && isAdmin
              ? <AdminLectureDetail />
              : null
          }
        />
        <Route
          path="/admin/lecture"
          element={
            isLoggedIn && !onboarding && isAdmin
              ? <AdminLectureDetail />
              : null
          }
        />
        <Route
          path="/assignment/review"
          element={
            isLoggedIn && !onboarding && isPro
              ? <AssignmentReview />
              : <Navigate to="/" replace />
          }
        />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/bug-report" element={<BugReport />} />
        <Route path="/forbidden" element={<Forbidden />} />
        {/* onboarding 상태에서도 /privacy, /terms는 예외로 허용 */}
        {onboarding && (
          <>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>
        )}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideFooter && <Footer />}
    </Router>
  );
};

export default AppRouter;