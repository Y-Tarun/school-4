import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import httpClient from '../../utility/httpClient';
import RoleGate from '../../app/RoleGate';

interface GalleryItem {
  id: string;
  title: string;
  description?: string | null;
  photoReference: string;
}

const GalleryPage = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState({ title: '', description: '', photoReference: '' });
  const [error, setError] = useState('');

  const loadGallery = () => {
    httpClient.get<GalleryItem[]>('/gallery')
      .then(setItems)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : 'Unable to load gallery.'));
  };

  useEffect(loadGallery, []);

  const addItem = async () => {
    try {
      await httpClient.post('/gallery', form);
      setForm({ title: '', description: '', photoReference: '' });
      loadGallery();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add gallery item.');
    }
  };

  const selectPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photoReference: String(reader.result) }));
    reader.onerror = () => setError('Unable to read the selected image.');
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>School gallery</Typography>
      {error && <Typography color="error" role="alert">{error}</Typography>}
      <RoleGate permissions={['gallery:write']}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField label="Title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} size="small" />
          <TextField label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} size="small" />
          <Button component="label" variant="outlined">
            Choose photo
            <input hidden type="file" accept="image/*" onChange={(event) => selectPhoto(event.target.files?.[0])} />
          </Button>
          <Button variant="contained" onClick={addItem}>Add photo</Button>
        </Box>
      </RoleGate>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {items.map((item) => <Card key={item.id} sx={{ width: 260 }}><CardContent><Typography variant="h6">{item.title}</Typography><Typography>{item.description}</Typography><Typography color="text.secondary" sx={{ wordBreak: 'break-word' }}>{item.photoReference}</Typography></CardContent></Card>)}
      </Box>
      {!items.length && <Typography color="text.secondary">No gallery items found.</Typography>}
    </Box>
  );
};

export default GalleryPage;
