const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    cName: {
      type: String,
      required: true,
      // Tên danh mục
    },
    cDescription: {
      type: String,
      // Mô tả danh mục
    },
    cStatus: {
      type: String,
      required: true,
      // Trạng thái: Active/Inactive
    },
  },
  { timestamps: true }
);

const categoryModel = mongoose.model("categories", categorySchema);
module.exports = categoryModel;
