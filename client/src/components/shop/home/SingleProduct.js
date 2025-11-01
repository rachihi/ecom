import React, { Fragment, useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";
import { getAllProduct } from "../../admin/products/FetchApi";
import { HomeContext } from "./index";
import { isWishReq, unWishReq, isWish } from "./Mixins";

const apiURL = process.env.REACT_APP_API_URL;

const SingleProduct = (props) => {
  const { data, dispatch } = useContext(HomeContext);
  const { products } = data;
  const history = useHistory();

  /* WhisList State */
  const [wList, setWlist] = useState(
    JSON.parse(localStorage.getItem("wishList"))
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    dispatch({ type: "loading", payload: true });
    try {
      let responseData = await getAllProduct();
      setTimeout(() => {
        if (responseData && responseData.Products) {
          dispatch({ type: "setProducts", payload: responseData.Products });
          dispatch({ type: "loading", payload: false });
        }
      }, 500);
    } catch (error) {
      console.log(error);
    }
  };

  if (data.loading) {
    return (
      <div className="col-span-2 md:col-span-3 lg:col-span-4 flex items-center justify-center py-24">
        <div className="text-center">
          <div className="spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading amazing products...</p>
        </div>
      </div>
    );
  }
  return (
    <Fragment>
      {products && products.length > 0 ? (
        products.map((item, index) => {
          return (
            <Fragment key={index}>
              <div className="relative col-span-1 m-2 group">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2">
                  <img
                    onClick={(e) => history.push(`/products/${item._id}`)}
                    className="w-full h-64 object-cover object-center cursor-pointer transition-all duration-500 group-hover:scale-110"
                    src={`${apiURL}/uploads/products/${item.pImages[0]}`}
                    alt=""
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-gray-800 font-semibold text-lg truncate">
                        {item.pName}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>
                          <svg
                            className="w-4 h-4 fill-current text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </span>
                        <span className="text-gray-600 font-medium">
                          {item.pRatingsReviews.length}
                        </span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${item.pPrice}.00
                    </div>
                  </div>
                </div>
                {/* WhisList Logic  */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                    <svg
                      onClick={(e) => isWishReq(e, item._id, setWlist)}
                      className={`${
                        isWish(item._id, wList) && "hidden"
                      } w-6 h-6 cursor-pointer text-pink-500 hover:text-pink-600 transition-all duration-300 hover:scale-110`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                    <svg
                      onClick={(e) => unWishReq(e, item._id, setWlist)}
                      className={`${
                        !isWish(item._id, wList) && "hidden"
                      } w-6 h-6 cursor-pointer text-pink-500 hover:text-pink-600 transition-all duration-300 hover:scale-110`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {/* WhisList Logic End */}
              </div>
            </Fragment>
          );
        })
      ) : (
        <div className="col-span-2 md:col-span-3 lg:col-span-4 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Products Found</h3>
            <p className="text-gray-600 text-lg">We're working on adding amazing products for you!</p>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default SingleProduct;
