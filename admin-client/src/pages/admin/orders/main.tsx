import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { formatCurrency } from 'utils/format';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, TextField, TablePagination, Grid } from '@mui/material';
import MainCard from 'components/MainCard';
import NumericInput from 'components/NumericInput';
import ExportButton from 'components/actions/ExportButton';

interface OrderRow {
  _id: string;
  transactionId?: string;
  customer?: any;
  amount?: number;
  status?: string;
  paymentStatus?: string;
  details?: any[];
}

export default function OrdersPage() {
  const tStatus = (s?: string) => {
    if (s === 'Paid') return 'Đã thanh toán';
    if (s === 'Unpaid') return 'Chưa thanh toán';
    if (s === 'Partial') return 'Thanh toán 1 phần';
    return s || '';
  };
  const tMethod = (m?: string) => {
    if (m === 'Cash') return 'Tiền mặt';
    if (m === 'BankTransfer') return 'Chuyển khoản';
    if (m === 'BankTransfer') return 'Chuyển khoản / Online';
    return m || '';
  };
  const tOrderStatus = (s?: string) => {
    if (s === 'Pending') return 'Chờ xử lý';
    if (s === 'Processing') return 'Đang xử lý';
    if (s === 'Shipped') return 'Đã gửi';
    if (s === 'Delivered') return 'Đã giao';
    if (s === 'Cancelled') return 'Đã huỷ';
    return s || '';
  };

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;
  const { data, mutate, isLoading } = useSWR(`/api/order/get-all-orders?page=${fetchPage}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`);
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows: OrderRow[] = useMemo(() => data?.Orders || [], [data]);
  const total: number = data?.total || 0;
  const [savingId, setSavingId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<OrderRow | null>(null);
  const { data: payData, mutate: mutatePay } = useSWR(detailRow ? `/api/payments/order/${detailRow._id}` : null);
  const payments: any[] = payData?.payments || [];
  const summary = payData?.summary || { totalPaid: 0, remaining: 0 };
  const [payOpen, setPayOpen] = useState(false);
  const [payDate, setPayDate] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
  });
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNote, setPayNote] = useState('');

  const submitPayment = async () => {
    try {
      if (!detailRow) return;
      if (payAmount > summary.remaining) {
        setSnack({ open: true, message: 'Số tiền thanh toán không được vượt quá số tiền còn lại', severity: 'error' });
        return;
      }
      await axios.post('/api/payments', {
        order: detailRow._id,
        amount: payAmount,
        paymentMethod: payMethod,
        paymentDate: payDate,
        note: payNote
      });
      setSnack({ open: true, message: 'Thêm thanh toán thành công', severity: 'success' });
      setPayOpen(false);
      mutatePay();
      mutate();
    } catch (e: any) {
      setSnack({ open: true, message: e.response?.data?.error || 'Lỗi thêm thanh toán', severity: 'error' });
    }
  };


  const handlePrintSafe = () => {
    if (!detailRow) return;
    const w = window.open('', '', 'width=800,height=700');
    if (!w) return;
    const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n || 0);
    const rowsHtml = (detailRow as any)?.details?.map((it: any) => `<tr><td>${it.productName}</td><td>${it.quantity}</td><td>${fmt(it.productPrice)}</td><td>${fmt((it.productPrice || 0) * (it.quantity || 0))}</td></tr>`).join('');
    w.document.write(`
      <html><head><title>Hóa đơn bán hàng - ${detailRow?.transactionId || ''}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:16px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;text-align:left} h2{margin:0 0 8px}</style>
      </head><body>
        <h2>HOÁ ĐƠN BÁN HÀNG</h2>
        <p><strong>Mã GD:</strong> ${detailRow?.transactionId || ''}</p>
        <p><strong>Khách hàng:</strong> ${typeof detailRow?.customer === 'string' ? detailRow?.customer : detailRow?.customer?.fullName || ''}</p>
        <table>
          <thead><tr><th>Sản phẩm</th><th>SL</th><th>Giá</th><th>Thành tiền</th></tr></thead>
          <tbody>${rowsHtml || ''}</tbody>
        </table>
        <p><strong>Tổng tiền:</strong> ${fmt(detailRow?.amount || 0)}</p>
        <p>Đã thanh toán: ${fmt(summary.totalPaid || 0)}</p>
        <p>Còn lại: ${fmt(summary.remaining || 0)}</p>
        <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };


  const handlePrint = () => {
    if (!detailRow) return;
    const w = window.open('', '', 'width=800,height=700');
    if (!w) return;
    const rowsHtml = (detailRow as any)?.details?.map((it: any) => `<tr><td>${it.productName}</td><td>${it.quantity}</td><td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(it.productPrice)}</td><td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format((it.productPrice || 0) * (it.quantity || 0))}</td></tr>`).join('');
    w.document.write(`
      <html><head><title>Hoán đơn bán hàng - ${detailRow.transactionId || ''}</title>
      <style>body{font-family:Arial;padding:16px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;text-align:left} h2{margin:0 0 8px}</style>
      </head><body>
        <h2>HOÁ ĐƠN BÁN HÀNG</h2>
        <p><strong>Mã GD:</strong> ${detailRow.transactionId || ''}</p>
        <p><strong>Khách hàng:</strong> ${typeof detailRow.customer === 'string' ? detailRow.customer : detailRow.customer?.fullName || ''}</p>
        <table>
          <thead><tr><th>Sản phẩm</th><th>SL</th><th>Giá</th><th>Thành tiền</th></tr></thead>
          <tbody>${rowsHtml || ''}</tbody>
        </table>
        <p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(detailRow.amount || 0)}</p>
        <p>Đã thanh toán: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(summary.totalPaid || 0)}</p>
        <p>Còn lại: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(summary.remaining || 0)}</p>
        <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };


  const updateStatus = async (row: OrderRow, status: string) => {
    setSavingId(row._id);
    try {
      await axios.post('/api/order/update-order', { oId: row._id, status });
      setSnack({ open: true, message: 'Cập nhật trạng thái thành công', severity: 'success' });
      mutate();
    } catch (e) {
      setSnack({ open: true, message: 'Lỗi khi cập nhật', severity: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const askDelete = (id: string) => setConfirmId(id);
  const performDelete = async () => {
    if (!confirmId) return;
    try {
      await axios.post('/api/order/delete-order', { oId: confirmId });
      setSnack({ open: true, message: '\u0110\u00e3 xo\u00e1 \u0111\u01a1n h\u00e0ng', severity: 'success' });
      mutate();
    } catch {
      setSnack({ open: true, message: 'L\u1ed7i xo\u00e1 \u0111\u01a1n h\u00e0ng', severity: 'error' });
    } finally {
      setConfirmId(null);
    }
  };

  // Export Logic
  const handleExport = async (type: 'all' | 'filtered') => {
    try {
      let url = '/api/order/export?type=' + type;
      if (type === 'filtered' && debouncedQ) {
        url += '&q=' + encodeURIComponent(debouncedQ);
      }
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `orders_${type}_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setSnack({ open: true, message: 'Lỗi xuất file', severity: 'error' });
    }
  };

  return (
    <MainCard title="Đơn hàng" secondary={<ExportButton onExportAll={() => handleExport('all')} onExportFiltered={() => handleExport('filtered')} />}>
      {isLoading && <Typography>Đang tải...</Typography>}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm đơn hàng..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 200 }}
        />
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell><strong>Mã ĐH</strong></TableCell>

            <TableCell><strong>Khách hàng</strong></TableCell>
            <TableCell><strong>Số tiền</strong></TableCell>
            <TableCell><strong>Trạng thái</strong></TableCell>
            <TableCell><strong>Thanh toán</strong></TableCell>
            <TableCell align="right"><strong>Hành động</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows?.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell>{(row as any).orderCode}</TableCell>
              <TableCell>{typeof row.customer === 'string' ? row.customer : row.customer?.fullName}</TableCell>
              <TableCell>{formatCurrency(row.amount || 0)}</TableCell>
              <TableCell>
                <Select
                  size="small"
                  value={row.status || ''}
                  onChange={(e) => updateStatus(row, e.target.value)}
                  disabled={savingId === row._id || row.status === 'Delivered'}
                >
                  <MenuItem value="Pending">Chờ xử lý</MenuItem>
                  <MenuItem value="Processing">Đang xử lý</MenuItem>
                  <MenuItem value="Shipped">Đã gửi</MenuItem>
                  <MenuItem value="Delivered">Đã giao</MenuItem>
                  <MenuItem value="Cancelled">Đã huỷ</MenuItem>
                </Select>
              </TableCell>
              <TableCell>{tStatus(row.paymentStatus)}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" onClick={() => { setDetailRow(row); setDetailOpen(true); }}>Chi tiết</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => askDelete(row._id)}>Xoá</Button>
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
          onPageChange={(_e, newPage) => setPage(newPage as number)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Stack>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết đơn hàng</DialogTitle>
        <DialogContent>
          <Typography>Mã: {detailRow?.transactionId || (detailRow as any)?.orderCode}</Typography>
          <Typography>Khách: {typeof detailRow?.customer === 'string' ? detailRow?.customer : detailRow?.customer?.fullName}</Typography>
          <Typography>Tổng tiền: {formatCurrency(detailRow?.amount || 0)}</Typography>
          <Typography>Trạng thái: {tOrderStatus(detailRow?.status)}</Typography>
          <Typography>Thanh toán: {tStatus(detailRow?.paymentStatus)}</Typography>

          <Typography sx={{ mt: 2, fontWeight: 600 }}>Sản phẩm</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Tên</TableCell><TableCell>SL</TableCell><TableCell>Giá</TableCell><TableCell>Thành tiền</TableCell></TableRow></TableHead>
            <TableBody>
              {(detailRow as any)?.details?.map((it: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{it.productName}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{formatCurrency(it.productPrice)}</TableCell>
                  <TableCell>{formatCurrency((it.productPrice || 0) * (it.quantity || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Typography sx={{ mt: 2, fontWeight: 600 }}>Lịch sử thanh toán</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Phương thức</TableCell><TableCell>Số tiền</TableCell><TableCell>Ngày</TableCell><TableCell>Ghi chú</TableCell></TableRow></TableHead>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p._id}><TableCell>{tMethod(p.paymentMethod)}</TableCell><TableCell>{formatCurrency(p.amount || 0)}</TableCell><TableCell>{new Date(p.paymentDate).toLocaleString()}</TableCell><TableCell>{p.note}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography sx={{ mt: 1 }}>Đã thanh toán: {formatCurrency(summary.totalPaid || 0)} | Còn lại: {formatCurrency(summary.remaining || 0)}</Typography>
        </DialogContent>
        <DialogActions>
          {summary.remaining > 0 && <Button variant="contained" onClick={() => { setPayAmount(summary.remaining); setPayOpen(true); }}>Thêm thanh toán</Button>}
          <Button onClick={handlePrintSafe}>In hoá đơn</Button>
          <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
        </DialogActions>

        <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thanh toán đơn hàng</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>Còn lại: {formatCurrency(summary.remaining)}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="Cash">Tiền mặt</MenuItem>
                  <MenuItem value="BankTransfer">Chuyển khoản</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <NumericInput
                  label="Số tiền"
                  value={payAmount}
                  onChange={(val) => setPayAmount(val)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Ghi chú"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayOpen(false)}>Huỷ</Button>
            <Button variant="contained" onClick={submitPayment}>Xác nhận</Button>
          </DialogActions>
        </Dialog>


      </Dialog>


      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Xác nhận xoá</DialogTitle>
        <DialogContent>
          <Typography>Bạn muốn xoá đơn hàng này?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Huỷ</Button>
          <Button color="error" variant="contained" onClick={performDelete}>Xoá</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>

    </MainCard>
  );
}

