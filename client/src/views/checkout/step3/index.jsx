import { CHECKOUT_STEP_1 } from '@/constants/routes';
import { Form, Formik } from 'formik';
import { displayActionMessage } from '@/helpers/utils';
import { useDocumentTitle, useScrollTop } from '@/hooks';
import PropType from 'prop-types';
import React, { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import { StepTracker } from '../components';
import withCheckout from '../hoc/withCheckout';
import CreditPayment from './CreditPayment';
import PayPalPayment from './PayPalPayment';
import Total from './Total';
import { orderAPI } from '@/services/api';
import { clearBasket } from '@/redux/actions/basketActions';
import { resetCheckout } from '@/redux/actions/checkoutActions';

const FormSchema = Yup.object().shape({
  name: Yup.string()
    .min(4, 'Name should be at least 4 characters.')
    .required('Name is required'),
  cardnumber: Yup.string()
    .min(13, 'Card number should be 13-19 digits long')
    .max(19, 'Card number should only be 13-19 digits long')
    .required('Card number is required.'),
  expiry: Yup.date()
    .required('Credit card expiry is required.'),
  ccv: Yup.string()
    .min(3, 'CCV length should be 3-4 digit')
    .max(4, 'CCV length should only be 3-4 digit')
    .required('CCV is required.'),
  type: Yup.string().required('Please select paymend mode')
});

const Payment = ({ shipping, payment, subtotal }) => {
  useDocumentTitle('Check Out Final Step | Salinaka');
  useScrollTop();

  const dispatch = useDispatch();
  const history = useHistory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const basket = useSelector((state) => state.basket);
  const profile = useSelector((state) => state.profile);

  const initFormikValues = {
    name: payment.name || '',
    cardnumber: payment.cardnumber || '',
    expiry: payment.expiry || '',
    ccv: payment.ccv || '',
    type: payment.type || 'paypal'
  };

  const onConfirm = async (values) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Prepare order data matching backend format
      const orderData = {
        allProduct: basket.map(item => ({
          id: item.id,
          quantitiy: item.quantity, // Note: backend uses 'quantitiy' (typo)
        })),
        amount: subtotal + (shipping.isInternational ? 50 : 0), // Add shipping cost
        transactionId: `TXN-${Date.now()}`, // Generate transaction ID
        address: `${shipping.fullname}, ${shipping.address}`,
        phone: parseInt(shipping.mobile?.replace(/\D/g, '') || '0000000000'),
      };

      // If customer is logged in, use their ID
      if (profile && profile.id) {
        orderData.customerId = profile.id;
      } else {
        // Guest customer - create new customer record
        orderData.customer = {
          fullName: shipping.fullname,
          phoneNumber: shipping.mobile,
          email: shipping.email || 'guest@example.com',
          address: shipping.address,
        };
      }

      // Call API to create order
      const response = await orderAPI.createOrder(orderData);

      if (response.data.success || response.data.order) {
        // Clear basket and checkout state
        dispatch(clearBasket());
        dispatch(resetCheckout());

        displayActionMessage('Order placed successfully!', 'success');

        // Redirect to success page or home
        setTimeout(() => {
          history.push('/');
        }, 1500);
      } else {
        displayActionMessage(response.data.message || 'Failed to create order', 'error');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      displayActionMessage(error.response?.data?.message || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shipping || !shipping.isDone) {
    return <Redirect to={CHECKOUT_STEP_1} />;
  }
  return (
    <div className="checkout">
      <StepTracker current={3} />
      <Formik
        initialValues={initFormikValues}
        validateOnChange
        validationSchema={FormSchema}
        validate={(form) => {
          if (form.type === 'paypal') {
            displayActionMessage('Feature not ready yet :)', 'info');
          }
        }}
        onSubmit={onConfirm}
      >
        {() => (
          <Form className="checkout-step-3">
            <CreditPayment />
            <PayPalPayment />
            <Total
              isInternational={shipping.isInternational}
              subtotal={subtotal}
            />
          </Form>
        )}
      </Formik>
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
