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
  // Date Helpers
  const formatDate = (d: Date) => {
    // Return YYYY-MM-DD in local time
    const offset = d.getTimezoneOffset();
    const date = new Date(d.getTime() - (offset * 60 * 1000));
    return date.toISOString().split('T')[0];
  };

  const getRanges = () => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    // Week (Monday to Sunday)
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(today.setDate(monday.getDate() + 6));

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    return { today: new Date(), yesterday, monday, sunday, startOfMonth, endOfMonth, startOfYear, endOfYear };
  };

  // Combine filters into single state to prevent double fetch
  const [filter, setFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });

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

  const setRange = (type: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    // Unused, removal candidate
  };

  // Cleaner helpers
  const applyFilter = (type: 'today' | 'yesterday' | 'week' | 'month' | 'year') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (type) {
      case 'today':
        break; // start/end are today
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'week':
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }
    // Update both at once
    setFilter({
      from: formatDate(start),
      to: formatDate(end)
    });
    setPage(0);
  };

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filter.from) {
      const [y, m, d] = filter.from.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      params.set('from', start.toISOString());
    }
    if (filter.to) {
      const [y, m, d] = filter.to.split('-').map(Number);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      params.set('to', end.toISOString());
    }
    if (debouncedQ) params.set('q', debouncedQ);
    params.set('page', String(page + 1));
    params.set('limit', String(limit));
    return params.toString();
  }, [filter, debouncedQ, page, limit]);

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
        if (filter.from) {
          const [y, m, d] = filter.from.split('-').map(Number);
          const start = new Date(y, m - 1, d, 0, 0, 0, 0);
          url += '&from=' + start.toISOString();
        }
        if (filter.to) {
          const [y, m, d] = filter.to.split('-').map(Number);
          const end = new Date(y, m - 1, d, 23, 59, 59, 999);
          url += '&to=' + end.toISOString();
        }
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
        <Stack direction="row" spacing={1} pb={1}>
          <Chip label="Tất cả" onClick={() => { setFilter({ from: '', to: '' }); setQ(''); setPage(0); }} clickable color={(!filter.from && !filter.to) ? "primary" : "default"} variant={(!filter.from && !filter.to) ? "filled" : "outlined"} />
          <Chip label="Hôm nay" onClick={() => applyFilter('today')} clickable color="primary" variant="outlined" />
          <Chip label="Hôm qua" onClick={() => applyFilter('yesterday')} clickable color="primary" variant="outlined" />
          <Chip label="Tuần này" onClick={() => applyFilter('week')} clickable color="primary" variant="outlined" />
          <Chip label="Tháng này" onClick={() => applyFilter('month')} clickable color="primary" variant="outlined" />
          <Chip label="Năm nay" onClick={() => applyFilter('year')} clickable color="primary" variant="outlined" />
        </Stack>

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
            value={filter.from}
            onChange={(e) => { setFilter(f => ({ ...f, from: e.target.value })); setPage(0); }}
          />
          <TextField
            type="date"
            label="Đến ngày"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filter.to}
            onChange={(e) => { setFilter(f => ({ ...f, to: e.target.value })); setPage(0); }}
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
                <TableCell>
                  {new Date(e.paymentDate).toLocaleString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </TableCell>
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
