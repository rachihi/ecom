import { CHECKOUT_STEP_1, CHECKOUT_STEP_2 } from '@/constants/routes';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { displayActionMessage } from '@/helpers/utils';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React, { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';
import Total from './Total';
import { orderAPI } from '@/services/api';
import { clearBasket } from '@/redux/actions/basketActions';
import { resetCheckout } from '@/redux/actions/checkoutActions';

const Payment = ({ shipping, payment, subtotal }) => {
  useDocumentTitle('Đặt hàng - Bước 3 | 102 Concept');
  useScrollTop();

  const dispatch = useDispatch();
  const history = useHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const basket = useSelector((state) => state.basket);
  const profile = useSelector((state) => state.profile);
  const [paymentMode, setPaymentMode] = useState('cash');

  const onConfirm = async (paymentType = 'cash') => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const orderData = {
        allProduct: basket.map(item => ({
          id: item.id,
          quantitiy: item.quantity,
        })),
        amount: subtotal + (shipping.isInternational ? 50 : 0),
        transactionId: `TXN-${Date.now()}`,
        address: `${shipping.fullname}, ${shipping.address}`,
        phone: parseInt(String(shipping.mobile || '').replace(/\D/g, '') || '0000000000'),
        paymentStatus: paymentType === 'paypal' ? 'Paid' : 'Unpaid',
        paymentMethod: paymentType === 'paypal' ? 'BankTransfer' : 'Cash',
      };

      if (profile && profile.id) {
        orderData.customerId = profile.id;
      } else {
        orderData.customer = {
          fullName: shipping.fullname,
          phoneNumber: shipping.mobile,
          email: shipping.email || 'guest@example.com',
          address: shipping.address,
        };
      }

      const response = await orderAPI.createOrder(orderData);

      if (response.data.success || response.data.order) {
        dispatch(clearBasket());
        dispatch(resetCheckout());
        displayActionMessage('Đặt hàng thành công!', 'success');
        setTimeout(() => history.push('/'), 1500);
      } else {
        displayActionMessage(response.data.message || 'Tạo đơn hàng thất bại', 'error');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      displayActionMessage(error.response?.data?.message || 'Tạo đơn hàng thất bại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shipping || !shipping.isDone) {
    return <Redirect to={CHECKOUT_STEP_1} />;
  }

  const totalAmount = subtotal + (shipping.isInternational ? 50 : 0);

  return (
    <div className="checkout">
      <StepTracker current={3} />
      <div className="checkout-step-3">
        <h3 className="text-center">Thanh toán</h3>
        <br />
        <span className="d-block padding-s">Phương thức thanh toán</span>
        <div className={`checkout-fieldset-collapse ${paymentMode === 'cash' ? 'is-selected-payment' : ''}`}>
          <div className="checkout-field margin-0">
            <div className="checkout-checkbox-field">
              <input
                checked={paymentMode === 'cash'}
                id="modeCash"
                name="paymentMode"
                onChange={() => setPaymentMode('cash')}
                type="radio"
              />
              <label className="d-flex w-100" htmlFor="modeCash">
                <div className="d-flex-grow-1 margin-left-s">
                  <h4 className="margin-0">Thanh toán khi nhận hàng (COD)</h4>
                  <span className="text-subtle d-block margin-top-s">
                    Thanh toán bằng tiền mặt khi nhận hàng
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className={`checkout-fieldset-collapse ${paymentMode === 'paypal' ? 'is-selected-payment' : ''}`}>
          <div className="checkout-field margin-0">
            <div className="checkout-checkbox-field">
              <input
                checked={paymentMode === 'paypal'}
                id="modePayPal"
                name="paymentMode"
                onChange={() => setPaymentMode('paypal')}
                type="radio"
              />
              <label className="d-flex w-100" htmlFor="modePayPal">
                <div className="d-flex-grow-1 margin-left-s">
                  <h4 className="margin-0">PayPal</h4>
                  <span className="text-subtle d-block margin-top-s">
                    Thanh toán nhanh chóng và an toàn với PayPal.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
        <br />

        {paymentMode === 'paypal' ? (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <PayPalScriptProvider options={{ "client-id": "sb", currency: "USD" }}>
              <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [{ amount: { value: totalAmount.toFixed(2) } }]
                  });
                }}
                onApprove={(data, actions) => {
                  return actions.order.capture().then(() => {
                    onConfirm('paypal');
                  });
                }}
              />
            </PayPalScriptProvider>
            <br />
            <div className="checkout-shipping-action">
              <button
                className="button button-muted"
                onClick={() => history.push(CHECKOUT_STEP_2)}
                type="button"
              >
                Quay lại
              </button>
            </div>
          </div>
        ) : (
          <Total
            isInternational={shipping.isInternational}
            subtotal={subtotal}
            onClickBack={() => history.push(CHECKOUT_STEP_2)}
            onConfirm={() => onConfirm('cash')}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

Payment.propTypes = {
  shipping: PropType.shape({
    isDone: PropType.bool,
    isInternational: PropType.bool
  }).isRequired,
  payment: PropType.shape({
    name: PropType.string,
    cardnumber: PropType.string,
    expiry: PropType.string,
    ccv: PropType.string,
    type: PropType.string
  }).isRequired,
  subtotal: PropType.number.isRequired
};

export default withCheckout(Payment);
