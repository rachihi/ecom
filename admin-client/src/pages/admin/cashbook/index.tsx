import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { Box, Chip, Grid, Snackbar, Alert, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, TablePagination } from '@mui/material';
import MainCard from 'components/MainCard';
import { formatCurrency } from 'utils/format';
import ExportButton from 'components/actions/ExportButton';

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
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const tMethod = (m: string) => {
    if (m === 'Cash') return 'Tiền mặt';
    if (m === 'BankTransfer') return 'Chuyển khoản';
    return m;
  };

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

  // Export Logic
  const handleExport = async (type: 'all' | 'filtered') => {
    try {
      let url = '/api/cashbook/export?type=' + type;
      // Pass the same filters
      if (type === 'filtered') {
        if (debouncedQ) url += '&q=' + encodeURIComponent(debouncedQ);
        if (from) url += '&from=' + from;
        if (to) url += '&to=' + to;
      }
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `cashbook_${type}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setSnack({ open: true, message: 'Lỗi xuất file', severity: 'error' });
    }
  };

  return (
    <MainCard title={'Sổ quỹ'} secondary={<ExportButton onExportAll={() => handleExport('all')} onExportFiltered={() => handleExport('filtered')} />}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Tìm kiếm..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            type="date"
            label="Từ ngày"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(0); }}
          />
          <TextField
            type="date"
            label="Đến ngày"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(0); }}
          />
        </Stack>

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
                <TableCell>{tMethod(e.paymentMethod)}</TableCell>
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
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </MainCard >
  );
}
