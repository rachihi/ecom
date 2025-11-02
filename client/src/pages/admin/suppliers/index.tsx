import { useState, useMemo } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';
import MainCard from 'components/MainCard';

interface SupplierForm {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxCode?: string;
}

const emptyForm: SupplierForm = { name: '', phone: '', email: '', address: '', taxCode: '' };

export default function SuppliersPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;

  const { data, mutate, isLoading } = useSWR(`/api/suppliers?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`);
  const rows: SupplierForm[] = useMemo(() => data?.suppliers || [], [data]);
  const total: number = data?.total || 0;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  const handleOpenCreate = () => { setForm(emptyForm); setOpen(true); };
  const handleOpenEdit = (row: SupplierForm) => { setForm(row); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (form._id) await axios.put(`/api/suppliers/${form._id}`, form);
    else await axios.post(`/api/suppliers`, form);
    setOpen(false); mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá nhà cung cấp này?')) return;
    await axios.delete(`/api/suppliers/${id}`);
    mutate();
  };

  return (
    <MainCard title="Nhà cung cấp" secondary={<Button variant="contained" onClick={handleOpenCreate}>Thêm NCC</Button>}>
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
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.phone}</TableCell>
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
        <DialogTitle>{form._id ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Tên" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <TextField label="Điện thoại" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} fullWidth />
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
