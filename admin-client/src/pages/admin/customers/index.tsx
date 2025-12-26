import { useState, useMemo } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';

// mui
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';
import { isValidEmail, isValidPhone } from 'utils/validation';

// project
import MainCard from 'components/MainCard';

interface CustomerForm {
  _id?: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  taxCode?: string;
}

const emptyForm: CustomerForm = { fullName: '', phoneNumber: '', email: '', address: '', taxCode: '' };

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;

  const { data, mutate, isLoading } = useSWR(`/api/customers?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`);
  const rows: CustomerForm[] = useMemo(() => data?.customers || [], [data]);
  const total: number = data?.total || 0;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleOpenCreate = () => { setForm(emptyForm); setOpen(true); };
  const handleOpenEdit = (row: CustomerForm) => { setForm(row); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if ((form.email && !isValidEmail(form.email)) || (form.phoneNumber && !isValidPhone(form.phoneNumber))) {
      return;
    }

    try {
      if (form._id) await axios.put(`/api/customers/${form._id}`, form);
      else await axios.post(`/api/customers`, form);
      setOpen(false);
      setSnack({ open: true, message: 'Đã lưu thành công', severity: 'success' });
      mutate();
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.error || 'Lỗi lưu khách hàng', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá khách hàng này?')) return;
    await axios.delete(`/api/customers/${id}`);
    mutate();
  };

  return (
    <MainCard title="Khách hàng" secondary={<Button variant="contained" onClick={handleOpenCreate}>Thêm khách</Button>}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Tìm kiếm khách hàng..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
          />
        </Stack>
        {isLoading && <Typography>Đang tải...</Typography>}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Tên</strong></TableCell>
              <TableCell><strong>Điện thoại</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Địa chỉ</strong></TableCell>
              <TableCell><strong>MST</strong></TableCell>
              <TableCell align="right"><strong>Hành động</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.fullName}</TableCell>
                <TableCell>{row.phoneNumber}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.address}</TableCell>
                <TableCell>{row.taxCode}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => handleOpenEdit(row)}>Sửa</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(row._id!)}>Xoá</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Stack alignItems="flex-end" sx={{ mt: 2 }}>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Stack>
      </Stack>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{form._id ? 'Sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tên" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} fullWidth />
            <TextField
              label="Điện thoại"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              fullWidth
              error={!!form.phoneNumber && !isValidPhone(form.phoneNumber)}
              helperText={!!form.phoneNumber && !isValidPhone(form.phoneNumber) ? 'Số điện thoại không hợp lệ' : ''}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
              error={!!form.email && !isValidEmail(form.email)}
              helperText={!!form.email && !isValidEmail(form.email) ? 'Email không hợp lệ' : ''}
            />
            <TextField label="Địa chỉ" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} fullWidth />
            <TextField label="MST" value={form.taxCode} onChange={(e) => setForm((f) => ({ ...f, taxCode: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Huỷ</Button>
          <Button onClick={handleSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </MainCard >
  );
}
