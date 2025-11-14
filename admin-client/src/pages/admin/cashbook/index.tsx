import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { Box, Chip, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';
import MainCard from 'components/MainCard';
import { formatCurrency } from 'utils/format';

interface CashbookEntry {
  _id: string;
  direction: 'in' | 'out';
  source: 'order' | 'purchase';
  order?: { _id: string; transactionId?: string; amount?: number } | null;
  purchaseOrder?: { _id: string; totalAmount?: number; status?: string } | null;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  note?: string | null;
}

interface CashbookResp {
  entries: CashbookEntry[];
  total: number;
  page: number;
  limit: number;
  summary: { totalIn: number; totalOut: number; balance: number };
}

export default function CashbookPage() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (debouncedQ) params.set('q', debouncedQ);
    params.set('page', String(page + 1));
    params.set('limit', String(limit));
    return params.toString();
  }, [from, to, debouncedQ, page, limit]);

  const key = `/api/cashbook${query ? `?${query}` : ''}`;
  const { data } = useSWR<CashbookResp>(key);

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const summary = data?.summary || { totalIn: 0, totalOut: 0, balance: 0 };

  return (
    <MainCard title={'Sổ quỹ'}>
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid item>
            <TextField
              type="date"
              label="Từ ngày"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(0); }}
            />
          </Grid>
          <Grid item>
            <TextField
              type="date"
              label="Đến ngày"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(0); }}
            />
          </Grid>
          <Grid item>
            <TextField
              size="small"
              label="Tìm kiếm"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
              sx={{ width: 250 }}
            />
          </Grid>
        </Grid>

        <Box>
          <Typography variant="subtitle1">Tổng hợp</Typography>
          <Stack direction="row" spacing={3} mt={1}>
            <Typography color="success.main">Tổng thu: {formatCurrency(summary.totalIn)}</Typography>
            <Typography color="error.main">Tổng chi: {formatCurrency(summary.totalOut)}</Typography>
            <Typography fontWeight={600}>Số dư: {formatCurrency(summary.balance)}</Typography>
          </Stack>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ngày</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Nguồn</TableCell>
              <TableCell>Số tiền</TableCell>
              <TableCell>Phương thức</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e._id} hover>
                <TableCell>{new Date(e.paymentDate).toLocaleString()}</TableCell>
                <TableCell>
                  <Chip size="small" label={e.direction === 'in' ? 'Thu' : 'Chi'} color={e.direction === 'in' ? 'success' : 'error'} />
                </TableCell>
                <TableCell>{e.source === 'order' ? 'Đơn hàng' : 'Nhập hàng'}</TableCell>
                <TableCell>{formatCurrency(e.amount)}</TableCell>
                <TableCell>{e.paymentMethod}</TableCell>
                <TableCell>{e.note}</TableCell>
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
    </MainCard>
  );
}

