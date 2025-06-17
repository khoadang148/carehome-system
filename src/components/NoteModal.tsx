import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Stack } from '@mui/material';

interface NoteModalProps {
  open: boolean;
  title?: string;
  placeholder?: string;
  onClose: () => void;
  onSave: (note: string) => void;
}

export default function NoteModal({
  open,
  title = 'Nhập ghi chú',
  placeholder = 'Nhập ghi chú...',
  onClose,
  onSave,
}: NoteModalProps) {
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) setNote('');
  }, [open]);

  const handleSave = () => {
    onSave(note);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          minWidth: 350,
        }}
      >
        <Typography variant="h6" mb={2} fontWeight={700} textAlign="center">
          {title}
        </Typography>
        <TextField
          label="Ghi chú (nếu có)"
          placeholder={placeholder}
          multiline
          minRows={3}
          fullWidth
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <Button variant="outlined" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
} 