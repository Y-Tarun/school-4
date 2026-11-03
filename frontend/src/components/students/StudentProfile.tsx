import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import httpClient from '../../utility/httpClient';
import type { Student } from './data';

const StudentProfile = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    httpClient.get<Student>(`/students/${studentId}`)
      .then(setStudent)
      .catch((requestError: unknown) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load student.');
      });
  }, [studentId]);

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Balvatika Dashboard</Typography>
          <Button component={Link} to="/dashboard" color="inherit">Dashboard</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button component={Link} to="/dashboard" sx={{ mb: 3 }}>Back to Dashboard</Button>
        {error ? <Typography role="alert" color="error">{error}</Typography> : student ? (
          <Card>
            <CardContent>
              <Typography component="h1" variant="h4" gutterBottom>{student.name}</Typography>
              <Typography><strong>Class:</strong> {student.className || 'Not assigned'}</Typography>
              <Typography><strong>Section:</strong> {student.section || 'Not assigned'}</Typography>
              <Typography><strong>Father:</strong> {student.fatherName || 'Not provided'}</Typography>
              <Typography><strong>Contact:</strong> {student.contactNumber || 'Not provided'}</Typography>
              <Button component={Link} to={`/students/${student.id}/fees`} sx={{ mt: 2 }}>
                View fee records
              </Button>
            </CardContent>
          </Card>
        ) : <Typography>Loading student...</Typography>}
      </Container>
    </Box>
  );
};

export default StudentProfile;
