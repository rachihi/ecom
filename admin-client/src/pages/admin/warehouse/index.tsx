import { useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import MainCard from 'components/MainCard';

interface WarehouseRow { _id: string; product: any; quantity: number; location?: string; lastUpdated?: string }

export default function WarehousePage() {
  const { data, mutate, isLoading } = useSWR('/api/warehouse');
  const rows: WarehouseRow[] = data?.warehouses || [];

  const [open, setOpen] = useState(false);
  const [row, setRow] = useState<WarehouseRow | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const openAdjust = (r: WarehouseRow) => { setRow(r); setDelta(0); setNote(''); setOpen(true); };
  const handleAdjust = async () => { if (!row) return; await axios.post('/api/warehouse/adjust', { product: typeof row.product==='object'?row.product._id:row.product, delta: Number(delta) }); setOpen(false); mutate(); };

  return (
    <MainCard title="Tồn kho">
      {isLoading && <Typography>Đang tải...</Typography>}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Sản phẩm</TableCell>
            <TableCell>Tồn</TableCell>
            <TableCell>Vị trí</TableCell>
            <TableCell>Cập nhật</TableCell>
            <TableCell align="right">Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.map((r) => (
            <TableRow key={r._id} hover>
              <TableCell>{typeof r.product === 'string' ? r.product : r.product?.pName}</TableCell>
              <TableCell>{r.quantity}</TableCell>
              <TableCell>{r.location}</TableCell>
              <TableCell>{r.lastUpdated && new Date(r.lastUpdated).toLocaleString()}</TableCell>
              <TableCell align="right"><Button size="small" onClick={()=>openAdjust(r)}>Điều chỉnh</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Sản phẩm" value={typeof row?.product==='string'?row?.product:row?.product?.pName || ''} disabled sx={{ my: 1 }} />
          <TextField fullWidth label="Tồn hiện tại" value={row?.quantity || 0} disabled sx={{ my: 1 }} />
          <TextField fullWidth type="number" label="Điều chỉnh (+/-)" value={delta} onChange={(e)=>setDelta(Number(e.target.value))} sx={{ my: 1 }} />
          <TextField fullWidth label="Lý do (tuỳ chọn)" value={note} onChange={(e)=>setNote(e.target.value)} sx={{ my: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handleAdjust}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
