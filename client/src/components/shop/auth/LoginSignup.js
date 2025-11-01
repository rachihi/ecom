import React, { Fragment, useState, useContext } from "react";
import Login from "./Login";
import Signup from "./Signup";
import { LayoutContext } from "../index";

const LoginSignup = (props) => {
  const { data, dispatch } = useContext(LayoutContext);

  const [login, setLogin] = useState(true);
  const [loginValue, setLoginValue] = useState("Create an account");

  const loginSignupModalToggle = () =>
    data.loginSignupModal
      ? dispatch({ type: "loginSignupModalToggle", payload: false })
      : dispatch({ type: "loginSignupModalToggle", payload: true });

  const changeLoginSignup = () => {
    if (login) {
      setLogin(false);
      setLoginValue("Login");
    } else {
      setLogin(true);
      setLoginValue("Create an account");
    }
  };

  return (
    <Fragment>
      {/* Black Overlay  */}
      <div
        onClick={(e) => loginSignupModalToggle()}
        className={` ${
          data.loginSignupModal ? "" : "hidden"
        } fixed top-0 z-40 w-full h-screen bg-black/60 backdrop-blur-sm cursor-pointer transition-all duration-300`}
      ></div>
      {/* Signup Login Component Render */}
      <section
        className={` ${
          data.loginSignupModal ? "" : "hidden"
        } fixed z-40 inset-0 my-8 md:my-20 flex items-start justify-center overflow-auto`}
      >
        <div className="w-11/12 md:w-3/5 lg:w-2/4 relative space-y-6 bg-white rounded-2xl p-8 md:px-12 md:py-8 shadow-2xl border border-gray-100">
          {login ? <Login /> : <Signup />}
          <div className="flex items-center space-x-4">
            <span className="border-b border-gray-300 w-full" />
            <span className="font-medium text-gray-500">or</span>
            <span className="border-b border-gray-300 w-full" />
          </div>
          <div
            onClick={(e) => changeLoginSignup()}
            className="px-6 py-3 font-semibold text-center cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
          >
            {loginValue}
          </div>
          {/*  Modal Close Button */}
          <div className="absolute top-4 right-4">
            <div className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 cursor-pointer transition-all duration-300 hover:scale-110">
              <svg
                onClick={(e) => {
                  loginSignupModalToggle();
                  dispatch({ type: "loginSignupError", payload: false });
                }}
                className="w-5 h-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
    </Fragment>
  );
};

export default LoginSignup;
