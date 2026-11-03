import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import httpClient from '../../utility/httpClient';
import RoleGate from '../../app/RoleGate';

interface StaffMember {
  id: string;
  staffNumber: string;
  firstName: string;
  lastName?: string | null;
  role: string;
  contactNumber?: string | null;
}

const StaffPage = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ staffNumber: '', firstName: '', lastName: '', role: 'teacher', contactNumber: '' });

  const loadStaff = () => {
    setLoading(true);
    httpClient.get<StaffMember[]>('/staff')
      .then(setStaff)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load staff.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    httpClient.get<StaffMember[]>('/staff')
      .then((data) => {
        if (active) setStaff(data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load staff.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createStaff = async () => {
    try {
      await httpClient.post('/staff', form);
      setFormOpen(false);
      setForm({ staffNumber: '', firstName: '', lastName: '', role: 'teacher', contactNumber: '' });
      loadStaff();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create staff member.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Staff</Typography>
        <RoleGate permissions={['staff:write']}>
          <Button variant="contained" onClick={() => setFormOpen((open) => !open)}>Add staff</Button>
        </RoleGate>
      </Box>
      {formOpen && (
        <Paper sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, mb: 2 }}>
          {Object.entries(form).map(([field, value]) => (
            <TextField key={field} label={field} value={value} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} size="small" />
          ))}
          <Button onClick={createStaff}>Save</Button>
        </Paper>
      )}
      {error && <Typography color="error" role="alert">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table aria-label="Staff table">
          <TableHead><TableRow><TableCell>Staff number</TableCell><TableCell>Name</TableCell><TableCell>Role</TableCell><TableCell>Contact</TableCell></TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4}>Loading staff...</TableCell></TableRow> :
              staff.length === 0 ? <TableRow><TableCell colSpan={4}>No staff found.</TableCell></TableRow> :
                staff.map((member) => <TableRow key={member.id}><TableCell>{member.staffNumber}</TableCell><TableCell>{member.firstName} {member.lastName}</TableCell><TableCell>{member.role}</TableCell><TableCell>{member.contactNumber || '-'}</TableCell></TableRow>)}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StaffPage;
