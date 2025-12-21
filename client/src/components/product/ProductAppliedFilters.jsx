/* eslint-disable no-nested-ternary */
import { CloseCircleOutlined } from '@ant-design/icons';
import PropType from 'prop-types';
import React, { useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { applyFilter } from '@/redux/actions/filterActions';
import { getProducts } from '@/redux/actions/productActions';
import { categoryAPI } from '@/services/api';

const ProductAppliedFilters = ({ filteredProductsCount }) => {
  const [categories, setCategories] = useState([]);
  const filter = useSelector((state) => state.filter, shallowEqual);
  const fields = ['category', 'minPrice', 'maxPrice', 'sortBy', 'keyword'];
  const isFiltered = fields.some((key) => !!filter[key]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoryAPI.getCategories();
        setCategories(data.Categories || []);
      } catch (e) {
        console.log(e);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryName = (id) => {
    const category = categories.find((c) => c._id === id);
    return category ? category.cName : id;
  };

  const onRemoveKeywordFilter = () => {
    dispatch(applyFilter({ keyword: '' }));
    dispatch(getProducts());
  };

  const onRemovePriceRangeFilter = () => {
    dispatch(applyFilter({ minPrice: 0, maxPrice: 0 }));
    dispatch(getProducts());
  };

  const onRemoveCategoryFilter = () => {
    dispatch(applyFilter({ category: '' }));
    dispatch(getProducts());
  };

  const onRemoveSortFilter = () => {
    dispatch(applyFilter({ sortBy: '' }));
    dispatch(getProducts());
  };

  return !isFiltered ? null : (
    <div className="product-applied-filters" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
      <div className="product-list-header-title" style={{ marginRight: '2rem' }}>
        <h5>
          {filteredProductsCount > 0
            && `Tìm thấy ${filteredProductsCount} ${filteredProductsCount > 1 ? 'sản phẩm' : 'sản phẩm'}`}
        </h5>
      </div>
      {filter.keyword && (
        <div className="pill-wrapper">
          <span className="d-block">Từ khóa</span>
          <div className="pill padding-right-l">
            <h5 className="pill-content margin-0">{filter.keyword}</h5>
            <div className="pill-remove" onClick={onRemoveKeywordFilter} role="presentation">
              <h5 className="margin-0 text-subtle">
                <CloseCircleOutlined />
              </h5>
            </div>
          </div>
        </div>
      )}
      {filter.category && (
        <div className="pill-wrapper">
          <span className="d-block">Danh mục</span>
          <div className="pill padding-right-l">
            <h5 className="pill-content margin-0">{getCategoryName(filter.category)}</h5>
            <div className="pill-remove" onClick={onRemoveCategoryFilter} role="presentation">
              <h5 className="margin-0 text-subtle">
                <CloseCircleOutlined />
              </h5>
            </div>
          </div>
        </div>
      )}
      {(!!filter.minPrice || !!filter.maxPrice) && (
        <div className="pill-wrapper">
          <span className="d-block">Khoảng giá</span>
          <div className="pill padding-right-l">
            <h5 className="pill-content margin-0">
              $
              {filter.minPrice}
              - $
              {filter.maxPrice}
            </h5>
            <div
              className="pill-remove"
              onClick={onRemovePriceRangeFilter}
              role="presentation"
            >
              <h5 className="margin-0 text-subtle">
                <CloseCircleOutlined />
              </h5>
            </div>
          </div>
        </div>
      )}
      {filter.sortBy && (
        <div className="pill-wrapper">
          <div className="pill padding-right-l">
            <h5 className="pill-content margin-0">
              {filter.sortBy === 'price-desc'
                ? 'Giá Cao - Thấp'
                : filter.sortBy === 'price-asc'
                  ? 'Giá Thấp - Cao'
                  : filter.sortBy === 'name-desc'
                    ? 'Tên Z - A'
                    : 'Tên A - Z'}
            </h5>
            <div
              className="pill-remove"
              onClick={onRemoveSortFilter}
              role="presentation"
            >
              <h5 className="margin-0 text-subtle">
                <CloseCircleOutlined />
              </h5>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProductAppliedFilters.defaultProps = {
  filteredProductsCount: 0
};

ProductAppliedFilters.propTypes = {
  filteredProductsCount: PropType.number
};

export default ProductAppliedFilters;
