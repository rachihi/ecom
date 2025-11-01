import React, { Fragment, useEffect, useContext, useState } from "react";
import OrderSuccessMessage from "./OrderSuccessMessage";
import { HomeContext } from "./";
import { sliderImages } from "../../admin/dashboardAdmin/Action";
import { prevSlide, nextSlide } from "./Mixins";

const apiURL = process.env.REACT_APP_API_URL;

const Slider = (props) => {
  const { data, dispatch } = useContext(HomeContext);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    sliderImages(dispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Fragment>
      <div className="relative mt-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl mx-4 md:mx-8 overflow-hidden shadow-2xl">
        {data.sliderImages.length > 0 ? (
          <img
            className="w-full h-96 md:h-[500px] object-cover transition-all duration-500 hover:scale-105"
            src={`${apiURL}/uploads/customize/${data.sliderImages[slide].slideImage}`}
            alt="sliderImage"
          />
        ) : (
          ""
        )}

        {data?.sliderImages?.length > 0 ? (
          <>
            <svg
              onClick={(e) =>
                prevSlide(data.sliderImages.length, slide, setSlide)
              }
              className={`z-10 absolute top-1/2 left-4 transform -translate-y-1/2 w-12 h-12 text-white bg-black/20 backdrop-blur-sm rounded-full cursor-pointer hover:bg-black/40 hover:scale-110 transition-all duration-300`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <svg
              onClick={(e) =>
                nextSlide(data.sliderImages.length, slide, setSlide)
              }
              className={`z-10 absolute top-1/2 right-4 transform -translate-y-1/2 w-12 h-12 text-white bg-black/20 backdrop-blur-sm rounded-full cursor-pointer hover:bg-black/40 hover:scale-110 transition-all duration-300`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <a
                href="#shop"
                className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-xl font-semibold shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              >
                Shop Now
              </a>
            </div>
          </>
        ) : null}
      </div>
      <OrderSuccessMessage />
    </Fragment>
  );
};

export default Slider;
