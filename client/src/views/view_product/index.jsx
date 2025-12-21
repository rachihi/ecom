import { ArrowLeftOutlined, LoadingOutlined, StarFilled } from '@ant-design/icons';
import { ColorChooser, ImageLoader, MessageDisplay } from '@/components/common';
import { ProductShowcaseGrid } from '@/components/product';
import { RECOMMENDED_PRODUCTS, SHOP, SIGNIN } from '@/constants/routes';
import { displayMoney } from '@/helpers/utils';
import {
  useBasket,
  useDocumentTitle,
  useProduct,
  useRecommendedProducts,
  useScrollTop
} from '@/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Select from 'react-select';

const ViewProduct = () => {
  const { id } = useParams();
  const history = useHistory();
  const { product, isLoading, error } = useProduct(id);
  const { addToBasket, isItemOnBasket } = useBasket(id);
  const isAuthenticated = useSelector((state) => !!state.profile.id);
  useScrollTop();
  useDocumentTitle(`View ${product?.name || 'Item'}`);

  const [selectedImage, setSelectedImage] = useState(product?.image || '');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const {
    recommendedProducts,
    fetchRecommendedProducts,
    isLoading: isLoadingFeatured,
    error: errorFeatured
  } = useRecommendedProducts(6);
  const colorOverlay = useRef(null);

  useEffect(() => {
    setSelectedImage(product?.image);
  }, [product]);

  const onSelectedSizeChange = (newValue) => {
    setSelectedSize(newValue.value);
  };

  const onSelectedColorChange = (color) => {
    setSelectedColor(color);
    if (colorOverlay.current) {
      colorOverlay.current.value = color;
    }
  };

  const handleAddToBasket = () => {
    // Require login to add to basket
    if (!isAuthenticated) {
      history.push(SIGNIN);
      return;
    }

    addToBasket({ ...product, selectedColor, selectedSize: selectedSize || product.sizes[0] });
  };
  return (
    <main className="content">
      {isLoading && (
        <div className="loader">
          <h4>Đang tải sản phẩm...</h4>
          <br />
          <LoadingOutlined style={{ fontSize: '3rem' }} />
        </div>
      )}
      {error && (
        <MessageDisplay message={error} />
      )}
      {(product && !isLoading) && (
        <div className="product-view">
          <Link to={SHOP}>
            <h3 className="button-link d-inline-flex">
              <ArrowLeftOutlined />
              &nbsp; Quay lại cửa hàng
            </h3>
          </Link>
          <div className="product-modal">
            {product.images.length !== 0 && (
              <div className="product-modal-image-collection">
                {product.images.map((image) => (
                  <div
                    className="product-modal-image-collection-wrapper"
                    key={image.id}
                    onClick={() => setSelectedImage(image.url)}
                    role="presentation"
                  >
                    <ImageLoader
                      className="product-modal-image-collection-img"
                      src={image.url}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="product-modal-image-wrapper">
              {selectedColor && <input type="color" disabled ref={colorOverlay} id="color-overlay" />}
              <ImageLoader
                alt={product.name}
                className="product-modal-image"
                src={selectedImage}
              />
            </div>
            <div className="product-modal-details">
              <br />
              <span className="text-subtle">{product.brand}</span>
              <h1 className="margin-top-0">{product.name}</h1>
              <div className="product-modal-meta" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px', marginBottom: '10px' }}>
                <div className="product-rating" style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <StarFilled key={i} style={{ color: i < (product.rating || 0) ? '#ffa500' : '#ddd', fontSize: '1.2rem' }} />
                  ))}
                </div>
                {product.discount > 0 && (
                  <span className="product-discount-tag" style={{ background: '#e53935', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    -{product.discount}%
                  </span>
                )}
              </div>
              {product.shortDescription && (
                <p className="product-short-desc" style={{ color: '#666', fontSize: '1rem', lineHeight: '1.5' }}>
                  {product.shortDescription}
                </p>
              )}
              <span>{product.description}</span>
              <br />
              <br />
              <div className="divider" />
              <br />
              <br />
              {product.discount > 0 ? (
                <div className="price-wrapper">
                  <h1 className="product-price-new" style={{ color: '#e53935' }}>{displayMoney(product.price - (product.price * (product.discount / 100)))}</h1>
                  <h3 className="product-price-old" style={{ textDecoration: 'line-through', color: '#999' }}>{displayMoney(product.price)}</h3>
                </div>
              ) : (
                <h1>{displayMoney(product.price)}</h1>
              )}
              <div className="product-modal-action">
                <button
                  className={`button button-small ${isItemOnBasket(product.id) ? 'button-border button-border-gray' : ''}`}
                  onClick={handleAddToBasket}
                  type="button"
                >
                  {!isAuthenticated ? 'Đăng nhập để mua hàng' : (isItemOnBasket(product.id) ? 'Xóa khỏi giỏ hàng' : 'Thêm vào giỏ hàng')}
                </button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '10rem' }}>
            <div className="display-header">
              <h1>Sản phẩm đề xuất</h1>
              <Link to={RECOMMENDED_PRODUCTS}>Xem tất cả</Link>
            </div>
            {errorFeatured && !isLoadingFeatured ? (
              <MessageDisplay
                message={error}
                action={fetchRecommendedProducts}
                buttonLabel="Thử lại"
              />
            ) : (
              <ProductShowcaseGrid products={recommendedProducts} skeletonCount={3} />
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default ViewProduct;
