import { useState, useMemo } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';

// mui
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';

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

  const handleOpenCreate = () => { setForm(emptyForm); setOpen(true); };
  const handleOpenEdit = (row: CustomerForm) => { setForm(row); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (form._id) await axios.put(`/api/customers/${form._id}`, form);
    else await axios.post(`/api/customers`, form);
    setOpen(false); mutate();
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
          <TextField size="small" label="Tìm kiếm" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(0); }} sx={{ width: 300 }} />
        </Stack>
        {isLoading && <Typography>Đang tải...</Typography>}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Điện thoại</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell>MST</TableCell>
              <TableCell align="right">Hành động</TableCell>
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
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Stack>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{form._id ? 'Sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tên" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} fullWidth />
            <TextField label="Điện thoại" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} fullWidth />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} fullWidth />
            <TextField label="Địa chỉ" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} fullWidth />
            <TextField label="MST" value={form.taxCode} onChange={(e) => setForm((f) => ({ ...f, taxCode: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Huỷ</Button>
          <Button onClick={handleSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
