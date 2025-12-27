import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, MenuItem, Select, TablePagination, Snackbar, Alert } from '@mui/material';
import MainCard from 'components/MainCard';
import ExportButton from 'components/actions/ExportButton';
import ImportButton from 'components/actions/ImportButton';

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
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [isImporting, setIsImporting] = useState(false);

  const handleOpenCreate = () => { setForm(emptyForm); setOpen(true); };
  const handleOpenEdit = (row: CategoryForm) => { setForm(row); setOpen(true); };
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    try {
      if (!form._id) {
        const fd = new FormData();
        fd.append('cName', form.cName);
        fd.append('cDescription', form.cDescription || '');
        fd.append('cStatus', form.cStatus || 'Active');
        await axios.post('/api/category/add-category', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const fd = new FormData();
        fd.append('cId', form._id);
        fd.append('cDescription', form.cDescription || '');
        fd.append('cStatus', form.cStatus || 'Active');
        await axios.post('/api/category/edit-category', fd);
      }
      setOpen(false);
      setSnack({ open: true, message: 'Lưu thành công', severity: 'success' });
      mutate();
    } catch (error: any) {
      setSnack({ open: true, message: error?.response?.data?.error || 'Lỗi lưu danh mục', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá danh mục này?')) return;
    try {
      await axios.post('/api/category/delete-category', { cId: id });
      setSnack({ open: true, message: 'Đã xoá', severity: 'success' });
      mutate();
    } catch (error) {
      setSnack({ open: true, message: 'Lỗi xoá', severity: 'error' });
    }
  };

  // Export Logic
  const handleExport = async (type: 'all' | 'filtered' | 'template') => {
    try {
      let url = '/api/category/export?type=' + type;
      if (type === 'filtered' && debouncedQ) {
        url += '&q=' + encodeURIComponent(debouncedQ);
      }
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `categories_${type}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setSnack({ open: true, message: 'Lỗi xuất file', severity: 'error' });
    }
  };

  // Import Logic
  const handleImport = async (file: File) => {
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/category/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.errors && res.data.errors.length > 0) {
        alert('Có lỗi khi nhập:\n' + res.data.errors.join('\n'));
      }
      setSnack({ open: true, message: res.data.message || 'Nhập file thành công', severity: 'success' });
      mutate();
    } catch (error: any) {
      setSnack({ open: true, message: error?.response?.data?.error || 'Lỗi nhập file', severity: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <MainCard
      title={'Danh mục'}
      secondary={
        <Stack direction="row" spacing={2} alignItems="center">
          <ExportButton onExportAll={() => handleExport('all')} onExportFiltered={() => handleExport('filtered')} />
          <ImportButton onImport={handleImport} isLoading={isImporting} onDownloadTemplate={() => handleExport('template')} />
          <Button variant="contained" onClick={handleOpenCreate}>{'Thêm danh mục'}</Button>
        </Stack>
      }
    >
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
                    <Button size="small" variant="outlined" onClick={() => handleOpenEdit(row)}>{'Sửa'}</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(row._id!)}>{'Xoá'}</Button>
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
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </MainCard >
  );
}
