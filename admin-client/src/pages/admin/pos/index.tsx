import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { formatCurrency } from 'utils/format';
import { Autocomplete, Button, FormControl, FormControlLabel, Grid, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import MainCard from 'components/MainCard';

interface ItemForm { product: any; quantity: number; price: number }

export default function PosPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { data: productData } = useSWR(`/api/product/all-product?q=${encodeURIComponent(debouncedSearch)}&limit=10`);
  const products: any[] = productData?.Products || [];

  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebounce(customerSearch, 500);
  const { data: customerData } = useSWR(`/api/customers?q=${encodeURIComponent(debouncedCustomerSearch)}&limit=10`);
  const customers: any[] = customerData?.customers || [];

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer'>('Cash');

  const [items, setItems] = useState<ItemForm[]>([]);
  const totalAmount = useMemo(() => items.reduce((s, it) => s + (Number(it.quantity)||0) * (Number(it.price)||0), 0), [items]);
  const [message, setMessage] = useState<string>('');

  const addItem = () => setItems((it) => [...it, { product: null, quantity: 1, price: 0 }]);
  const updateItem = (idx: number, patch: Partial<ItemForm>) => setItems((it) => it.map((row, i) => {
    if (i !== idx) return row;
    const updated: ItemForm = { ...row, ...patch } as any;
    if (patch.product) { updated.price = (patch.product as any)?.pPrice || 0; }
    return updated;
  }));

  const handleSelectProduct = (product: any) => {
    if (!product) return;
    setItems((prev)=>{
      const idx = prev.findIndex((it)=> it.product?._id === product._id);
      if (idx >= 0) {
        return prev.map((it, i)=> i===idx ? { ...it, quantity: (Number(it.quantity)||0) + 1 } : it);
      }
      return [...prev, { product, quantity: 1, price: product.pPrice || 0 }];
    });
    setSelectedProduct(null);
  };

  const removeItem = (idx: number) => setItems((it) => it.filter((_, i) => i !== idx));

  const submit = async () => {
    setMessage('');
    const payload: any = {
      customerId: selectedCustomer?._id || null,
      items: items.filter((i)=> i.product).map((i) => ({ product: i.product._id, quantity: Number(i.quantity) || 1 })),
      amount: totalAmount,
      paymentMethod: paymentMethod
    };
    try {
      const res = await axios.post('/api/pos/order', payload);
      setMessage(res.data?.success || 'Đã tạo');
      setItems([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setPaymentMethod('Cash');
    } catch (e: any) {
      setMessage(e?.response?.data?.error || e?.error || 'Lỗi');
    }
  };

  return (
    <MainCard title="POS bán hàng">
      <Stack spacing={2}>
        {message && <Typography color="primary">{message}</Typography>}

        <Typography variant="h6">Khách hàng</Typography>
        <Autocomplete
          options={customers}
          value={selectedCustomer}
          onChange={(_e, val) => setSelectedCustomer(val)}
          onInputChange={(_e, val) => setCustomerSearch(val || '')}
          getOptionLabel={(o: any) => o?.fullName ? `${o.fullName} - ${o.phoneNumber || ''}` : ''}
          renderInput={(params) => <TextField {...params} label="Chọn khách hàng" fullWidth />}
        />

        <Typography variant="h6" sx={{ mt: 2 }}>Phương thức thanh toán</Typography>
        <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'BankTransfer')}>
          <FormControlLabel value="Cash" control={<Radio />} label="Tiền mặt" />
          <FormControlLabel value="BankTransfer" control={<Radio />} label="Chuyển khoản" />
        </RadioGroup>

        <Typography variant="h6" sx={{ mt: 2 }}>Sản phẩm</Typography>
        <Autocomplete
          options={products}
          value={selectedProduct}
          onChange={(_e, val) => handleSelectProduct(val)}
          onInputChange={(_e, val) => setSearch(val || '')}
          getOptionLabel={(o: any) => (o?.pName ? `${o.pName} - ${formatCurrency(o.pPrice || 0)}` : '')}
          renderInput={(params) => <TextField {...params} label="Tìm sản phẩm" fullWidth />}
        />
        <Stack spacing={1} sx={{ mt: 1 }}>
          {items.map((row, idx) => (
            <Grid container spacing={1} alignItems="center" key={idx}>
              <Grid item xs={5} md={5}>
                <Typography>{row.product?.pName || ''}</Typography>
              </Grid>
              <Grid item xs={2} md={2}>
                <TextField fullWidth type="number" label={"SL"} value={row.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={2} md={2}>
                <TextField fullWidth type="number" label="Đơn giá" value={row.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} />
              </Grid>
              <Grid item xs={2} md={2}>
                <Typography>{formatCurrency((Number(row.quantity)||0) * (Number(row.price)||0))}</Typography>
              </Grid>
              <Grid item xs={1} md={1}>
                <Button color="error" onClick={() => removeItem(idx)}>Xoá</Button>
              </Grid>
            </Grid>
          ))}
        </Stack>

        <Typography variant="h6" sx={{ mt: 2 }}>Tổng tiền</Typography>
        <Typography variant="h5" color="primary">{formatCurrency(totalAmount)}</Typography>

        <Stack direction="row" justifyContent="flex-end">
          <Button variant="contained" onClick={submit} disabled={items.length === 0 || totalAmount <= 0 || items.some((it)=> !it.product)}>
            Tạo đơn POS
          </Button>
        </Stack>
      </Stack>
    </MainCard>
  );
}

