/**
 * FURNITURE PRODUCT MODEL - MongoDB Schema
 * Thiết kế cho hệ thống sản phẩm nội thất
 */

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const furnitureProductSchema = new mongoose.Schema(
  {
    // ===========================
    // THÔNG TIN CƠ BẢN
    // ===========================
    pName: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      index: true,
    },
    pSKU: {
      type: String,
      unique: true,
      required: true,
      index: true,
      // Format: FURN-{CATEGORY}-{TIMESTAMP}-{SERIAL}
    },
    pSlug: {
      type: String,
      unique: true,
      lowercase: true,
      // URL-friendly slug
    },
    pDescription: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    pShortDescription: {
      type: String,
      maxlength: 500,
      // Mô tả ngắn cho danh sách
    },


      // ===========================
      // ẢNH SẢN PHẨM (LƯU MẢNG STRING FILENAME)
      images: [
        {
          type: String,
          // filename or base64 string
        }
      ],
    // ===========================
    // GIÁ VÀ KHUYẾN MÃI
    // ===========================
    pPrice: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    pCost: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    pComparePrice: {
      type: Number,
      min: 0,
      // Giá gốc trước giảm
    },
    pCost: {
      type: Number,
      min: 0,
      // Giá vốn
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // Phần trăm giảm giá
    },
    pDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // Alias cho discount
    },
    pOffer: {
      type: String,
      // Miêu tả khuyến mãi
    },
    offerExpiry: Date,

    // ===========================
    // DANH MỤC & PHÂN LOẠI
    // ===========================
    pCategory: {
      type: ObjectId,
      ref: "categories",
      required: true,
      index: true,
    },
    pSubCategory: {
      type: ObjectId,
      ref: "categories",
    },

    // ===========================
    // THÔNG TIN CHI TIẾT NỘI THẤT
    // ===========================
    furniture: {
      // Kích thước
      dimensions: {
        length: Number,        // Chiều dài (cm)
        width: Number,         // Chiều rộng (cm)
        height: Number,        // Chiều cao (cm)
        depth: Number,         // Độ sâu (cm)
        unit: {
          type: String,
          default: "cm",
        },
      },

      // Chất liệu
      material: {
        primary: String,       // Chất liệu chính
        secondary: [String],   // Chất liệu phụ
        filling: String,       // Chất nhân (ghế/sofa)
      },

      // Màu sắc & Biến thể
      colors: [
        {
          colorName: String,
          colorCode: String,   // Hex code
          colorImage: String,
          available: {
            type: Boolean,
            default: true,
          },
          stock: {
            type: Number,
            default: 0,
          },
        },
      ],

      // Phong cách
      style: [String],
      // ["Hiện đại", "Tối giản", "Vintage", "Cổ điển", ...]

      // Tính năng đặc biệt
      features: [String],
      // ["Có ngăn kéo", "Xoay", "Kéo rộng", ...]

      // Trọng lượng & Kích thước vận chuyển
      weight: Number,         // kg
      maxWeight: Number,      // Trọng lượng tối đa
      shippingDimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: String,
      },

      // Hướng dẫn chăm sóc
      care: [String],
    },

    // ===========================
    // HÌNH ẢNH
    // ===========================
      // ===========================
      // HÌNH ẢNH (DEPRECATED FIELDS)
      pImages: [String],         // Array filenames for compatibility
      thumbnailImage: String,
    // ===========================
    // TÌNH TRẠNG & TỒN KHO
    // ===========================
    pQuantity: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    pReorder: {
      type: Number,
      default: 20,
      // Mức tồn kho cảnh báo
    },
    pSold: {
      type: Number,
      default: 0,
      // Số lượng bán được
    },
    pStatus: {
      type: String,
      enum: ["active", "inactive", "discontinued", "draft", "Active", "Inactive"],
      default: "draft",
      index: true,
    },

    // ===========================
    // HIỂN THỊ & TÍNH NĂNG
    // ===========================
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isRecommended: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewProduct: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOnSale: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },

    // ===========================
    // ĐÁNH GIÁ & BÌNH LUẬN
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
          yes: {
            type: Number,
            default: 0,
          },
          no: {
            type: Number,
            default: 0,
          },
        },
        images: [String],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ===========================
    // SEO & METADATA
    // ===========================
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
    tags: [String],
    collections: [
      {
        type: ObjectId,
        ref: "collections",
      },
    ],

    // ===========================
    // QUẢN LÝ & AUDIT
    // ===========================
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
    },
    wishlist_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ===========================
// INDEXES
// ===========================
furnitureProductSchema.index({
  pName: "text",
  pDescription: "text",
  "furniture.style": "text",
});
furnitureProductSchema.index({ pCategory: 1, pStatus: 1 });
furnitureProductSchema.index({ isFeatured: 1, isRecommended: 1, pStatus: 1 });
furnitureProductSchema.index({ pPrice: 1, pStatus: 1 });
furnitureProductSchema.index({ isNewProduct: 1, pStatus: 1 });
furnitureProductSchema.index({ pStatus: 1, createdAt: -1 });

// ===========================
// METHODS
// ===========================
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

// ===========================
// VIRTUAL FIELDS
// ===========================
furnitureProductSchema.virtual("discountedPrice").get(function () {
  return this.getPriceAfterDiscount();
});

furnitureProductSchema.virtual("averageRating").get(function () {
  return this.getAverageRating();
});

furnitureProductSchema.virtual("reviewCount").get(function () {
  return this.pRatingsReviews.length;
});

// ===========================
// PRE-SAVE MIDDLEWARE
// ===========================
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

// ===========================
// STATIC METHODS
// ===========================
furnitureProductSchema.statics.findBestsellers = function (limit = 10) {
  return this.find({ pStatus: "active", isBestseller: true })
    .sort({ pSold: -1 })
    .limit(limit);
};

furnitureProductSchema.statics.findNewProducts = function (limit = 10, days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.find({ pStatus: "active", createdAt: { $gte: date } })
    .sort({ createdAt: -1 })
    .limit(limit);
};

furnitureProductSchema.statics.findTopRated = function (limit = 10) {
  return this.aggregate([
    { $match: { pStatus: "active" } },
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
