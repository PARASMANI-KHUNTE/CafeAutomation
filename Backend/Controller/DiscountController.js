const Discount = require('../Model/Discount');
const Menu = require('../Model/Menu');
const Category = require('../Model/Category');

// Get all discounts
exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find()
      .populate('applicableItems', 'name price')
      .populate('applicableCategories', 'name');
    
    res.status(200).json(discounts);
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ message: 'Failed to fetch discounts', error: error.message });
  }
};

// Get a single discount by ID
exports.getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('applicableItems', 'name price')
      .populate('applicableCategories', 'name');
    
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    
    res.status(200).json(discount);
  } catch (error) {
    console.error('Error fetching discount:', error);
    res.status(500).json({ message: 'Failed to fetch discount', error: error.message });
  }
};

// Create a new discount
exports.createDiscount = async (req, res) => {
  try {
    // Validate request body
    const {
      name,
      description,
      discountType,
      discountValue,
      applicableType,
      applicableItems,
      applicableCategories,
      minPurchaseAmount,
      startDate,
      endDate,
      isActive
    } = req.body;
    
    // Check for duplicate discounts based on type
    if (applicableType === 'bill') {
      // Check if there's already a bill-wide discount
      const existingBillDiscount = await Discount.findOne({ applicableType: 'bill' });
      if (existingBillDiscount) {
        return res.status(400).json({ 
          message: 'A bill-wide discount already exists. Please deactivate it before creating a new one.'
        });
      }
    } else if (applicableType === 'item' && applicableItems && applicableItems.length > 0) {
      // Check for duplicate item discounts
      const existingItemDiscounts = await Discount.find({
        applicableType: 'item',
        applicableItems: { $in: applicableItems }
      });
      
      if (existingItemDiscounts.length > 0) {
        const itemIds = existingItemDiscounts.flatMap(d => d.applicableItems);
        const duplicateItems = applicableItems.filter(id => itemIds.includes(id));
        
        if (duplicateItems.length > 0) {
          return res.status(400).json({ 
            message: 'Some items already have discounts applied. Please remove those items or deactivate their existing discounts.'
          });
        }
      }
    } else if (applicableType === 'category' && applicableCategories && applicableCategories.length > 0) {
      // Check for duplicate category discounts
      const existingCategoryDiscounts = await Discount.find({
        applicableType: 'category',
        applicableCategories: { $in: applicableCategories }
      });
      
      if (existingCategoryDiscounts.length > 0) {
        const categoryIds = existingCategoryDiscounts.flatMap(d => d.applicableCategories);
        const duplicateCategories = applicableCategories.filter(id => categoryIds.includes(id));
        
        if (duplicateCategories.length > 0) {
          return res.status(400).json({ 
            message: 'Some categories already have discounts applied. Please remove those categories or deactivate their existing discounts.'
          });
        }
      }
    }
    
    // Basic validation
    if (!name || !discountType || discountValue === undefined || !applicableType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Additional validation based on applicableType
    if (applicableType === 'item' && (!applicableItems || applicableItems.length === 0)) {
      return res.status(400).json({ message: 'Applicable items are required for item-specific discounts' });
    }
    
    if (applicableType === 'category' && (!applicableCategories || applicableCategories.length === 0)) {
      return res.status(400).json({ message: 'Applicable categories are required for category-specific discounts' });
    }
    
    if (applicableType === 'price_range' && minPurchaseAmount === undefined) {
      return res.status(400).json({ message: 'Minimum purchase amount is required for price range discounts' });
    }
    
    // Create new discount
    const newDiscount = new Discount({
      name,
      description,
      discountType,
      discountValue,
      applicableType,
      isActive: isActive !== undefined ? isActive : true,
      startDate,
      endDate
    });
    
    // Add applicable items/categories/min purchase amount based on type
    if (applicableType === 'item' && applicableItems) {
      newDiscount.applicableItems = applicableItems;
    }
    
    if (applicableType === 'category' && applicableCategories) {
      newDiscount.applicableCategories = applicableCategories;
    }
    
    if (applicableType === 'price_range' && minPurchaseAmount !== undefined) {
      newDiscount.minPurchaseAmount = minPurchaseAmount;
    }
    
    await newDiscount.save();
    
    res.status(201).json({
      message: 'Discount created successfully',
      discount: newDiscount
    });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({ message: 'Failed to create discount', error: error.message });
  }
};

// Update an existing discount
exports.updateDiscount = async (req, res) => {
  try {
    const discountId = req.params.id;
    
    // Check if discount exists
    const existingDiscount = await Discount.findById(discountId);
    if (!existingDiscount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    
    const updateData = req.body;
    const newApplicableType = updateData.applicableType;
    const newApplicableItems = updateData.applicableItems;
    const newApplicableCategories = updateData.applicableCategories;
    
    // Only perform duplicate checks if these fields are being updated
    if (newApplicableType) {
      // Check for duplicate discounts based on type
      if (newApplicableType === 'bill' && newApplicableType !== existingDiscount.applicableType) {
        // Check if there's already a bill-wide discount
        const existingBillDiscount = await Discount.findOne({ 
          applicableType: 'bill',
          _id: { $ne: discountId } // Exclude current discount
        });
        
        if (existingBillDiscount) {
          return res.status(400).json({ 
            message: 'A bill-wide discount already exists. Please deactivate it before updating this discount.'
          });
        }
      } else if (newApplicableType === 'item' && newApplicableItems && newApplicableItems.length > 0) {
        // Check for duplicate item discounts
        const existingItemDiscounts = await Discount.find({
          applicableType: 'item',
          _id: { $ne: discountId }, // Exclude current discount
          applicableItems: { $in: newApplicableItems }
        });
        
        if (existingItemDiscounts.length > 0) {
          const itemIds = existingItemDiscounts.flatMap(d => d.applicableItems.map(item => item.toString()));
          const duplicateItems = newApplicableItems.filter(id => itemIds.includes(id.toString()));
          
          if (duplicateItems.length > 0) {
            return res.status(400).json({ 
              message: 'Some items already have discounts applied. Please remove those items or deactivate their existing discounts.'
            });
          }
        }
      } else if (newApplicableType === 'category' && newApplicableCategories && newApplicableCategories.length > 0) {
        // Check for duplicate category discounts
        const existingCategoryDiscounts = await Discount.find({
          applicableType: 'category',
          _id: { $ne: discountId }, // Exclude current discount
          applicableCategories: { $in: newApplicableCategories }
        });
        
        if (existingCategoryDiscounts.length > 0) {
          const categoryIds = existingCategoryDiscounts.flatMap(d => d.applicableCategories.map(cat => cat.toString()));
          const duplicateCategories = newApplicableCategories.filter(id => categoryIds.includes(id.toString()));
          
          if (duplicateCategories.length > 0) {
            return res.status(400).json({ 
              message: 'Some categories already have discounts applied. Please remove those categories or deactivate their existing discounts.'
            });
          }
        }
      }
    }
    
    // Extract update data
    const {
      name,
      description,
      discountType,
      discountValue,
      applicableType,
      applicableItems,
      applicableCategories,
      minPurchaseAmount,
      startDate,
      endDate,
      isActive
    } = updateData;
    
    // Prepare update object
    const discountUpdateData = {};
    
    // Update fields if provided
    if (name) discountUpdateData.name = name;
    if (description !== undefined) discountUpdateData.description = description;
    if (discountType) discountUpdateData.discountType = discountType;
    if (discountValue !== undefined) discountUpdateData.discountValue = discountValue;
    if (newApplicableType) discountUpdateData.applicableType = newApplicableType;
    if (isActive !== undefined) discountUpdateData.isActive = isActive;
    if (startDate !== undefined) discountUpdateData.startDate = startDate;
    if (endDate !== undefined) discountUpdateData.endDate = endDate;
    
    // Handle applicable items based on type
    if (newApplicableType === 'item' && newApplicableItems) {
      discountUpdateData.applicableItems = newApplicableItems;
      // Clear categories if switching to item-specific
      discountUpdateData.applicableCategories = [];
      discountUpdateData.minPurchaseAmount = undefined;
    } else if (newApplicableType === 'category' && newApplicableCategories) {
      discountUpdateData.applicableCategories = newApplicableCategories;
      // Clear items if switching to category
      discountUpdateData.applicableItems = [];
      discountUpdateData.minPurchaseAmount = undefined;
    } else if (newApplicableType === 'price_range' && minPurchaseAmount !== undefined) {
      discountUpdateData.minPurchaseAmount = minPurchaseAmount;
      // Clear items and categories if switching to price range
      discountUpdateData.applicableItems = [];
      discountUpdateData.applicableCategories = [];
    } else if (newApplicableType === 'bill') {
      // Clear all specific targets for bill-wide discounts
      discountUpdateData.applicableItems = [];
      discountUpdateData.applicableCategories = [];
      discountUpdateData.minPurchaseAmount = undefined;
    }
    
    // Update the discount
    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      discountUpdateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      message: 'Discount updated successfully',
      discount: updatedDiscount
    });
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({ message: 'Failed to update discount', error: error.message });
  }
};

// Delete a discount
exports.deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    
    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }
    
    await Discount.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({ message: 'Failed to delete discount', error: error.message });
  }
};

// Toggle discount active status
exports.toggleDiscountStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the discount
    const discount = await Discount.findById(id);

    if (!discount) {
      return res.status(404).json({ message: 'Discount not found' });
    }

    // Toggle the active status
    discount.isActive = !discount.isActive;
    await discount.save();

    res.status(200).json({
      message: `Discount ${discount.isActive ? 'activated' : 'deactivated'} successfully`,
      discount
    });
  } catch (error) {
    console.error('Error toggling discount status:', error);
    res.status(500).json({ message: 'Error toggling discount status', error: error.message });
  }
};

// Get all active discounts (public endpoint for menu display)
exports.getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();

    // Find all active discounts that are currently valid (based on start/end dates)
    const activeDiscounts = await Discount.find({
      isActive: true,
      $and: [
        // Check start date
        { $or: [
          { startDate: { $exists: false } },
          { startDate: null },
          { startDate: { $lte: now } }
        ]},
        // Check end date
        { $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]}
      ]
    }).populate('applicableItems', '_id name price category')
      .populate('applicableCategories', '_id name');

    // Format the response to be more suitable for frontend display
    const formattedDiscounts = activeDiscounts.map(discount => ({
      _id: discount._id,
      name: discount.name,
      description: discount.description,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      applicableType: discount.applicableType,
      applicableItems: discount.applicableItems.map(item => item._id),
      applicableCategories: discount.applicableCategories.map(cat => cat._id),
      minPurchaseAmount: discount.minPurchaseAmount || 0
    }));

    res.status(200).json(formattedDiscounts);
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    res.status(500).json({ message: 'Error fetching active discounts', error: error.message });
  }
};

// Get active discounts applicable to a specific item
exports.getDiscountsForItem = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    
    // Find the item to get its category
    const item = await Menu.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const now = new Date();
    
    // Find all active discounts that apply to this item
    const discounts = await Discount.find({
      isActive: true,
      $or: [
        // Item-specific discounts
        { applicableType: 'item', applicableItems: itemId },
        // Category discounts
        { applicableType: 'category', applicableCategories: item.category },
        // Bill-wide discounts
        { applicableType: 'bill' },
        // Price-range discounts are not included here as they depend on the total bill amount
      ],
      $and: [
        // Check start date
        { $or: [
          { startDate: { $exists: false } },
          { startDate: null },
          { startDate: { $lte: now } }
        ]},
        // Check end date
        { $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]}
      ]
    });
    
    res.status(200).json(discounts);
  } catch (error) {
    console.error('Error fetching discounts for item:', error);
    res.status(500).json({ message: 'Failed to fetch discounts for item', error: error.message });
  }
};

// Calculate applicable discounts for a bill
exports.calculateDiscountsForBill = async (req, res) => {
  try {
    console.log('==================== DISCOUNT CALCULATION DEBUG ====================');
    console.log('Calculating discounts for bill:', JSON.stringify(req.body, null, 2));
    const { items, totalAmount } = req.body;
    
    if (!items || !Array.isArray(items) || !totalAmount) {
      console.log('Invalid request - missing items or totalAmount');
      return res.status(400).json({ message: 'Invalid request. Items array and totalAmount are required.' });
    }
    
    // Debug log all items being checked for discounts
    console.log('Items to check for discounts:', items.map(item => `ID: ${item.itemId}, Price: ${item.price}, Qty: ${item.quantity}`).join('\n'));
    
    const now = new Date();
    
    // Get all active discounts
    const allDiscounts = await Discount.find({
      isActive: true,
      $and: [
        // Check start date
        { $or: [
          { startDate: { $exists: false } },
          { startDate: null },
          { startDate: { $lte: now } }
        ]},
        // Check end date
        { $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]}
      ]
    }).populate('applicableItems', 'name price category').populate('applicableCategories', 'name');
    
    // Debug log all active discounts
    console.log(`Found ${allDiscounts.length} active discounts:`);
    allDiscounts.forEach((discount, index) => {
      console.log(`Discount #${index + 1}: ${discount.name}`);
      console.log(`  Type: ${discount.discountType}, Value: ${discount.discountValue}, ApplicableType: ${discount.applicableType}`);
      
      if (discount.applicableType === 'item') {
        console.log(`  Applicable Items: ${JSON.stringify(discount.applicableItems.map(item => item._id ? item._id.toString() : 'Unknown ID'))}`);
      } else if (discount.applicableType === 'category') {
        console.log(`  Applicable Categories: ${JSON.stringify(discount.applicableCategories.map(cat => cat._id ? cat._id.toString() : 'Unknown ID'))}`);
      } else if (discount.applicableType === 'price_range') {
        console.log(`  Min Purchase Amount: ${discount.minPurchaseAmount}`);
      }
    });
    
    // Group discounts by type
    const itemDiscounts = allDiscounts.filter(d => d.applicableType === 'item');
    const categoryDiscounts = allDiscounts.filter(d => d.applicableType === 'category');
    const billDiscounts = allDiscounts.filter(d => d.applicableType === 'bill');
    const priceRangeDiscounts = allDiscounts.filter(d => 
      d.applicableType === 'price_range' && d.minPurchaseAmount <= totalAmount
    );
    
    // Calculate item-specific discounts
    const itemDiscountDetails = [];
    let totalItemDiscounts = 0;
    
    for (const item of items) {
      const itemId = item.itemId;
      const quantity = item.quantity || 1;
      const price = item.price;
      const subtotal = price * quantity;
      
      console.log(`\nProcessing item: ${itemId}, price: ${price}, quantity: ${quantity}`);
      
      // Find applicable item discounts
      const applicableItemDiscounts = itemDiscounts.filter(d => 
        d.applicableItems.some(i => i._id.toString() === itemId)
      );
      
      console.log(`Found ${applicableItemDiscounts.length} item-specific discounts for item ${itemId}`);
      
      // Find applicable category discounts
      const itemObj = await Menu.findById(itemId);
      console.log(`Menu item details: ${JSON.stringify(itemObj ? { id: itemObj._id, name: itemObj.name, category: itemObj.category } : 'Not found')}`);
      
      const categoryId = itemObj ? itemObj.category : null;
      
      const applicableCategoryDiscounts = categoryId 
        ? categoryDiscounts.filter(d => 
            d.applicableCategories.some(c => c._id.toString() === categoryId.toString())
          )
        : [];
        
      console.log(`Found ${applicableCategoryDiscounts.length} category discounts for item ${itemId} with category ${categoryId}`);
      if (applicableCategoryDiscounts.length > 0) {
        console.log(`Category discount details: ${JSON.stringify(applicableCategoryDiscounts.map(d => ({ name: d.name, value: d.discountValue })))}`); 
      }
      
      // Find the best discount for this item
      const allApplicableDiscounts = [...applicableItemDiscounts, ...applicableCategoryDiscounts];
      
      if (allApplicableDiscounts.length > 0) {
        // Calculate discount amounts
        const discountAmounts = allApplicableDiscounts.map(discount => {
          const amount = discount.discountType === 'percentage'
            ? (subtotal * discount.discountValue / 100)
            : Math.min(subtotal, discount.discountValue * quantity);
          
          return {
            discount,
            amount
          };
        });
        
        // Get the best discount (highest amount)
        const bestDiscount = discountAmounts.reduce((best, current) => 
          current.amount > best.amount ? current : best
        , { amount: 0 });
        
        if (bestDiscount.amount > 0) {
          itemDiscountDetails.push({
            itemId,
            itemName: itemObj ? itemObj.name : 'Unknown Item',
            originalPrice: price,
            quantity,
            subtotal,
            discountName: bestDiscount.discount.name,
            discountAmount: bestDiscount.amount,
            finalPrice: subtotal - bestDiscount.amount
          });
          
          totalItemDiscounts += bestDiscount.amount;
        }
      }
    }
    
    // Calculate bill-wide discounts
    let billDiscountDetails = null;
    
    if (billDiscounts.length > 0 || priceRangeDiscounts.length > 0) {
      const allBillDiscounts = [...billDiscounts, ...priceRangeDiscounts];
      
      // Calculate discount amounts
      const discountAmounts = allBillDiscounts.map(discount => {
        const amount = discount.discountType === 'percentage'
          ? (totalAmount * discount.discountValue / 100)
          : Math.min(totalAmount, discount.discountValue);
        
        return {
          discount,
          amount
        };
      });
      
      // Get the best discount (highest amount)
      const bestDiscount = discountAmounts.reduce((best, current) => 
        current.amount > best.amount ? current : best
      , { amount: 0 });
      
      if (bestDiscount.amount > 0) {
        billDiscountDetails = {
          discountName: bestDiscount.discount.name,
          discountAmount: bestDiscount.amount,
          originalTotal: totalAmount,
          finalTotal: totalAmount - bestDiscount.amount
        };
      }
    }
    
    // Determine the best overall discount strategy
    // Option 1: Apply item-specific discounts
    const totalWithItemDiscounts = totalAmount - totalItemDiscounts;
    
    // Option 2: Apply bill-wide discount
    const totalWithBillDiscount = billDiscountDetails 
      ? billDiscountDetails.finalTotal 
      : totalAmount;
    
    // Choose the better option
    const useBillDiscount = totalWithBillDiscount < totalWithItemDiscounts;
    
    const response = {
      originalTotal: totalAmount,
      finalTotal: useBillDiscount ? totalWithBillDiscount : totalWithItemDiscounts,
      totalSavings: useBillDiscount 
        ? (billDiscountDetails ? billDiscountDetails.discountAmount : 0)
        : totalItemDiscounts,
      discountStrategy: useBillDiscount ? 'bill' : 'items',
      appliedDiscounts: useBillDiscount 
        ? (billDiscountDetails ? [billDiscountDetails] : [])
        : itemDiscountDetails
    };
    
    console.log('==================== DISCOUNT CALCULATION RESULT ====================');
    console.log(`Original Total: ${response.originalTotal}`);
    console.log(`Final Total: ${response.finalTotal}`);
    console.log(`Total Savings: ${response.totalSavings}`);
    console.log(`Discount Strategy: ${response.discountStrategy}`);
    console.log(`Applied Discounts: ${JSON.stringify(response.appliedDiscounts)}`);
    console.log('====================================================================');
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error calculating discounts for bill:', error);
    res.status(500).json({ message: 'Failed to calculate discounts', error: error.message });
  }
};
