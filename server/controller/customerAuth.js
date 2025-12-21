const customerModel = require("../models/customers");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { JWT_SECRET = "test_secret_key_123" } = process.env;

class CustomerAuth {
  /**
   * Customer Sign Up
   * POST /api/customer/signup
   * Body: { fullName, email, password, phoneNumber, address? }
   */
  async signup(req, res) {
    try {
      const { fullName, email, password, phoneNumber, address } = req.body;

      // Validation
      if (!fullName || !email || !password || !phoneNumber) {
        return res.status(400).json({
          error: "Full name, email, password, and phone number are required",
        });
      }

      // Check if email already exists
      const existingCustomer = await customerModel.findOne({ email });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      let customerToReturn;

      if (existingCustomer) {
        if (existingCustomer.isRegistered) {
          return res.status(400).json({
            error: "Email already registered",
          });
        } else {
          // Update existing guest customer to registered
          existingCustomer.fullName = fullName;
          existingCustomer.password = hashedPassword;
          existingCustomer.phoneNumber = phoneNumber;
          existingCustomer.address = address || existingCustomer.address;
          existingCustomer.isRegistered = true;
          existingCustomer.lastLogin = new Date();

          const updatedCustomer = await existingCustomer.save();
          customerToReturn = updatedCustomer;
        }
      } else {
        // Create new customer
        const newCustomer = await new customerModel({
          fullName,
          email,
          password: hashedPassword,
          phoneNumber,
          address: address || null,
          isRegistered: true,
          lastLogin: new Date(),
        }).save();
        customerToReturn = newCustomer;
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          _id: customerToReturn._id,
          email: customerToReturn.email,
          role: "CUSTOMER",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
        token,
        customer: {
          _id: customerToReturn._id,
          fullName: customerToReturn.fullName,
          email: customerToReturn.email,
          phoneNumber: customerToReturn.phoneNumber,
          address: customerToReturn.address,
        },
      });
    } catch (err) {
      console.error("Customer signup error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  /**
   * Customer Sign In
   * POST /api/customer/signin
   * Body: { email, password }
   */
  async signin(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required",
        });
      }

      // Find customer
      const customer = await customerModel.findOne({ email, isRegistered: true });
      if (!customer) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Update last login
      await customerModel.findByIdAndUpdate(customer._id, {
        lastLogin: new Date(),
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          _id: customer._id,
          email: customer.email,
          role: "CUSTOMER",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
        token,
        customer: {
          _id: customer._id,
          fullName: customer.fullName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          address: customer.address,
        },
      });
    } catch (err) {
      console.error("Customer signin error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Get Customer Profile
   * GET /api/customer/profile
   * Headers: Authorization: Bearer <token>
   */
  async getProfile(req, res) {
    try {
      const customerId = req.customerDetails._id;

      const customer = await customerModel.findById(customerId).select("-password");
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      return res.json(customer);
    } catch (err) {
      console.error("Get customer profile error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  /**
   * Upload Avatar
   * POST /api/customer/upload-avatar
   * Headers: Authorization: Bearer <token>
   * form-data: avatar: file
   */
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image provided" });
      }
      return res.json({
        success: true,
        url: req.file.filename
      });
    } catch (err) {
      console.error("Upload avatar error:", err);
      return res.status(500).json({ error: "Image upload failed" });
    }
  }

  /**
   * Update Customer Profile
   * PUT /api/customer/profile
   * Headers: Authorization: Bearer <token>
   * Body: { fullName, phoneNumber, address, avatar (string) }
   */
  async updateProfile(req, res) {
    try {
      const customerId = req.customerDetails._id;
      const { fullName, phoneNumber, address, avatar } = req.body;
      // const avatar = req.file ? req.file.filename : undefined; // REMOVED

      const updateData = {};
      if (fullName) updateData.fullName = fullName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (address) updateData.address = address;
      if (avatar) updateData.avatar = avatar;

      const updatedCustomer = await customerModel.findByIdAndUpdate(
        customerId,
        updateData,
        { new: true }
      ).select("-password");

      if (!updatedCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      return res.json({
        success: true,
        customer: updatedCustomer,
      });
    } catch (err) {
      console.error("Update profile error:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  }

  /**
   * Change Password
   * POST /api/customer/change-password
   * Headers: Authorization: Bearer <token>
   * Body: { currentPassword, newPassword }
   */
  async changePassword(req, res) {
    try {
      const customerId = req.customerDetails._id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const customer = await customerModel.findById(customerId);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, customer.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      customer.password = hashedPassword;
      await customer.save();

      return res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
      console.error("Change password error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

const customerAuthController = new CustomerAuth();
module.exports = customerAuthController;

