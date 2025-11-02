import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, MenuItem, Select, TablePagination } from '@mui/material';
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
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleOpenCreate = () => { setForm(emptyForm); setImageFile(null); setOpen(true); };
  const handleOpenEdit = (row: CategoryForm) => { setForm(row); setImageFile(null); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (!form._id) {
      const fd = new FormData();
      fd.append('cName', form.cName);
      fd.append('cDescription', form.cDescription || '');
      fd.append('cStatus', form.cStatus || 'Active');
      if (imageFile) fd.append('cImage', imageFile);
      await axios.post('/api/category/add-category', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      const fd = new FormData();
      fd.append('cId', form._id);
      fd.append('cDescription', form.cDescription || '');
      fd.append('cStatus', form.cStatus || 'Active');
      await axios.post('/api/category/edit-category', fd);
    }
    setOpen(false);
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
          <TextField size="small" label="Tìm kiếm" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(0); }} sx={{ width: 300 }} />
        </Stack>
        {isLoading && <Typography>{'Đang tải...'}</Typography>}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{'Tên'}</TableCell>
              <TableCell>{'Trạng thái'}</TableCell>
              <TableCell align="right">{'Hành động'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => (
              <TableRow key={row._id} hover>
                <TableCell>{row.cName}</TableCell>
                <TableCell>{row.cStatus}</TableCell>
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
        <DialogTitle>{form._id ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label={'Tên'} value={form.cName} onChange={(e) => setForm((f) => ({ ...f, cName: e.target.value }))} fullWidth disabled={!!form._id} />
            <TextField label={'Mô tả'} value={form.cDescription} onChange={(e) => setForm((f) => ({ ...f, cDescription: e.target.value }))} fullWidth />
            <Select size="small" value={form.cStatus} onChange={(e) => setForm((f) => ({ ...f, cStatus: String(e.target.value) }))}>
              <MenuItem value="Active">Hoạt động</MenuItem>
              <MenuItem value="Inactive">Tạm dừng</MenuItem>
            </Select>
            {!form._id && (
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{'Huỷ'}</Button>
          <Button onClick={handleSave} variant="contained">{'Lưu'}</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
