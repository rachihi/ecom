import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { formatCurrency } from 'utils/format';

import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, MenuItem, Radio, RadioGroup, Select, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import MainCard from 'components/MainCard';

interface PurchaseOrderRow { _id: string; orderCode?: string; supplier: any; items?: any[]; details?: any[]; totalAmount: number; totalPaid?: number; status: string; warehouseStatus: string; paymentStatus: string; createdAt?: string; totalQuantity?: number }

export default function PurchaseOrdersPage() {
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const { data, mutate, isLoading } = useSWR(`/api/purchase-orders?page=${page + 1}&limit=${limit}&q=${encodeURIComponent(debouncedQ)}`);
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows: PurchaseOrderRow[] = useMemo(() => data?.purchaseOrders || [], [data]);
  const total: number = data?.total || 0;
  const { data: supData } = useSWR('/api/suppliers?limit=1000');
  const suppliers: any[] = supData?.suppliers || [];
  const { data: prodData } = useSWR('/api/product/all-product?limit=1000');
  const products: any[] = prodData?.products || [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ items: [{ product: '', quantity: 1, price: 0 }], payment: { amount: 0, paymentMethod: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), note: '' } });
  const [payOpen, setPayOpen] = useState(false);
  const [payRow, setPayRow] = useState<PurchaseOrderRow | null>(null);
  const [payment, setPayment] = useState<any>({ amount: 0, paymentMethod: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), note: '' });
  const { data: payData, mutate: mutatePay } = useSWR(payRow ? `/api/payments/purchase-order/${payRow._id}` : null);
  const remaining: number = payData?.summary?.remaining ?? 0;

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<PurchaseOrderRow | null>(null);

  const totalAmount = useMemo(() => (form.items || []).reduce((s: number, i: any) => s + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0), [form.items]);

  const startCreate = () => { setForm({ items: [], payment: { amount: 0, paymentMethod: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), note: '' } }); setOpen(true); };
  const startEdit = (row: PurchaseOrderRow) => {
    const items = (row.details || []).map((d: any) => ({ product: d.productId || d.product, quantity: d.quantity, price: d.productPrice }));
    setForm({ ...row, items, supplier: typeof row.supplier === 'object' ? row.supplier._id : row.supplier, payment: { amount: 0, paymentMethod: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), note: '' } });
    setOpen(true);
  };

  const addItem = () => setForm((f: any) => ({ ...f, items: [...(f.items || []), { product: '', quantity: 1, price: 0 }] }));
  const updateItem = (idx: number, patch: any) => setForm((f: any) => ({ ...f, items: f.items.map((it: any, i: number) => i === idx ? { ...it, ...patch } : it) }));
  const removeItem = (idx: number) => setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== idx) }));

  const handleSave = async () => {
    try {
      const body: any = { supplier: form.supplier, items: form.items, totalAmount };
      // Include payment if creating new order and payment amount > 0
      if (!form._id && form.payment && Number(form.payment.amount) > 0) {
        body.payment = form.payment;
      }
      if (!form._id) await axios.post('/api/purchase-orders/', body);
      else await axios.put(`/api/purchase-orders/${form._id}`, body);
      setOpen(false); setSnack({ open: true, message: 'Đã lưu', severity: 'success' }); mutate();
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.error || 'Lỗi lưu', severity: 'error' });
    }
  };
  const handleDelete = async (id: string) => { if (!confirm('Xác nhận xóa?')) return; await axios.delete(`/api/purchase-orders/${id}`); mutate(); };
  const askDelete = (id: string) => setConfirmId(id);
  const performDelete = async () => {
    if (!confirmId) return;
    try {
      await axios.delete(`/api/purchase-orders/${confirmId}`);
      setSnack({ open: true, message: 'Đã xoá', severity: 'success' });
      mutate();
    } catch (err) {
      setSnack({ open: true, message: 'Lỗi xoá', severity: 'error' });
    } finally {
      setConfirmId(null);
    }
  };

  const markReceived = async (row: PurchaseOrderRow) => {
    try {
      await axios.put(`/api/purchase-orders/${row._id}/receive`);
      setSnack({ open: true, message: 'Đã nhập kho', severity: 'success' });
      mutate();
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.error || 'Lỗi nhập kho', severity: 'error' });
    }
  };

  const openPay = (row: PurchaseOrderRow) => { setPayRow(row); setPayment({ amount: 0, paymentMethod: 'Cash', paymentDate: new Date().toISOString().slice(0, 10), note: '' }); setPayOpen(true); };
  const openDetail = (row: PurchaseOrderRow) => { setDetailRow(row); setDetailOpen(true); };

  const createPayment = async () => {
    if (!payRow) return;
    try {
      await axios.post('/api/payments/', { purchaseOrder: payRow._id, ...payment });
      setSnack({ open: true, message: 'Đã tạo thanh toán', severity: 'success' });
      await mutatePay();
      mutate();
      if ((payData?.summary?.remaining ?? 0) <= 0) setPayOpen(false);
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.error || 'Lỗi tạo thanh toán', severity: 'error' });
    }
  };

  return (
    <>

      <MainCard title="Đơn nhập hàng" secondary={<Button variant="contained" onClick={startCreate}>Thêm</Button>}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField size="small" placeholder="Tìm kiếm đơn nhập hàng" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </Stack>
        {isLoading && <Typography>Đang tải...</Typography>}

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Nhà cung cấp</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Tổng SL</TableCell>
              <TableCell>Đã thanh toán</TableCell>
              <TableCell>TT Đơn</TableCell>
              <TableCell>TT Nhập kho</TableCell>
              <TableCell>TT Thanh toán</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => {
              const statusLabel = row.status === 'Pending' ? 'Đang giao dịch' : row.status === 'Completed' ? 'Hoàn thành' : 'Hủy';
              const warehouseLabel = row.warehouseStatus === 'Received' ? 'Đã nhập' : 'Chưa nhập';
              const paymentLabel = row.paymentStatus === 'Paid' ? 'Đã thanh toán' : row.paymentStatus === 'Partial' ? 'Thanh toán 1 phần' : 'Chưa thanh toán';

              return (
                <TableRow key={row._id} hover>
                  <TableCell>{row.orderCode || '-'}</TableCell>
                  <TableCell>{typeof row.supplier === 'string' ? row.supplier : row.supplier?.name}</TableCell>
                  <TableCell>{formatCurrency(row.totalAmount)}</TableCell>
                  <TableCell>{row.totalQuantity || 0}</TableCell>
                  <TableCell>{formatCurrency(row.totalPaid || 0)}</TableCell>
                  <TableCell>{statusLabel}</TableCell>
                  <TableCell>{warehouseLabel}</TableCell>
                  <TableCell>{paymentLabel}</TableCell>
                  <TableCell>{row.createdAt && new Date(row.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => openDetail(row)}>Chi tiết</Button>
                      <Button size="small" onClick={() => startEdit(row)} disabled={row.paymentStatus !== 'Unpaid' || row.warehouseStatus === 'Received'}>Sửa</Button>
                      <Button size="small" onClick={() => openPay(row)} disabled={row.paymentStatus === 'Paid'}>Thanh toán</Button>
                      <Button size="small" onClick={() => markReceived(row)} disabled={row.warehouseStatus === 'Received'}>Nhập kho</Button>
                      <Button size="small" color="error" onClick={() => askDelete(row._id)}>Xóa</Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total || 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />


        {/* Form PO */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{form._id ? 'Sửa đơn nhập' : 'Thêm đơn nhập'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={0.5}>
              <Grid item xs={12}>
                <Select fullWidth size="small" value={form.supplier || ''} onChange={(e) => setForm((f: any) => ({ ...f, supplier: e.target.value }))} displayEmpty>
                  <MenuItem value=""><em>Chọn nhà cung cấp</em></MenuItem>
                  {suppliers.map((s: any) => (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  options={products}
                  getOptionLabel={(option) => option.pName || ''}
                  renderInput={(params) => <TextField {...params} label="Tìm kiếm và thêm sản phẩm" placeholder="Nhập tên sản phẩm..." />}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setForm((f: any) => {
                        const items = f.items || [];
                        const exists = items.find((i: any) => i.product === newValue._id);
                        if (exists) {
                          return {
                            ...f,
                            items: items.map((i: any) => i.product === newValue._id ? { ...i, quantity: (i.quantity || 0) + 1 } : i)
                          };
                        } else {
                          return {
                            ...f,
                            items: [...items, { product: newValue._id, quantity: 1, price: newValue.pCost || 0 }]
                          };
                        }
                      });
                    }
                  }}
                  value={null}
                  blurOnSelect
                />
              </Grid>
              {(form.items || []).map((it: any, idx: number) => (
                <Grid key={idx} item xs={12} container spacing={1} alignItems="center">
                  <Grid item xs={6}>
                    <Select fullWidth size="small" value={it.product || ''} onChange={(e) => updateItem(idx, { product: e.target.value })} displayEmpty>
                      <MenuItem value=""><em>Chọn sản phẩm</em></MenuItem>
                      {products.map((p: any) => (<MenuItem key={p._id} value={p._id}>{p.pName}</MenuItem>))}
                    </Select>
                  </Grid>
                  <Grid item xs={2}><TextField fullWidth type="number" label="SL" value={it.quantity || ''} onChange={(e) => updateItem(idx, { quantity: Math.max(0, Number(e.target.value)) })} InputProps={{ inputProps: { min: 0 } }} /></Grid>
                  <Grid item xs={3}><TextField fullWidth type="number" label="Giá" value={it.price || ''} onChange={(e) => updateItem(idx, { price: Math.max(0, Number(e.target.value)) })} InputProps={{ inputProps: { min: 0 } }} /></Grid>
                  <Grid item xs={1}><Button onClick={() => removeItem(idx)}>Xóa</Button></Grid>
                </Grid>
              ))}
              <Grid item xs={12}><Typography fontWeight={600}>Tổng tiền: {formatCurrency(totalAmount)}</Typography></Grid>

              {!form._id && (
                <>
                  <Grid item xs={12}><Typography variant="h6" sx={{ mt: 1 }}>Thanh toán (tùy chọn)</Typography></Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số tiền thanh toán"
                      value={form.payment?.amount || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, payment: { ...f.payment, amount: Number(e.target.value) } }))}
                      helperText={`Tối đa: ${formatCurrency(totalAmount)}`}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <RadioGroup
                      row
                      value={form.payment?.paymentMethod || 'Cash'}
                      onChange={(e) => setForm((f: any) => ({ ...f, payment: { ...f.payment, paymentMethod: e.target.value } }))}
                    >
                      <FormControlLabel value="Cash" control={<Radio />} label="Tiền mặt" />
                      <FormControlLabel value="BankTransfer" control={<Radio />} label="Chuyển khoản" />
                    </RadioGroup>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Ngày thanh toán"
                      value={form.payment?.paymentDate || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, payment: { ...f.payment, paymentDate: e.target.value } }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      value={form.payment?.note || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, payment: { ...f.payment, note: e.target.value } }))}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleSave}>Lưu</Button>
          </DialogActions>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={payOpen} onClose={() => setPayOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thanh toán đơn nhập</DialogTitle>
          <DialogContent>
            <Typography my={1}>Còn lại: {formatCurrency(remaining)}</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Select fullWidth size="small" value={payment.paymentMethod} onChange={(e) => setPayment((p: any) => ({ ...p, paymentMethod: e.target.value }))}>
                  <MenuItem value="Cash">Tiền mặt</MenuItem>
                  <MenuItem value="BankTransfer">Chuyển khoản</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={6}><TextField fullWidth type="date" value={payment.paymentDate} onChange={(e) => setPayment((p: any) => ({ ...p, paymentDate: e.target.value }))} /></Grid>
              <Grid item xs={6}><TextField fullWidth type="number" label="Số tiền" value={payment.amount || ''} onChange={(e) => setPayment((p: any) => ({ ...p, amount: Number(e.target.value) }))} /></Grid>
              <Grid item xs={6}><TextField fullWidth label="Ghi chú" value={payment.note} onChange={(e) => setPayment((p: any) => ({ ...p, note: e.target.value }))} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayOpen(false)}>Đóng</Button>
            <Button variant="contained" onClick={createPayment} disabled={remaining <= 0 || payment.amount <= 0}>Tạo</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <Typography>Bạn có chắc muốn xóa?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmId(null)}>Hủy</Button>
            <Button color="error" variant="contained" onClick={performDelete}>Xóa</Button>
          </DialogActions>
        </Dialog>
        {/* Dialog chi tiết đơn nhập */}
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Chi tiết đơn nhập hàng</DialogTitle>
          <DialogContent>
            {detailRow && (
              <Grid container spacing={2} mt={0.5}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Mã đơn</Typography>
                  <Typography variant="body1">{detailRow.orderCode || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Nhà cung cấp</Typography>
                  <Typography variant="body1">{typeof detailRow.supplier === 'string' ? detailRow.supplier : detailRow.supplier?.name}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Tổng tiền</Typography>
                  <Typography variant="body1">{formatCurrency(detailRow.totalAmount)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Đã thanh toán</Typography>
                  <Typography variant="body1">{formatCurrency(detailRow.totalPaid || 0)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Còn lại</Typography>
                  <Typography variant="body1">{formatCurrency(detailRow.totalAmount - (detailRow.totalPaid || 0))}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Trạng thái đơn</Typography>
                  <Typography variant="body1">{detailRow.status === 'Pending' ? 'Đang giao dịch' : detailRow.status === 'Completed' ? 'Hoàn thành' : 'Hủy'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Trạng thái nhập kho</Typography>
                  <Typography variant="body1">{detailRow.warehouseStatus === 'Received' ? 'Đã nhập' : 'Chưa nhập'}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Trạng thái thanh toán</Typography>
                  <Typography variant="body1">{detailRow.paymentStatus === 'Paid' ? 'Đã thanh toán' : detailRow.paymentStatus === 'Partial' ? 'Thanh toán 1 phần' : 'Chưa thanh toán'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Ngày tạo</Typography>
                  <Typography variant="body1">{detailRow.createdAt && new Date(detailRow.createdAt).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 1 }}>Sản phẩm</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên sản phẩm</TableCell>
                        <TableCell align="right">Số lượng</TableCell>
                        <TableCell align="right">Đơn giá</TableCell>
                        <TableCell align="right">Thành tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(detailRow.details || []).map((detail: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{detail.productName || '-'}</TableCell>
                          <TableCell align="right">{detail.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(detail.productPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(detail.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>

      </MainCard >
    </>
  );
}
