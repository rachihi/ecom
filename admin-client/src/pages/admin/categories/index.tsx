import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, MenuItem, Select, TablePagination, Alert, Snackbar } from '@mui/material';
import MainCard from 'components/MainCard';

interface CategoryForm {
  _id?: string;
  cName: string;
  cDescription?: string;
  cStatus?: string;
}

const emptyForm: CategoryForm = { cName: '', cDescription: '', cStatus: 'Active' };

export default function CategoriesPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;

  const { data, mutate, isLoading } = useSWR(`/api/category/all-category?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`);
  const rows: CategoryForm[] = useMemo(() => data?.Categories || [], [data]);
  const total: number = data?.total || 0;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOpenCreate = () => { setForm(emptyForm); setOpen(true); };
  const handleOpenEdit = (row: CategoryForm) => { setForm(row); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    let res;
    if (!form._id) {
      const payload = {
        cName: form.cName,
        cDescription: form.cDescription || '',
        cStatus: form.cStatus || 'Active'
      };
      res = await axios.post('/api/category/add-category', payload);
    } else {
      const payload = {
        cId: form._id,
        cDescription: form.cDescription || '',
        cStatus: form.cStatus || 'Active'
      };
      res = await axios.post('/api/category/edit-category', payload);
    }

    if (res.data.error) {
      setSnack({ open: true, message: res.data.error, severity: 'error' });
      return; // Do not close dialog
    }

    setOpen(false);
    setSnack({ open: true, message: 'Lưu thành công', severity: 'success' });
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá danh mục này?')) return;
    await axios.post('/api/category/delete-category', { cId: id });
    mutate();
  };

  return (
    <MainCard title={'Danh mục'} secondary={<Button variant="contained" onClick={handleOpenCreate}>{'Thêm danh mục'}</Button>}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Tìm kiếm danh mục..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
          />
        </Stack>
        {isLoading && <Typography>{'Đang tải...'}</Typography>}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>{'Tên'}</strong></TableCell>
              <TableCell><strong>{'Trạng thái'}</strong></TableCell>
              <TableCell align="right"><strong>{'Hành động'}</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.cName}</TableCell>
                <TableCell>{row.cStatus === 'Active' ? 'Hoạt động' : (row.cStatus === 'Inactive' ? 'Tạm dừng' : row.cStatus)}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => handleOpenEdit(row)}>{'Sửa'}</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(row._id!)}>{'Xoá'}</Button>
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
        <DialogTitle>{form._id ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={'Tên'} value={form.cName} onChange={(e) => setForm((f) => ({ ...f, cName: e.target.value }))} fullWidth disabled={!!form._id} />
            <TextField label={'Mô tả'} value={form.cDescription} onChange={(e) => setForm((f) => ({ ...f, cDescription: e.target.value }))} fullWidth />
            <Select size="small" value={form.cStatus} onChange={(e) => setForm((f) => ({ ...f, cStatus: String(e.target.value) }))}>
              <MenuItem value="Active">Hoạt động</MenuItem>
              <MenuItem value="Inactive">Tạm dừng</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{'Huỷ'}</Button>
          <Button onClick={handleSave} variant="contained">{'Lưu'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack((prev) => ({ ...prev, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </MainCard >
  );
}
