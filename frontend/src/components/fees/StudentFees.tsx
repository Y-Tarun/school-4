import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import httpClient from '../../utility/httpClient';
import RoleGate from '../../app/RoleGate';

interface FeePayment {
  id: string;
  amount: number;
  paidOn: string;
  reference?: string | null;
  notes?: string | null;
}

const StudentFees = () => {
  const { studentId } = useParams();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [form, setForm] = useState({ academicYearId: '', amount: '', paidOn: '', reference: '', notes: '' });
  const [error, setError] = useState('');

  const loadPayments = () => {
    if (!studentId) return;
    httpClient.get<FeePayment[]>(`/students/${studentId}/fee-payments`)
      .then(setPayments)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load fee records.'));
  };

  useEffect(loadPayments, [studentId]);

  const addPayment = async () => {
    try {
      await httpClient.post(`/students/${studentId}/fee-payments`, { ...form, amount: Number(form.amount) });
      setForm({ academicYearId: '', amount: '', paidOn: '', reference: '', notes: '' });
      loadPayments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save fee record.');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Fee records</Typography>
      {error && <Typography color="error" role="alert">{error}</Typography>}
      <RoleGate permissions={['fees:write']}>
        <Paper sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, mb: 3 }}>
          {Object.entries(form).map(([field, value]) => (
            <TextField key={field} label={field} type={field === 'amount' ? 'number' : field === 'paidOn' ? 'date' : 'text'} value={value} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} size="small" slotProps={field === 'paidOn' ? { inputLabel: { shrink: true } } : undefined} />
          ))}
          <Button variant="contained" onClick={addPayment}>Record fee</Button>
        </Paper>
      </RoleGate>
      {payments.map((payment) => (
        <Paper key={payment.id} sx={{ p: 2, mb: 1 }}>
          <Typography><strong>{payment.amount}</strong> paid on {payment.paidOn}</Typography>
          {payment.reference && <Typography color="text.secondary">Reference: {payment.reference}</Typography>}
          {payment.notes && <Typography color="text.secondary">{payment.notes}</Typography>}
        </Paper>
      ))}
      {!payments.length && <Typography color="text.secondary">No fee records found.</Typography>}
    </Box>
  );
};

export default StudentFees;
