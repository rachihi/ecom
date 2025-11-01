import React, { Fragment } from "react";
import moment from "moment";

const Footer = (props) => {
  return (
    <Fragment>
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-300 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                Hayroo
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Your trusted destination for quality products and exceptional shopping experience.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="hover:text-blue-400 transition-colors duration-300">Home</a></li>
                <li><a href="/products" className="hover:text-blue-400 transition-colors duration-300">Products</a></li>
                <li><a href="/wish-list" className="hover:text-blue-400 transition-colors duration-300">Wishlist</a></li>
                <li><a href="/contact" className="hover:text-blue-400 transition-colors duration-300">Contact</a></li>
              </ul>
            </div>
            
            {/* Contact Info */}
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-white mb-4">Contact Info</h4>
              <div className="space-y-2 text-gray-400">
                <p>📧 support@hayroo.com</p>
                <p>📞 +1 (555) 123-4567</p>
                <p>📍 123 Commerce St, City</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              Develop & Design Hasan-py © Copyright {moment().format("YYYY")} | 
              <span className="ml-2 text-blue-400">Made with ❤️</span>
            </p>
          </div>
        </div>
      </footer>
    </Fragment>
  );
};

export default Footer;
