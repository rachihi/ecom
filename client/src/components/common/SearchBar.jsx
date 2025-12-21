import { SearchOutlined } from '@ant-design/icons';
import { displayMoney } from '@/helpers/utils';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { productAPI } from '@/services/api';
import { clearRecentSearch, removeSelectedRecent } from '@/redux/actions/filterActions';

const SearchBar = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setSearching] = useState(false);
  const { filter, isLoading } = useSelector((state) => ({
    filter: state.filter,
    isLoading: state.app.loading
  }));
  const searchbarRef = useRef(null);
  const typingTimeout = useRef(null);
  const history = useHistory();

  const dispatch = useDispatch();
  const isMobile = window.screen.width <= 800;

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    if (val.trim()) {
      setSearching(true);
      typingTimeout.current = setTimeout(async () => {
        try {
          const { data } = await productAPI.searchProducts(val.trim());
          setSearchResults(data.products || []);
        } catch (err) {
          console.error(err);
        } finally {
          setSearching(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  };

  const onKeyUp = (e) => {
    if (e.keyCode === 13) {
      // dispatch(setTextFilter(searchInput));
      e.target.blur();
      searchbarRef.current.classList.remove('is-open-recent-search');
      setSearchResults([]); // Close dropdown on enter

      if (isMobile) {
        history.push('/');
      }

      history.push(`/search/${searchInput.trim().toLowerCase()}`);
    }
  };

  const recentSearchClickHandler = (e) => {
    const searchBar = e.target.closest('.searchbar');

    if (!searchBar) {
      searchbarRef.current.classList.remove('is-open-recent-search');
      document.removeEventListener('click', recentSearchClickHandler);
    }
  };

  const onFocusInput = (e) => {
    e.target.select();

    if (filter.recent.length !== 0) {
      searchbarRef.current.classList.add('is-open-recent-search');
      document.addEventListener('click', recentSearchClickHandler);
    }
  };

  const onClickRecentSearch = (keyword) => {
    // dispatch(setTextFilter(keyword));
    searchbarRef.current.classList.remove('is-open-recent-search');
    history.push(`/search/${keyword.trim().toLowerCase()}`);
  };

  const onClearRecent = () => {
    dispatch(clearRecentSearch());
  };

  const onClickItem = (id) => {
    setSearchResults([]);
    setSearchInput('');
    history.push(`/product/${id}`);
  }

  return (
    <>
      <div className="searchbar" ref={searchbarRef}>
        <SearchOutlined className="searchbar-icon" />
        <input
          className="search-input searchbar-input"
          onChange={onSearchChange}
          onKeyUp={onKeyUp}
          onFocus={onFocusInput}
          placeholder="Tìm kiếm sản phẩm..."
          readOnly={isLoading}
          type="text"
          value={searchInput}
        />
        {filter.recent.length !== 0 && (
          <div className="searchbar-recent">
            <div className="searchbar-recent-header">
              <h5>Tìm kiếm gần đây</h5>
              <h5
                className="searchbar-recent-clear text-subtle"
                onClick={onClearRecent}
                role="presentation"
              >
                Xóa
              </h5>
            </div>
            {filter.recent.map((item, index) => (
              <div
                className="searchbar-recent-wrapper"
                key={`search-${item}-${index}`}
              >
                <h5
                  className="searchbar-recent-keyword margin-0"
                  onClick={() => onClickRecentSearch(item)}
                  role="presentation"
                >
                  {item}
                </h5>
                <span
                  className="searchbar-recent-button text-subtle"
                  onClick={() => dispatch(removeSelectedRecent(item))}
                  role="presentation"
                >
                  X
                </span>
              </div>
            ))}
          </div>
        )}
        {(searchResults.length > 0 || isSearching) && searchInput.trim().length > 0 && (
          <div className="searchbar-dropdown">
            {isSearching ? (
              <div className="searchbar-dropdown-item"><h5 className="margin-0">Đang tải...</h5></div>
            ) : (
              searchResults.map((p) => {
                const pName = p.name || p.pName;
                const pPrice = p.price || p.pPrice || 0;
                const pImg = p.image || (p.pImages && p.pImages.length > 0 ? p.pImages[0] : '') || (p.images && p.images.length > 0 ? p.images[0] : '');
                const pId = p.id || p._id;

                return (
                  <div
                    key={pId}
                    className="searchbar-dropdown-item"
                    onClick={() => onClickItem(pId)}
                    role="presentation"
                  >
                    <div className="searchbar-product-img">
                      {pImg && <img src={pImg} alt={pName} />}
                    </div>
                    <div className="searchbar-product-info">
                      <h6 className="margin-0">{pName}</h6>
                      <span className="text-subtle">{displayMoney(pPrice)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SearchBar;
