import { Navigate, Outlet } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useAppSelector } from '../redux/hooks';

const ProtectedRoute = () => {
  const { user, isInitialized } = useAppSelector((state) => state.auth);

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress aria-label="Checking authentication" />
      </Box>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
