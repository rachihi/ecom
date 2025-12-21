import { CheckOutlined, EyeOutlined, RetweetOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { ImageLoader } from '@/components/common';
import { displayMoney } from '@/helpers/utils';
import PropTypes from 'prop-types';
import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToBasket, removeFromBasket } from '@/redux/actions/basketActions';

const ProductFeatured = ({ product }) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const basket = useSelector((state) => state.basket);
  const isItemOnBasket = (id) => !!basket?.find((item) => item.id === id);

  const onClickItem = () => {
    if (!product) return;
    history.push(`/product/${product.id || product._id}`);
  };

  const onAddToBasket = () => {
    const pid = product.id || product._id;
    if (isItemOnBasket(pid)) {
      dispatch(removeFromBasket(pid));
    } else {
      dispatch(addToBasket(product));
    }
  };

  // Logic to handle both raw and transformed data
  const productPrice = product.price || product.pPrice || 0;
  const productDiscount = product.discount || product.pDiscount || 0;
  const productOfferPrice = productPrice - (productPrice * (productDiscount / 100));
  const productImage = product.image || (product.images && product.images[0]) || '';
  const productId = product.id || product._id;

  return (
    <SkeletonTheme color="#e1e1e1" highlightColor="#f2f2f2">
      <div className="product-display product-card" onClick={onClickItem} role="presentation">
        {productId && productDiscount > 0 && (
          <div className="product-card-badge">
            <span>Sale</span>
          </div>
        )}

        {productId && (
          <div className="product-card-actions">
            <div className="product-action" onClick={(e) => { e.stopPropagation(); onAddToBasket(); }} role="button" tabIndex={0}>
              {isItemOnBasket(productId) ? <CheckOutlined style={{ color: 'green' }} /> : <ShoppingCartOutlined />}
            </div>
            <div className="product-action" onClick={(e) => { e.stopPropagation(); onClickItem(); }} role="button" tabIndex={0}>
              <EyeOutlined />
            </div>
            <div className="product-action" onClick={(e) => e.stopPropagation()} role="button" tabIndex={0}>
              <RetweetOutlined />
            </div>
          </div>
        )}

        <div className="product-display-img">
          {productImage ? (
            <ImageLoader
              className="product-card-img"
              src={productImage}
            />
          ) : <Skeleton width="100%" height="100%" />}
        </div>
        <div className="product-display-details">
          <div className="product-display-info">
            <h2>{product.name || product.pName || <Skeleton width={80} />}</h2>
            <p className="text-subtle text-italic">
              {product.brand || product.pCategory?.cName || <Skeleton width={40} />}
            </p>
          </div>
          <div className="product-price-wrapper">
            {productDiscount > 0 ? (
              <div className="price-wrapper">
                <span className="product-price-new">{displayMoney(productOfferPrice)}</span>
                <span className="product-price-old">{displayMoney(productPrice)}</span>
              </div>
            ) : (
              <h4 className="product-card-price">
                {productPrice ? displayMoney(productPrice) : <Skeleton width={40} />}
              </h4>
            )}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
};

ProductFeatured.propTypes = {
  product: PropTypes.object.isRequired
};

export default ProductFeatured;
