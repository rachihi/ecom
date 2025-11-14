// management menu items for admin features

// assets
import { DocumentCode2 } from 'iconsax-react';

// type
import { NavItemType } from 'types/menu';

const Icon = DocumentCode2;

const management: NavItemType = {
  id: 'management',
  title: 'Quản lý',
  type: 'group',
  children: [
    { id: 'pos', title: 'POS bán hàng', type: 'item', url: '/admin/pos', icon: Icon },
    { id: 'products', title: 'Sản phẩm', type: 'item', url: '/admin/products', icon: Icon },
    { id: 'categories', title: 'Danh mục', type: 'item', url: '/admin/categories', icon: Icon },
    { id: 'orders', title: 'Đơn hàng', type: 'item', url: '/admin/orders', icon: Icon },
    { id: 'customers', title: 'Khách hàng', type: 'item', url: '/admin/customers', icon: Icon },
    { id: 'suppliers', title: 'Nhà cung cấp', type: 'item', url: '/admin/suppliers', icon: Icon },
    { id: 'warehouse', title: 'Kho', type: 'item', url: '/admin/warehouse', icon: Icon },
    { id: 'purchase-orders', title: 'Nhập hàng', type: 'item', url: '/admin/purchase-orders', icon: Icon },
   // { id: 'payments', title: 'Thanh toán', type: 'item', url: '/admin/payments', icon: Icon },
    { id: 'cashbook', title: 'Sổ quỹ', type: 'item', url: '/admin/cashbook', icon: Icon },
  ]
};

export default management;

