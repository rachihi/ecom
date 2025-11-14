import { useMemo, useState } from 'react';
import useSWR from 'swr';
import axios from 'utils/axios';
import { useDebounce } from 'hooks/useDebounce';
import { formatCurrency } from 'utils/format';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
  Box,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress
} from '@mui/material';
import MainCard from 'components/MainCard';
import { uploadImage } from 'utils/upload';

interface ProductRow {
  _id: string;
  pName: string;
  pPrice?: number;
  pComparePrice?: number;
  pCost?: number;
  pQuantity?: number;
  pCategory?: any;
  pStatus?: string;
  pDiscount?: number;
  pShortDescription?: string;
  pOffer?: string;
  offerExpiry?: string;
  thumbnailImage?: string;
  images?: string[];
  furniture?: {
    dimensions?: { length?: number; width?: number; height?: number; depth?: number };
    materials?: { primary?: string; secondary?: string };
    colors?: string[];
    style?: string[];
    features?: string[];
  };
  isFeatured?: boolean;
  isRecommended?: boolean;
  isNewProduct?: boolean;
  isBestseller?: boolean;
  isOnSale?: boolean;
}

export default function ProductsPage() {
  const [q, setQ] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const debouncedQ = useDebounce(q, 500);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const fetchPage = page + 1;

  // Build query string with all filters
  const queryParams = new URLSearchParams();
  queryParams.append('page', fetchPage.toString());
  queryParams.append('limit', limit.toString());
  if (debouncedQ) queryParams.append('search', debouncedQ);
  if (filterCategory) queryParams.append('category', filterCategory);
  if (filterStatus) queryParams.append('status', filterStatus);
  queryParams.append('sort', sortBy);

  const { data, mutate, isLoading } = useSWR(`/api/product/all-product?${queryParams.toString()}`);
  const rows: ProductRow[] = useMemo(() => data?.products || [], [data]);
  const total: number = data?.pagination?.total || 0;
  const { data: catData } = useSWR('/api/category/all-category?limit=1000');
  const categories: any[] = catData?.Categories || [];

  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [form, setForm] = useState<any>({});

  const [imgPreviews, setImgPreviews] = useState<string[]>([]);
  const [isLoading2, setIsLoading2] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const startCreate = () => {
    setForm({
      pStatus: 'Active',
      pPrice: 0,
      pComparePrice: 0,
      pCost: 0,
      pQuantity: 0,
      pDiscount: 0,
      pOffer: '',
      offerExpiry: '',
      isFeatured: false,
      isRecommended: false,
      isNewProduct: false,
      isBestseller: false,
      isOnSale: false,
      furniture: {
        dimensions: { length: 0, width: 0, height: 0, depth: 0 },
        materials: { primary: '', secondary: '' },
        colors: [],
        style: [],
        features: []
      }
    });
    setImgPreviews([]); // Clear previews when creating new product
    setOpen(true);
  };
  const startEdit = (row: ProductRow) => {
    // Transform furniture.colors from array of objects to array of strings
    let newRow = { ...row };
    if (newRow.furniture && Array.isArray(newRow.furniture.colors)) {
      newRow.furniture = {
        ...newRow.furniture,
        colors: newRow.furniture.colors.map((c: any) => (typeof c === 'object' && c.colorName ? c.colorName : c))
      };
    }
    setForm(newRow);
    // Set imgPreviews to existing images for editing
    setImgPreviews(newRow.images || []);
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading2(true);

      // Validate required fields
      if (!form.pName || !form.pDescription || !form.pPrice || !form.pQuantity || !form.pCategory || !form.pStatus) {
        setSnack({ open: true, message: 'Vui lòng nhập đầy đủ các trường bắt buộc', severity: 'error' });
        setIsLoading2(false);
        return;
      }

      // Tạo payload JSON
      // Upload new images first
      // Sử dụng trực tiếp URLs đã upload từ state
      const imageUrls = imgPreviews;

      const payload = {
        ...form,
        // Basic fields
        pName: form.pName,
        pDescription: form.pDescription,
        pShortDescription: form.pShortDescription || '',
        pPrice: form.pPrice,
        pComparePrice: form.pComparePrice || 0,
        pCost: form.pCost || 0,
        pQuantity: form.pQuantity,
        pCategory: typeof form.pCategory === 'object' ? form.pCategory?._id : form.pCategory,
        pDiscount: form.pDiscount || 0,
        pOffer: form.pOffer || '',
        offerExpiry: form.offerExpiry || '',
        pStatus: form.pStatus,
        pSKU: form.pSKU || '',

        // Feature flags
        isFeatured: form.isFeatured || false,
        isRecommended: form.isRecommended || false,
        isNewProduct: form.isNewProduct !== false,
        isBestseller: form.isBestseller || false,
        isOnSale: form.isOnSale || false,

        // Furniture fields
        furniture: form.furniture || {},

        // Images
        images: imageUrls
      };

      if (!form._id) {
        // Create new product
        await axios.post('/api/product/add-product', payload);
        setSnack({ open: true, message: 'Đã thêm sản phẩm', severity: 'success' });
      } else {
        // Update existing product
        await axios.post('/api/product/edit-product', {
          ...payload,
          pId: form._id
        });
        setSnack({ open: true, message: 'Đã cập nhật sản phẩm', severity: 'success' });
      }

      setOpen(false);
      setImgPreviews([]);
      mutate();
    } catch (error: any) {
      setSnack({
        open: true,
        message: error?.response?.data?.message || 'Lỗi: không thể lưu sản phẩm',
        severity: 'error'
      });
    } finally {
      setIsLoading2(false);
    }
  };

  const performDelete = async () => {
    if (!confirmId) return;
    try {
      await axios.post('/api/product/delete-product', { pId: confirmId });
      setSnack({ open: true, message: 'Đã xoá sản phẩm', severity: 'success' });
      setConfirmId(null);
      mutate();
    } catch (error: any) {
      setSnack({
        open: true,
        message: error?.response?.data?.message || 'Lỗi: không thể xoá sản phẩm',
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Tìm kiếm sản phẩm..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 200 }}
        />
        <Select
          size="small"
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(0);
          }}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Tất cả danh mục</MenuItem>
          {categories.map((c: any) => (
            <MenuItem key={c._id} value={c._id}>
              {c.cName}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);
          }}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">Tất cả trạng thái</MenuItem>
          <MenuItem value="Active">Đang bán</MenuItem>
          <MenuItem value="Inactive">Ngưng bán</MenuItem>
        </Select>
        <Select
          size="small"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="newest">Mới nhất</MenuItem>
          <MenuItem value="oldest">Cũ nhất</MenuItem>
          <MenuItem value="price-low">Giá thấp</MenuItem>
          <MenuItem value="price-high">Giá cao</MenuItem>
          <MenuItem value="popular">Phổ biến</MenuItem>
        </Select>
      </Stack>
      <MainCard
        title="Sản phẩm"
        secondary={
          <Button variant="contained" onClick={startCreate}>
            Thêm sản phẩm
          </Button>
        }
      >
        {isLoading && <Typography>Đang tải...</Typography>}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>
                <strong>Ảnh</strong>
              </TableCell>
              <TableCell>
                <strong>Tên</strong>
              </TableCell>
              <TableCell>
                <strong>Giá</strong>
              </TableCell>
              <TableCell>
                <strong>Giá vốn</strong>
              </TableCell>
              <TableCell>
                <strong>Giá so sánh</strong>
              </TableCell>
              <TableCell>
                <strong>Giảm giá (%)</strong>
              </TableCell>
              <TableCell>
                <strong>Khuyến mãi</strong>
              </TableCell>
              <TableCell>
                <strong>Tồn</strong>
              </TableCell>
              <TableCell>
                <strong>Danh mục</strong>
              </TableCell>
              <TableCell>
                <strong>Phong cách</strong>
              </TableCell>
              <TableCell>
                <strong>Trạng thái</strong>
              </TableCell>
              <TableCell>
                <strong>Nổi bật</strong>
              </TableCell>
              <TableCell>
                <strong>Đề xuất</strong>
              </TableCell>
              <TableCell>
                <strong>Mới về</strong>
              </TableCell>
              <TableCell>
                <strong>Bán chạy</strong>
              </TableCell>
              <TableCell>
                <strong>Đang giảm giá</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Hành động</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows?.map((row) => {
              return (
                <>
                  <TableRow key={row._id} hover>
                    <TableCell>
                      {row.thumbnailImage ? (
                        <img
                          src={`${row.thumbnailImage}`}
                          alt={row.pName}
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: '#eee',
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            No Image
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>{row.pName}</TableCell>
                    <TableCell>{formatCurrency(row.pPrice || 0)}</TableCell>
                    <TableCell>{formatCurrency(row.pCost || 0)}</TableCell>
                    <TableCell>{formatCurrency(row.pComparePrice || 0)}</TableCell>
                    <TableCell>{row.pDiscount || 0}</TableCell>
                    <TableCell>{row.pOffer || ''}</TableCell>
                    <TableCell>{row.pQuantity}</TableCell>
                    <TableCell>{typeof row.pCategory === 'string' ? row.pCategory : row.pCategory?.cName}</TableCell>
                    <TableCell>
                      {row.furniture?.style && row.furniture.style.length > 0 && (
                        <Stack direction="row" spacing={0.5}>
                          {row.furniture.style.slice(0, 2).map((s, i) => (
                            <Chip key={i} label={s} size="small" variant="outlined" />
                          ))}
                          {row.furniture.style.length > 2 && <Chip label={`+${row.furniture.style.length - 2}`} size="small" />}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.pStatus === 'Active' ? 'Đang bán' : 'Ngưng bán'}
                        color={row.pStatus === 'Active' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{row.isFeatured ? <Chip label="✔" color="success" size="small" /> : ''}</TableCell>
                    <TableCell>{row.isRecommended ? <Chip label="✔" color="primary" size="small" /> : ''}</TableCell>
                    <TableCell>{row.isNewProduct ? <Chip label="✔" color="info" size="small" /> : ''}</TableCell>
                    <TableCell>{row.isBestseller ? <Chip label="✔" color="warning" size="small" /> : ''}</TableCell>
                    <TableCell>{row.isOnSale ? <Chip label="✔" color="error" size="small" /> : ''}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => startEdit(row)}>
                          Sửa
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => setConfirmId(row._id)}>
                          Xoá
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
        <Stack alignItems="flex-end" sx={{ mt: 2 }}>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, newPage) => setPage(newPage as number)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </Stack>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{form._id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              {/* Thông tin cơ bản */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Thông tin cơ bản
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tên sản phẩm *"
                      required
                      value={form.pName || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, pName: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={form.pSKU || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, pSKU: e.target.value }))}
                      placeholder="VD: FURN-CHR-001"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Select
                      fullWidth
                      size="small"
                      required
                      value={typeof form.pCategory === 'object' ? form.pCategory?._id : form.pCategory || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, pCategory: e.target.value }))}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Chọn danh mục *</em>
                      </MenuItem>
                      {categories.map((c: any) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.cName}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Mô tả *"
                      required
                      value={form.pDescription || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, pDescription: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Mô tả ngắn (cho danh sách)"
                      value={form.pShortDescription || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, pShortDescription: e.target.value }))}
                      placeholder="VD: Ghế sofa hiện đại màu đen..."
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Giá bán (VND) *"
                      required
                      value={form.pPrice || 0}
                      onChange={(e) => setForm((f: any) => ({ ...f, pPrice: Number(e.target.value) }))}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Giá so sánh (VND)"
                      value={form.pComparePrice || 0}
                      onChange={(e) => setForm((f: any) => ({ ...f, pComparePrice: Number(e.target.value) }))}
                      placeholder="Giá gốc"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Giá vốn (VND)"
                      value={form.pCost || 0}
                      onChange={(e) => setForm((f: any) => ({ ...f, pCost: Number(e.target.value) }))}
                      placeholder="Giá nhập"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Giảm giá (%)"
                      value={form.pDiscount || 0}
                      onChange={(e) => setForm((f: any) => ({ ...f, pDiscount: Number(e.target.value) }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số lượng tồn *"
                      required
                      value={form.pQuantity || 0}
                      onChange={(e) => setForm((f: any) => ({ ...f, pQuantity: Number(e.target.value) }))}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Mô tả khuyến mãi"
                      value={form.pOffer || ''}
                      onChange={(e) => setForm((f: any) => ({ ...f, pOffer: e.target.value }))}
                      placeholder="VD: Giảm 20% cho khách hàng mới"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Hạn khuyến mãi"
                      value={form.offerExpiry ? new Date(form.offerExpiry).toISOString().slice(0, 16) : ''}
                      onChange={(e) =>
                        setForm((f: any) => ({ ...f, offerExpiry: e.target.value ? new Date(e.target.value).toISOString() : '' }))
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Hình ảnh sản phẩm
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="raised-button-file"
                      multiple
                      type="file"
                      onChange={async (e) => {
                        if (e.target.files) {
                          setIsUploading(true);
                          try {
                            const newFiles = Array.from(e.target.files);
                            const uploadedUrls = await Promise.all(newFiles.map((file) => uploadImage(file)));
                            setImgPreviews((prev) => [...prev, ...uploadedUrls]);
                          } catch (error) {
                            setSnack({
                              open: true,
                              message: `Lỗi upload ảnh vui lòng thử lại`,
                              severity: 'error'
                            });
                          } finally {
                            setIsUploading(false);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <label htmlFor="raised-button-file">
                      <Button variant="outlined" component="span" disabled={isUploading}>
                        {isUploading ? <CircularProgress size={24} /> : 'Chọn ảnh'}
                      </Button>
                    </label>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                      {imgPreviews.map((preview, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 100,
                            height: 100,
                            border: '1px solid #ddd',
                            borderRadius: 1,
                            overflow: 'hidden'
                          }}
                        >
                          <img src={preview} alt="Product Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <Button
                            size="small"
                            color="error"
                            sx={{ position: 'absolute', top: 0, right: 0, minWidth: 0, padding: '2px' }}
                            onClick={() => {
                              setImgPreviews((prev) => {
                                const newPreviews = prev.filter((_, i) => i !== index);
                                // Lọc và revoke URL chỉ cho ảnh mới chưa upload
                                const newPreviewsToRevoke = prev
                                  .map((p, i) => ({ url: p, isNew: p.startsWith('blob:'), index: i }))
                                  .filter((x) => x.isNew && x.index === index);
                                newPreviewsToRevoke.forEach((p) => URL.revokeObjectURL(p.url));
                                return newPreviews;
                              });
                            }}
                          >
                            X
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Thông tin nội thất */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Thông tin nội thất
                </Typography>
                <Grid container spacing={2}>
                  {/* Kích thước */}
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Dài (cm)"
                      size="small"
                      value={form.furniture?.dimensions?.length || 0}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            dimensions: { ...f.furniture?.dimensions, length: Number(e.target.value) }
                          }
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Rộng (cm)"
                      size="small"
                      value={form.furniture?.dimensions?.width || 0}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            dimensions: { ...f.furniture?.dimensions, width: Number(e.target.value) }
                          }
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cao (cm)"
                      size="small"
                      value={form.furniture?.dimensions?.height || 0}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            dimensions: { ...f.furniture?.dimensions, height: Number(e.target.value) }
                          }
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Sâu (cm)"
                      size="small"
                      value={form.furniture?.dimensions?.depth || 0}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            dimensions: { ...f.furniture?.dimensions, depth: Number(e.target.value) }
                          }
                        }))
                      }
                    />
                  </Grid>

                  {/* Chất liệu */}
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Chất liệu chính"
                      size="small"
                      value={form.furniture?.materials?.primary || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            materials: { ...f.furniture?.materials, primary: e.target.value }
                          }
                        }))
                      }
                      placeholder="VD: Gỗ tự nhiên, Vải bền"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Chất liệu phụ"
                      size="small"
                      value={form.furniture?.materials?.secondary || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            materials: { ...f.furniture?.materials, secondary: e.target.value }
                          }
                        }))
                      }
                      placeholder="VD: Khung sắt, Nệm xốp"
                    />
                  </Grid>

                  {/* Màu sắc */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Màu sắc (cách nhau bằng dấu phẩy)"
                      size="small"
                      value={form.furniture?.colors?.join(', ') || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            colors: e.target.value
                              .split(',')
                              .map((c: string) => c.trim())
                              .filter((c: string) => c)
                          }
                        }))
                      }
                      placeholder="VD: Đen, Trắng, Xám"
                    />
                  </Grid>

                  {/* Phong cách */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phong cách (cách nhau bằng dấu phẩy)"
                      size="small"
                      value={form.furniture?.style?.join(', ') || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            style: e.target.value
                              .split(',')
                              .map((s: string) => s.trim())
                              .filter((s: string) => s)
                          }
                        }))
                      }
                      placeholder="VD: Hiện đại, Tối giản, Cổ điển"
                    />
                  </Grid>

                  {/* Tính năng */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Tính năng (cách nhau bằng dấu phẩy)"
                      size="small"
                      value={form.furniture?.features?.join(', ') || ''}
                      onChange={(e) =>
                        setForm((f: any) => ({
                          ...f,
                          furniture: {
                            ...f.furniture,
                            features: e.target.value
                              .split(',')
                              .map((f: string) => f.trim())
                              .filter((f: string) => f)
                          }
                        }))
                      }
                      placeholder="VD: Có thể gập, Có ngăn chứa, Chống nước"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Trạng thái & Hình ảnh */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Khác
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Select
                      fullWidth
                      size="small"
                      required
                      value={form.pStatus || 'Active'}
                      onChange={(e) => setForm((f: any) => ({ ...f, pStatus: e.target.value }))}
                    >
                      <MenuItem value="Active">Đang bán *</MenuItem>
                      <MenuItem value="Inactive">Ngưng bán *</MenuItem>
                    </Select>
                  </Grid>
                  {/* Feature Flags */}
                  <Grid item xs={6}>
                    <FormGroup row>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.isFeatured || false}
                            onChange={(e) => setForm((f: any) => ({ ...f, isFeatured: e.target.checked }))}
                          />
                        }
                        label="Nổi bật"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.isRecommended || false}
                            onChange={(e) => setForm((f: any) => ({ ...f, isRecommended: e.target.checked }))}
                          />
                        }
                        label="Đề xuất"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.isNewProduct || false}
                            onChange={(e) => setForm((f: any) => ({ ...f, isNewProduct: e.target.checked }))}
                          />
                        }
                        label="Mới về"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.isBestseller || false}
                            onChange={(e) => setForm((f: any) => ({ ...f, isBestseller: e.target.checked }))}
                          />
                        }
                        label="Bán chạy"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={form.isOnSale || false}
                            onChange={(e) => setForm((f: any) => ({ ...f, isOnSale: e.target.checked }))}
                          />
                        }
                        label="Đang giảm giá"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Huỷ</Button>
            <Button variant="contained" onClick={handleSave} disabled={isLoading2}>
              {isLoading2 ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
          <DialogTitle>Xác nhận xoá</DialogTitle>
          <DialogContent>
            <Typography>Bạn có chắc muốn xoá sản phẩm này? Hành động này không thể hoàn tác.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmId(null)}>Huỷ</Button>
            <Button color="error" variant="contained" onClick={performDelete}>
              Xoá
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        </Snackbar>
      </MainCard>
    </>
  );
}
