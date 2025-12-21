/* eslint-disable no-nested-ternary */
import { useDidMount } from '@/hooks';
import PropType from 'prop-types';
import { categoryAPI } from '@/services/api';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import { applyFilter, resetFilter } from '@/redux/actions/filterActions';
import { clearProductList as clearProductListAction } from '@/redux/actions/productActions';
import { getProducts } from '@/redux/actions/productActions';
import { selectMax, selectMin } from '@/selectors/selector';


const Filters = ({ closeModal }) => {
  const { filter, isLoading, products } = useSelector((state) => ({
    filter: state.filter,
    isLoading: state.app.loading,
    products: state.products.items,
  }));
  const [field, setFilter] = useState({
    category: filter.category,
    sortBy: filter.sortBy
  });
  const [categories, setCategories] = useState([]);
  const dispatch = useDispatch();
  const history = useHistory();
  const didMount = useDidMount();

  useEffect(() => {
    if (didMount && window.screen.width <= 480) {
      history.push('/');
    }

    if (didMount && closeModal) closeModal();

    setFilter(filter);
    window.scrollTo(0, 0);

    const fetchCategories = async () => {
      try {
        const { data } = await categoryAPI.getCategories();
        setCategories(data.Categories || []);
      } catch (e) {
        console.log(e);
      }
    };
    fetchCategories();
  }, [filter]);


  const onCategoryFilterChange = (e) => {
    const val = e.target.value;

    setFilter({ ...field, category: val });
  };

  const onSortFilterChange = (e) => {
    setFilter({ ...field, sortBy: e.target.value });
  };

  const onApplyFilter = () => {
    const isChanged = Object.keys(field).some((key) => field[key] !== filter[key]);

    if (isChanged) {
      dispatch(clearProductListAction());
      dispatch(applyFilter(field));
      dispatch(getProducts());
    } else {
      if (closeModal) closeModal();
    }
  };

  const onResetFilter = () => {
    const filterFields = ['category', 'sortBy'];

    if (filterFields.some((key) => !!filter[key])) {
      dispatch(clearProductListAction());
      dispatch(resetFilter());
      dispatch(getProducts());
    } else {
      if (closeModal) closeModal();
    }
  };

  return (
    <div className="filters">
      <div className="filters-field ">
        <span>Danh mục</span>
        <br />
        <br />
        {products.length === 0 && isLoading ? (
          <h5 className="text-subtle">Đang tải bộ lọc</h5>
        ) : (
          <select
            className="filters-brand"
            value={field.category}
            disabled={isLoading || products.length === 0}
            onChange={onCategoryFilterChange}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.cName}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="filters-field">
        <span>Sắp xếp theo</span>
        <br />
        <br />
        <select
          className="filters-sort-by d-block"
          value={field.sortBy}
          disabled={isLoading || products.length === 0}
          onChange={onSortFilterChange}
        >
          <option value="">Mặc định</option>
          <option value="name-asc">Tên A - Z</option>
          <option value="name-desc">Tên Z - A</option>
          <option value="price-desc">Giá Cao - Thấp</option>
          <option value="price-asc">Giá Thấp - Cao</option>
        </select>
      </div>

      <div className="filters-action">
        <button
          className="filters-button button button-small"
          disabled={isLoading || products.length === 0}
          onClick={onApplyFilter}
          type="button"
        >
          Áp dụng
        </button>
        <button
          className="filters-button button button-border button-small"
          disabled={isLoading || products.length === 0}
          onClick={onResetFilter}
          type="button"
        >
          Đặt lại
        </button>
      </div>
    </div>
  );
};

Filters.propTypes = {
  closeModal: PropType.func
};

export default withRouter(Filters);
