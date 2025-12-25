import { CheckOutlined, EyeOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { ImageLoader } from '@/components/common';
import { displayMoney } from '@/helpers/utils';
import PropTypes from 'prop-types';
import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToBasket, removeFromBasket } from '@/redux/actions/basketActions';

const ProductItem = ({ product }) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket);
  const auth = useSelector((state) => state.auth);
  const isItemOnBasket = (id) => !!basket?.find((item) => item.id === id);

  const onClickItem = () => {
    if (product.id) {
      history.push(`/product/${product.id}`);
    }
  };

  const onAddToBasket = () => {
    if (isItemOnBasket(product.id)) {
      dispatch(removeFromBasket(product.id));
    } else {
      dispatch(addToBasket(product));
    }
  };

  const productPrice = product.price || product.pPrice || 0;
  const productDiscount = product.discount || product.pDiscount || 0;
  const productOfferPrice = productPrice - (productPrice * (productDiscount / 100));
  const productColors = product.availableColors || [];

  return (
    <SkeletonTheme color="#ffffff" highlightColor="#fcfcfc">
      <div
        className={`product-card ${!product.id ? 'product-loading' : ''}`}
        style={{
          border: product && isItemOnBasket(product.id) ? '1px solid #a6a5a5' : '',
          boxShadow: product && isItemOnBasket(product.id) ? '0 10px 15px rgba(0, 0, 0, .07)' : 'none'
        }}
      >
        {product.id && productDiscount > 0 && (
          <div className="product-card-badge">
            <span>Giảm giá</span>
          </div>
        )}

        {product.id && (
          <div className="product-card-actions">
            {auth && (
              <div className="product-action" onClick={onAddToBasket} role="button" tabIndex={0}>
                {isItemOnBasket(product.id) ? <CheckOutlined style={{ color: 'green' }} /> : <ShoppingCartOutlined />}
              </div>
            )}
            <div className="product-action" onClick={onClickItem} role="button" tabIndex={0}>
              <EyeOutlined />
            </div>

          </div>
        )}

        <div
          className="product-card-content"
          onClick={onClickItem}
          role="presentation"
        >
          <div className="product-card-img-wrapper">
            {product.image ? (
              <ImageLoader
                alt={product.name}
                className="product-card-img"
                src={product.image}
              />
            ) : <Skeleton width="100%" height="90%" />}
          </div>
          <div className="product-details">
            <h5 className="product-card-name text-overflow-ellipsis margin-auto">
              {product.name || <Skeleton width={80} />}
            </h5>
            <p className="product-card-brand">
              {product.brand || <Skeleton width={60} />}
            </p>
            <h4 className="product-card-price">
              {product.price ? (
                productDiscount > 0 ? (
                  <div className="price-wrapper">
                    <span className="product-price-new">{displayMoney(productOfferPrice)}</span>
                    <span className="product-price-old">{displayMoney(productPrice)}</span>
                  </div>
                ) : (
                  <span>{displayMoney(productPrice)}</span>
                )
              ) : <Skeleton width={40} />}
            </h4>
            {productColors.length > 0 && (
              <div className="product-card-colors" data-count={productColors.length}>
                {productColors.map((color, index) => (
                  <div key={index} className="product-color" style={{ backgroundColor: color }}></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

ProductItem.propTypes = {
  product: PropTypes.object.isRequired
};

export default ProductItem;
