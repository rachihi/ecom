import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { formatCurrency } from 'utils/format';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';
import MainCard from 'components/MainCard';

interface ProductRow { _id: string; pName: string; pPrice?: number; pQuantity?: number; pCategory?: any; pStatus?: string; pOffer?: number; pImages?: string[] }

export default function ProductsPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;
  const { data, mutate, isLoading } = useSWR(`/api/product/all-product?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`);
  const rows: ProductRow[] = useMemo(() => data?.Products || [], [data]);
  const total: number = data?.total || 0;
  const { data: catData } = useSWR('/api/category/all-category?limit=1000');
  const categories: any[] = catData?.Categories || [];

  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{open:boolean, message:string, severity:'success'|'error'}>({ open:false, message:'', severity:'success' });
  const [form, setForm] = useState<any>({});
  const [img, setImg] = useState<File | null>(null);

  const startCreate = () => { setForm({ pStatus: 'Active', pOffer: 0 }); setImg(null); setOpen(true); };
  const startEdit = (row: ProductRow) => { setForm(row); setImg(null); setOpen(true); };

  const handleSave = async () => {
    const fd = new FormData();
    if (!form._id) {
      fd.append('pName', form.pName || '');
      fd.append('pDescription', form.pDescription || '');
      fd.append('pPrice', String(form.pPrice || 0));
      fd.append('pQuantity', String(form.pQuantity || 0));
      fd.append('pCategory', typeof form.pCategory === 'object' ? form.pCategory?._id : (form.pCategory || ''));
      fd.append('pOffer', String(form.pOffer || 0));
      fd.append('pStatus', form.pStatus || 'Active');
      if (img) fd.append('file1', img);
      await axios.post('/api/product/add-product', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSnack({ open:true, message:'Đã thêm sản phẩm', severity:'success' });
    } else {
      fd.append('pId', form._id);
      fd.append('pName', form.pName || '');
      fd.append('pDescription', form.pDescription || '');
      fd.append('pPrice', String(form.pPrice || 0));
      fd.append('pQuantity', String(form.pQuantity || 0));
      fd.append('pCategory', typeof form.pCategory === 'object' ? form.pCategory._id : form.pCategory);
      fd.append('pOffer', String(form.pOffer || 0));
      fd.append('pStatus', form.pStatus || 'Active');
      if (img) {
        fd.append('pImages', (form.pImages || []).join(','));
        fd.append('file1', img);
      }
      await axios.post('/api/product/edit-product', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSnack({ open:true, message:'Đã cập nhật sản phẩm', severity:'success' });
    }
    setOpen(false); mutate();
  };

  const performDelete = async () => { if (!confirmId) return; await axios.post('/api/product/delete-product', { pId: confirmId }); setSnack({ open:true, message:'Đã xoá sản phẩm', severity:'success' }); setConfirmId(null); mutate(); };

  return (<>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField size="small" label="Tìm kiếm" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(0); }} />
      </Stack>

    <MainCard title="Sản phẩm" secondary={<Button variant="contained" onClick={startCreate}>Thêm</Button>}>
      {isLoading && <Typography>Đang tải...</Typography>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tên</TableCell>
            <TableCell>Giá</TableCell>
            <TableCell>Tồn</TableCell>
            <TableCell>Danh mục</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="right">Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell>{row.pName}</TableCell>
              <TableCell>{formatCurrency(row.pPrice || 0)}</TableCell>
              <TableCell>{row.pQuantity}</TableCell>
              <TableCell>{typeof row.pCategory === 'string' ? row.pCategory : row.pCategory?.cName}</TableCell>
              <TableCell>{row.pStatus}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" onClick={() => startEdit(row)}>Sửa</Button>
                  <Button size="small" color="error" onClick={() => setConfirmId(row._id)}>Xoá</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Stack alignItems="flex-end">
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_e, newPage)=> setPage(newPage as number)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(0); }}
          rowsPerPageOptions={[5,10,20,50]}
        />
      </Stack>


      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form._id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}><TextField fullWidth label="Tên" value={form.pName || ''} onChange={(e)=>setForm((f:any)=>({...f,pName:e.target.value}))} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Giá" value={form.pPrice || 0} onChange={(e)=>setForm((f:any)=>({...f,pPrice:Number(e.target.value)}))} /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Số lượng" value={form.pQuantity || 0} onChange={(e)=>setForm((f:any)=>({...f,pQuantity:Number(e.target.value)}))} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline label="Mô tả" value={form.pDescription || ''} onChange={(e)=>setForm((f:any)=>({...f,pDescription:e.target.value}))} /></Grid>
            <Grid item xs={6}>
              <Select fullWidth size="small" value={typeof form.pCategory==='object'?form.pCategory?._id:(form.pCategory||'')} onChange={(e)=>setForm((f:any)=>({...f,pCategory:e.target.value}))} displayEmpty>
                <MenuItem value=""><em>Chọn danh mục</em></MenuItem>
                {categories.map((c:any)=>(<MenuItem key={c._id} value={c._id}>{c.cName}</MenuItem>))}
              </Select>
            </Grid>
            <Grid item xs={3}><TextField fullWidth type="number" label="Ưu đãi (%)" value={form.pOffer || 0} onChange={(e)=>setForm((f:any)=>({...f,pOffer:Number(e.target.value)}))} /></Grid>
            <Grid item xs={3}>
              <Select fullWidth size="small" value={form.pStatus || 'Active'} onChange={(e)=>setForm((f:any)=>({...f,pStatus:e.target.value}))}>
                <MenuItem value="Active">Đang bán</MenuItem>
                <MenuItem value="Inactive">Ngưng bán</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12}><Button component="label" fullWidth variant="outlined">Ảnh<input hidden type="file" accept="image/*" onChange={(e)=>setImg(e.target.files?.[0]||null)} /></Button></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!confirmId} onClose={()=>setConfirmId(null)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xoá sản phẩm này?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirmId(null)}>Huỷ</Button>
          <Button color="error" variant="contained" onClick={performDelete}>Xoá</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack((s)=>({...s, open:false}))}>
        <Alert onClose={()=>setSnack((s)=>({...s, open:false}))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </MainCard>
  </> );
}
