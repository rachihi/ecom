import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons';
import { displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';

const Total = ({ isInternational, subtotal, onClickBack, onConfirm, isSubmitting = false }) => {
  return (
    <>
      <div className="basket-total text-right">
        <p className="basket-total-title">Tổng cộng:</p>
        <h2 className="basket-total-amount">
          {displayMoney(subtotal + (isInternational ? 50 : 0))}
        </h2>
      </div>
      <br />
      <div className="checkout-shipping-action">
        <button
          className="button button-muted"
          onClick={() => onClickBack()}
          type="button"
        >
          <ArrowLeftOutlined />
          &nbsp;
          Quay lại
        </button>
        <button
          className="button"
          disabled={isSubmitting}
          onClick={onConfirm}
          type="button"
        >
          <CheckOutlined />
          &nbsp;
          Xác nhận
        </button>
      </div>
    </>
  );
};

Total.propTypes = {
  isInternational: PropType.bool.isRequired,
  subtotal: PropType.number.isRequired,
  onClickBack: PropType.func.isRequired,
  onConfirm: PropType.func.isRequired,
  isSubmitting: PropType.bool
};

export default Total;
