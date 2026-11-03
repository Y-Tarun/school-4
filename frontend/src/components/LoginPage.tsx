import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { login } from '../features/auth/redux';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    const destination = (location.state as { from?: string } | null)?.from || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 4 }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Sign in to Balvatika
        </Typography>
        <TextField
          required
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          required
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          sx={{ mb: 2 }}
        />
        {error && (
          <Typography role="alert" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Button type="submit" variant="contained" disabled={isLoading} fullWidth>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Paper>
    </Container>
  );
};

export default LoginPage;
