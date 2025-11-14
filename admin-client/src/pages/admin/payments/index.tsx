import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useDebounce } from 'hooks/useDebounce';

import { formatCurrency } from 'utils/format';
import { Alert, Button, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';
import MainCard from 'components/MainCard';

interface PaymentRow {
  _id: string;
  order?: string;
  purchaseOrder?: string;
  direction?: 'in' | 'out';
  paymentMethod?: string;
  amount: number;
  paymentDate?: string;
  note?: string;
}

type PayType = 'order' | 'purchase';

export default function PaymentsPage() {
  const [type, setType] = useState<PayType>('order');
  const [refId, setRefId] = useState('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0); // TablePagination is zero-based
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;
  const key = refId ? (type === 'order' ? `/api/payments/order/${refId}?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}` : `/api/payments/purchase-order/${refId}?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`) : null;
  const { data, mutate, isLoading } = useSWR(key);
  const rows: PaymentRow[] = useMemo(() => data?.payments || [], [data]);

  const [snack, setSnack] = useState<{open:boolean, message:string, severity:'success'|'error'}>({ open:false, message:'', severity:'success' });

  const labelId = type === 'order' ? 'Mã đơn hàng' : 'Mã nhập hàng';
  const summaryLabel = type === 'order' ? 'Còn lại cần thu' : 'Còn lại cần trả';

  return (
    <MainCard title={'Thanh toán'}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Select size="small" value={type} onChange={(e) => { setType(e.target.value as PayType); setRefId(''); }}>
            <MenuItem value="order">Đơn hàng (Thu)</MenuItem>
            <MenuItem value="purchase">Nhập hàng (Chi)</MenuItem>
          </Select>
          <TextField label={labelId} value={refId} onChange={(e) => setRefId(e.target.value)} size="small" sx={{ width: 300 }} />
          <Button variant="outlined" onClick={() => mutate()} disabled={!refId}>Tải</Button>
        </Stack>

        {data?.summary && (
          <Typography variant="body2">Đã thanh toán: {formatCurrency(data.summary.totalPaid || 0)} | {summaryLabel}: {formatCurrency(data.summary.remaining || 0)}</Typography>
        )}
        {isLoading && <Typography>Đang tải...</Typography>}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Loại</TableCell>
              <TableCell>Phương thức</TableCell>
              <TableCell>Số tiền</TableCell>
              <TableCell>Ngày</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => {
              const dir = row.direction || (row.purchaseOrder ? 'out' : 'in');
              return (
                <TableRow key={row._id} hover>
                  <TableCell>{dir === 'in' ? 'Thu' : 'Chi'}</TableCell>
                  <TableCell>{row.paymentMethod}</TableCell>
                  <TableCell>{formatCurrency(row.amount || 0)}</TableCell>
                  <TableCell>{row.paymentDate && new Date(row.paymentDate).toLocaleString()}</TableCell>
                  <TableCell>{row.note}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField size="small" label="Tìm kiếm" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(0); }} sx={{ width: 300 }} />
        </Stack>
        <Stack alignItems="flex-end">
          <TablePagination
            component="div"
            count={data?.total || 0}
            page={page}
            onPageChange={(_e, newPage)=> setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e)=>{ setLimit(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5,10,20,50]}
          />
        </Stack>
      </Stack>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack((s)=>({...s, open:false}))}>
        <Alert onClose={()=>setSnack((s)=>({...s, open:false}))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}

