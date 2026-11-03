import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import StudentsTable from './students/StudentsTable';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { logout } from '../features/auth/redux';
import StaffPage from './staff/StaffPage';
import GalleryPage from './gallery/GalleryPage';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Balvatika Dashboard
          </Typography>
          <Typography sx={{ mr: 2 }}>{user?.firstName}</Typography>
          <Button color="inherit" onClick={() => dispatch(logout())}>Sign out</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography component="h1" variant="h3" gutterBottom>
          Dashboard
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(_, value: number) => setActiveTab(value)}
          aria-label="Dashboard sections"
          sx={{ mb: 3 }}
        >
          <Tab label="Students" />
          <Tab label="Staff" />
          <Tab label="Gallery" />
        </Tabs>

        {activeTab === 0 && <StudentsTable />}

        {activeTab === 1 && <StaffPage />}
        {activeTab === 2 && <GalleryPage />}
      </Container>

    </Box>
  );
};

export default DashboardPage;
import { useState } from 'react';
