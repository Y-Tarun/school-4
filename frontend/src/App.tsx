import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import StudentProfile from './components/students/StudentProfile';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './app/ProtectedRoute';
import { useEffect } from 'react';
import { useAppDispatch } from './redux/hooks';
import { initializeAuth } from './features/auth/redux';
import StaffPage from './components/staff/StaffPage';
import StudentFees from './components/fees/StudentFees';
import GalleryPage from './components/gallery/GalleryPage';

const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students/:studentId" element={<StudentProfile />} />
          <Route path="/students/:studentId/fees" element={<StudentFees />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
