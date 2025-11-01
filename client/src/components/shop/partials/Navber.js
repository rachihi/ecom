import React, { Fragment, useContext } from "react";
import { useHistory, useLocation } from "react-router-dom";
import "./style.css";

import { logout } from "./Action";
import { LayoutContext } from "../index";
import { isAdmin } from "../auth/fetchApi";

const Navber = (props) => {
  const history = useHistory();
  const location = useLocation();

  const { data, dispatch } = useContext(LayoutContext);

  const navberToggleOpen = () =>
    data.navberHamburger
      ? dispatch({ type: "hamburgerToggle", payload: false })
      : dispatch({ type: "hamburgerToggle", payload: true });

  const loginModalOpen = () =>
    data.loginSignupModal
      ? dispatch({ type: "loginSignupModalToggle", payload: false })
      : dispatch({ type: "loginSignupModalToggle", payload: true });

  const cartModalOpen = () =>
    data.cartModal
      ? dispatch({ type: "cartModalToggle", payload: false })
      : dispatch({ type: "cartModalToggle", payload: true });

  return (
    <Fragment>
      {/* Navber Section */}
      <nav className="fixed top-0 w-full z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 grid grid-cols-4 lg:grid-cols-3">
          <div className="hidden lg:block col-span-1 flex text-gray-600 mt-1 space-x-2">
            <span
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-4 py-3 rounded-xl font-medium tracking-wide hover:text-gray-800 cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={(e) => history.push("/")}
            >
              Shop
            </span>
            <span
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-4 py-3 rounded-xl font-medium tracking-wide hover:text-gray-800 cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={(e) => history.push("/blog")}
            >
              Blog
            </span>
            <span
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-4 py-3 rounded-xl font-medium tracking-wide hover:text-gray-800 cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={(e) => history.push("/contact-us")}
            >
              Contact us
            </span>
          </div>
          <div className="col-span-2 lg:hidden flex justify-items-stretch	 items-center">
            <svg
              onClick={(e) => navberToggleOpen()}
              className="col-span-1 lg:hidden w-8 h-8 cursor-pointer text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <span
              onClick={(e) => history.push("/")}
              className="flex items-left text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-2xl cursor-pointer px-2 text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              Hayroo
            </span>
          </div>
          <div
            onClick={(e) => history.push("/")}
            className="hidden lg:block flex items-left col-span-1 text-center font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-3xl cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            Hayroo
          </div>
          <div className="flex items-right col-span-2 lg:col-span-1 flex justify-end">
            {/*  WishList Page Button */}
            <div
              onClick={(e) => history.push("/wish-list")}
              className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-red-50 rounded-xl px-3 py-2 cursor-pointer transition-all duration-300 hover:shadow-md"
              title="Wishlist"
            >
              <svg
                className={`${
                  location.pathname === "/wish-list"
                    ? "fill-current text-pink-600"
                    : ""
                } w-8 h-8 text-gray-600 cursor-pointer hover:text-pink-600 transition-colors duration-300`}
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
            </div>
            {localStorage.getItem("jwt") ? (
              <Fragment>
                <div
                  className="userDropdownBtn hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-3 py-2 rounded-xl relative transition-all duration-300 hover:shadow-md"
                  title="User Menu"
                >
                  <svg
                    className="cursor-pointer w-8 h-8 text-gray-600 hover:text-blue-600 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="userDropdown absolute right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    {!isAdmin() ? (
                      <Fragment>
                        <li className="flex flex-col text-gray-700 w-56">
                          <span
                            onClick={(e) => history.push("/user/orders")}
                            className="flex space-x-3 py-3 px-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </span>
                            <span>My Orders</span>
                          </span>
                          <span
                            onClick={(e) => history.push("/user/profile")}
                            className="flex space-x-3 py-3 px-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </span>
                            <span>My Account</span>
                          </span>
                          <span
                            onClick={(e) => history.push("/wish-list")}
                            className="flex space-x-3 py-3 px-6 hover:bg-gradient-to-r hover:from-pink-50 hover:to-red-50 cursor-pointer transition-all duration-300"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
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
                            </span>
                            <span>My Wishlist</span>
                          </span>
                          <span
                            onClick={(e) => history.push("/user/setting")}
                            className="flex space-x-3 py-3 px-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-300"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </span>
                            <span>Setting</span>
                          </span>
                          <span
                            onClick={(e) => logout()}
                            className="flex space-x-2 py-2 px-8 hover:bg-gray-400 cursor-pointer"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                            </span>
                            <span>Logout</span>
                          </span>
                        </li>
                      </Fragment>
                    ) : (
                      <Fragment>
                        <li className="flex flex-col text-gray-700 w-48 shadow-lg">
                          <span
                            onClick={(e) => history.push("/admin/dashboard")}
                            className="flex space-x-2 py-2 px-8 hover:bg-gray-400 cursor-pointer"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </span>
                            <span>Admin Panel</span>
                          </span>
                          <span
                            onClick={(e) => logout()}
                            className="flex space-x-2 py-2 px-8 hover:bg-gray-400 cursor-pointer"
                          >
                            <span>
                              <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                            </span>
                            <span>Logout</span>
                          </span>
                        </li>
                      </Fragment>
                    )}
                  </div>
                </div>
              </Fragment>
            ) : (
              /* Login Modal Button */
              <div
                onClick={(e) => loginModalOpen()}
                className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-3 py-2 rounded-xl transition-all duration-300 hover:shadow-md"
                title="Login"
              >
                <svg
                  className="w-8 h-8 text-gray-600 hover:text-blue-600 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
              </div>
            )}
            {/* Cart Modal Button */}
            <div
              onClick={(e) => cartModalOpen()}
              className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 px-3 py-2 rounded-xl relative cursor-pointer transition-all duration-300 hover:shadow-md"
              title="Cart"
            >
              <svg
                className="w-8 h-8 text-gray-600 hover:text-green-600 transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="absolute top-0 ml-6 mt-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full px-2 py-1 text-white text-xs font-semibold shadow-lg">
                {data.cartProduct !== null ? data.cartProduct.length : 0}
              </span>
            </div>
          </div>
        </div>
        <div
          className={
            data.navberHamburger && data.navberHamburger
              ? "px-4 pb-4 md:pb-0 md:px-8 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100"
              : "hidden px-4 pb-4 md:pb-0 md:px-8 lg:hidden"
          }
        >
          <div className="col-span-1 flex flex-col text-gray-600 space-y-2 py-4">
            <span
              className="font-medium text-lg tracking-wide hover:text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={(e) => history.push("/")}
            >
              Shop
            </span>
            <span
              className="font-medium text-lg tracking-wide hover:text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={(e) => history.push("/blog")}
            >
              Blog
            </span>
            <span
              className="font-medium text-lg tracking-wide hover:text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md"
              onClick={(e) => history.push("/contact-us")}
            >
              Contact us
            </span>
          </div>
        </div>
      </nav>
      {/* End Navber Section */}
    </Fragment>
  );
};

export default Navber;
