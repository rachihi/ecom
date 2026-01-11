import { displayDate, displayMoney, displayActionMessage } from '@/helpers/utils';
import { getOrders } from '@/redux/actions/orderActions';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadingOutlined, EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Modal } from '@/components/common';
import { orderAPI } from '@/services/api';

import axios from 'axios';
const UserOrdersTab = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.profile);
  const { orders, isLoading, pagination } = useSelector((state) => ({
    orders: state.orders.orders,
    isLoading: state.app.loading,
    pagination: state.orders.pagination || { page: 1, pages: 1, total: 0 }
  }));
  // Modal State
  const [displayModal, setDisplayModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = (page) => {
    if (profile && profile.id) {
      dispatch(getOrders({ page }));
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [profile]);

  const tOrderStatus = (s) => {
    if (s === 'Pending') return 'Chờ xử lý';
    if (s === 'Processing') return 'Đang xử lý';
    if (s === 'Shipped') return 'Đã gửi';
    if (s === 'Delivered') return 'Đã giao';
    if (s === 'Cancelled') return 'Đã huỷ';
    return s;
  };

  const tPaymentStatus = (s) => {
    if (s === 'Paid') return 'Đã thanh toán';
    if (s === 'Unpaid') return 'Chưa thanh toán';
    if (s === 'Partial') return 'Thanh toán 1 phần';
    return s || 'Chưa thanh toán';
  };

  const onOpenModal = (order) => {
    setSelectedOrder(order);
    setDisplayModal(true);
  };

  const onCloseModal = () => {
    setDisplayModal(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Bạn có chắc chắn muốn huỷ đơn hàng này?')) {
      try {
        const res = await orderAPI.cancelOrder(orderId);
        if (res.data.success) {
          displayActionMessage('Đã huỷ đơn hàng thành công!', 'success');
          fetchOrders(pagination.page);
          if (selectedOrder && selectedOrder.id === orderId) {
            onCloseModal();
          }
        } else {
          displayActionMessage(res.data.error || 'Có lỗi xảy ra', 'error');
        }
      } catch (error) {
        displayActionMessage(error.response?.data?.error || 'Lỗi kết nối', 'error');
      }
    }
  };

  return (
    <div className="user-orders" style={{ minHeight: '80vh' }}>
      <h3>Đơn hàng của tôi</h3>
      {isLoading ? (
        <div className="flex-center p-4">
          <LoadingOutlined />&nbsp;Đang tải...
        </div>
      ) : (
        <>
          {(!orders || orders.length === 0) ? (
            <strong><span className="text-subtle">Bạn chưa có đơn hàng nào</span></strong>
          ) : (
            <div className="order-list-table-wrapper">
              <table className="table table-bordered table-striped" style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Mã ĐH</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Ngày đặt</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Trạng thái</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Thanh toán</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Tổng tiền</th>
                    <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>
                        <strong>{order.transactionId || order.orderCode || order.orderNumber}</strong>
                      </td>
                      <td style={{ padding: '8px' }}>{displayDate(order.createdAt)}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-green-800'}`}>
                          {tOrderStatus(order.status)}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        {tPaymentStatus(order.paymentStatus)}
                      </td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{displayMoney(order.totalAmount)}</td>
                      <td style={{ padding: '8px' }}>
                        <button
                          className="button button-small"
                          onClick={() => onOpenModal(order)}
                          style={{ fontSize: '12px', padding: '4px 8px', marginRight: '5px' }}
                        >
                          <EyeOutlined /> &nbsp; Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="flex-center" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  className="button button-small button-muted"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchOrders(pagination.page - 1)}
                >
                  Trang trước
                </button>
                <span>Trang {pagination.page} / {pagination.pages}</span>
                <button
                  className="button button-small button-muted"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchOrders(pagination.page + 1)}
                >
                  Trang sau
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={displayModal} onRequestClose={onCloseModal}>
        {selectedOrder && (
          <div style={{ minWidth: '500px' }}>
            <h3 className="text-center">Chi tiết đơn hàng</h3>
            <div className="text-center text-subtle mb-4">{selectedOrder.transactionId || selectedOrder.orderCode || selectedOrder.orderNumber}</div>

            <div style={{ marginBottom: '20px' }}>
              <p><strong>Ngày đặt:</strong> {displayDate(selectedOrder.createdAt)}</p>
              <p><strong>Trạng thái:</strong> {tOrderStatus(selectedOrder.status)}</p>
              <p><strong>Thanh toán:</strong> {tPaymentStatus(selectedOrder.paymentStatus)}</p>
              <p><strong>Địa chỉ giao hàng:</strong> {selectedOrder.shippingAddress}</p>
            </div>

            <div className="product-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div className="flex justify-between items-center py-2 border-b" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>
                <div style={{ flex: 2 }}>Sản phẩm</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Đơn giá</div>
                <div style={{ flex: 1, textAlign: 'right' }}>Thành tiền</div>
              </div>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                  <div className="flex items-center" style={{ flex: 2 }}>
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} style={{ width: 40, height: 40, objectFit: 'contain', marginRight: 10 }} />
                    )}
                    <div>
                      <div>{item.productName}</div>
                      <div className="text-subtle text-xs">x{item.quantity}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    {displayMoney(item.productPrice)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                    {displayMoney(item.totalPrice || (item.productPrice * item.quantity))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-4 pt-4 border-t" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '10px', borderTop: '2px solid #ddd', alignItems: 'center' }}>
              <strong>Tổng tiền:</strong>
              <strong style={{ fontSize: '1.5rem', color: '#000' }}>{displayMoney(selectedOrder.totalAmount)}</strong>
            </div>
            <div className="flex-right mt-2" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              {selectedOrder.paymentStatus === 'Unpaid' && selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                <button
                  className="button button-small button-danger"
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#e53e3e', borderColor: '#e53e3e', color: 'white', marginRight: 'auto' }}
                >
                  <CloseCircleOutlined /> &nbsp; Huỷ Đơn Hàng
                </button>
              )}
              <button className="button button-small button-muted" onClick={onCloseModal}>Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserOrdersTab;
