import { ImageLoader } from '@/components/common';
import { displayMoney } from '@/helpers/utils';
import PropType from 'prop-types';
import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { useHistory } from 'react-router-dom';

const ProductFeatured = ({ product }) => {
  const history = useHistory();
  const onClickItem = () => {
    if (!product) return;

    history.push(`/product/${product._id}`);
  };
  console.log(product);

  return (
    <SkeletonTheme color="#e1e1e1" highlightColor="#f2f2f2">
      <div className="product-display" onClick={onClickItem} role="presentation">
        <div className="product-display-img">
          {product.images ? (
            <ImageLoader
              className="product-card-img"
              src={product.images[0]}
            />
          ) : <Skeleton width="100%" height="100%" />}
        </div>
        <div className="product-display-details">
          <div className="product-display-info">
            <h2>{product.pName || <Skeleton width={80} />}</h2>
            <p className="text-subtle text-italic">
              {product?.pCategory?.cName || <Skeleton width={40} />}
            </p>
          </div>
          {/* <div className="product-price-wrapper">
            {product.pDiscount > 0 ? (
              <>
                <h4 className="product-card-price-discount">
                  {displayMoney(product.pPrice - (product.pPrice * (product.pDiscount / 100)))}
                </h4>
                <div className="product-price-original-wrapper">
                  <span className="product-card-price-original">
                    {displayMoney(product.pPrice)}
                  </span>
                  <span className="product-discount-badge">
                    -{product.pDiscount}%
                  </span>
                </div>
              </>
            ) : (
              <h4 className="product-card-price">
                {product.pPrice ? displayMoney(product.pPrice) : <Skeleton width={40} />}
              </h4>
            )}
          </div> */}
        </div>
      </div>
    </SkeletonTheme>
  );
};

ProductFeatured.propTypes = {
  product: PropType.shape({
    image: PropType.string,
    name: PropType.string,
    id: PropType.string,
    brand: PropType.string
  }).isRequired
};

export default ProductFeatured;
