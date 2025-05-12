const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  applicableType: {
    type: String,
    enum: ['item', 'category', 'bill', 'price_range'],
    required: true
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  minPurchaseAmount: {
    type: Number,
    min: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Method to check if discount is currently active based on dates
discountSchema.methods.isCurrentlyActive = function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  // Check if current date is after start date (if specified)
  if (this.startDate && now < this.startDate) {
    return false;
  }
  
  // Check if current date is before end date (if specified)
  if (this.endDate && now > this.endDate) {
    return false;
  }
  
  return true;
};

// Method to calculate discount amount for a given price
discountSchema.methods.calculateDiscount = function(price) {
  if (!this.isCurrentlyActive()) return 0;
  
  if (this.discountType === 'percentage') {
    return (price * this.discountValue) / 100;
  } else {
    return Math.min(price, this.discountValue); // Fixed amount, but not more than the price
  }
};

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
