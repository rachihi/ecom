/**
 * FURNITURE PRODUCT MODEL - MongoDB Schema
 * Thiết kế cho hệ thống sản phẩm nội thất
 */

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const furnitureProductSchema = new mongoose.Schema(
  {

    // ===========================
    // THÔNG TIN CƠ BẢN (BASIC INFO)
    // ===========================
    pName: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      index: true,
      // Tên sản phẩm
    },
    pSKU: {
      type: String,
      unique: true,
      required: true,
      index: true,
      // Mã kho (Stock Keeping Unit) - Unique
    },
    pSlug: {
      type: String,
      unique: true,
      lowercase: true,
      // URL thân thiện cho SEO
    },
    pDescription: {
      type: String,
      maxlength: 3000,
      // Mô tả chi tiết sản phẩm (HTML/Markdown)
    },
    pShortDescription: {
      type: String,
      maxlength: 500,
      // Mô tả ngắn gọn hiển thị ở danh sách
    },

    // ===========================
    // GIÁ & KHUYẾN MÃI (PRICING)
    // ===========================
    pPrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
      // Giá bán lẻ (hiển thị cho khách)
    },
    pCost: {
      type: Number,
      required: true,
      min: 0,
      index: true,
      // Giá vốn (giá nhập)
    },
    pComparePrice: {
      type: Number,
      min: 0,
      // Giá gốc (trước khi giảm) - dùng để hiển thị gạch ngang
    },
    pDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // % Giảm giá trực tiếp
    },
    offerExpiry: Date, // Thời hạn khuyến mãi

    // ===========================
    // PHÂN LOẠI (CATEGORY)
    // ===========================
    pCategory: {
      type: ObjectId,
      ref: "categories",
      required: true,
      index: true,
      // Tham chiếu đến danh mục sản phẩm
    },

    // ===========================
    // THÔNG TIN CHI TIẾT (DETAILS)
    // ===========================
    furniture: {
      // Kích thước (Dimensions)
      dimensions: {
        length: Number,        // Dài (cm)
        width: Number,         // Rộng (cm)
        height: Number,        // Cao (cm)
        depth: Number,         // Sâu (cm)
        unit: {
          type: String,
          default: "cm",
        },
      },

      // Chất liệu (Materials)
      material: {
        primary: String,       // Chất liệu chính (Gỗ, Da, Vải...)
        secondary: [String],   // Chất liệu phụ
        filling: String,       // Chất liệu đệm/nhân
      },

      weight: Number,      // Trọng lượng (kg)
      maxWeight: Number,   // Tải trọng tối đa (kg)
    },

    // ===========================
    // HÌNH ẢNH (IMAGES)
    // ===========================
    images: [String],        // Danh sách tên file ảnh
    thumbnailImage: String,   // Ảnh đại diện chính

    // ===========================
    // TRẠNG THÁI (STATUS)
    // ===========================
    pStatus: {
      type: String,
      enum: ["active", "inactive", "discontinued", "draft", "Active", "Inactive"],
      default: "draft",
      index: true,
      // Trạng thái: Active (Đang bán), Inactive (Ẩn), Draft (Nháp)
    },

    // ===========================
    // TÍNH NĂNG (FLAGS)
    // ===========================
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
      // Sản phẩm nổi bật
    },
    isRecommended: {
      type: Boolean,
      default: false,
      index: true,
      // Sản phẩm đề xuất
    },
    isNewProduct: {
      type: Boolean,
      default: true,
      index: true,
      // Sản phẩm mới
    },
    isOnSale: {
      type: Boolean,
      default: false,
      index: true,
      // Đang giảm giá/Sale
    },
    isBestseller: {
      type: Boolean,
      default: false,
      // Sản phẩm bán chạy
    },

    // ===========================
    // ĐÁNH GIÁ (REVIEWS)
    // ===========================
    pRatingsReviews: [
      {
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
        title: String,
        review: String,
        user: {
          type: ObjectId,
          ref: "customers",
        },
        verified: Boolean,
        helpful: {
          yes: { type: Number, default: 0 },
          no: { type: Number, default: 0 },
        },
        images: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    createdBy: {
      type: ObjectId,
      ref: "users",
    },
    updatedBy: {
      type: ObjectId,
      ref: "users",
    },
    view_count: {
      type: Number,
      default: 0,
      // Lượt xem
    },
    wishlist_count: {
      type: Number,
      default: 0,
      // Lượt yêu thích
    },
  },
  { timestamps: true }
);

furnitureProductSchema.index({
  pName: "text",
  pDescription: "text",
});
furnitureProductSchema.index({ pCategory: 1, pStatus: 1 });
furnitureProductSchema.index({ isFeatured: 1, isRecommended: 1, pStatus: 1 });
furnitureProductSchema.index({ pPrice: 1, pStatus: 1 });
furnitureProductSchema.index({ isNewProduct: 1, pStatus: 1 });
furnitureProductSchema.index({ pStatus: 1, createdAt: -1 });


furnitureProductSchema.methods.getMainImage = function () {
  const mainImage = this.images.find((img) => img.type === "main");
  return mainImage || this.images[0] || null;
};

furnitureProductSchema.methods.getPriceAfterDiscount = function () {
  const discountValue = this.discount || this.pDiscount || 0;
  if (discountValue) {
    return this.pPrice - this.pPrice * (discountValue / 100);
  }
  return this.pPrice;
};

furnitureProductSchema.methods.getAverageRating = function () {
  if (this.pRatingsReviews.length === 0) return 0;
  const sum = this.pRatingsReviews.reduce(
    (acc, review) => acc + parseInt(review.rating),
    0
  );
  return (sum / this.pRatingsReviews.length).toFixed(1);
};

furnitureProductSchema.virtual("discountedPrice").get(function () {
  return this.getPriceAfterDiscount();
});

furnitureProductSchema.virtual("averageRating").get(function () {
  return this.getAverageRating();
});

furnitureProductSchema.virtual("reviewCount").get(function () {
  return this.pRatingsReviews.length;
});

furnitureProductSchema.pre("save", function (next) {
  // Tự động tạo slug từ pName
  if (this.isModified("pName")) {
    this.pSlug = this.pName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  // Tự động tạo SKU
  if (!this.pSKU) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.pSKU = `FURN-${timestamp}-${random}`;
  }

  // Sync discount fields
  if (this.pDiscount && !this.discount) {
    this.discount = this.pDiscount;
  } else if (this.discount && !this.pDiscount) {
    this.pDiscount = this.discount;
  }

  next();
});



furnitureProductSchema.statics.findNewProducts = function (limit = 10, days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ pStatus: { $in: ["active", "Active"] }, createdAt: { $gte: date } })
    .sort({ createdAt: -1 })
    .limit(limit);
};

furnitureProductSchema.statics.findTopRated = function (limit = 10) {
  return this.aggregate([
    { $match: { pStatus: { $in: ["active", "Active"] } } },
    {
      $addFields: {
        avgRating: {
          $cond: [
            { $eq: [{ $size: "$pRatingsReviews" }, 0] },
            0,
            {
              $avg: {
                $map: {
                  input: "$pRatingsReviews",
                  as: "review",
                  in: { $toInt: "$$review.rating" },
                },
              },
            },
          ],
        },
      },
    },
    { $sort: { avgRating: -1 } },
    { $limit: limit },
  ]);
};

const productModel = mongoose.model("products", furnitureProductSchema);

module.exports = productModel;
