import api from './api';

export const discountAPI = {
  getAllDiscounts: async () => {
    const response = await api.get('/discounts');
    return response.data;
  },
  
  getDiscount: async (id) => {
    const response = await api.get(`/discounts/${id}`);
    return response.data;
  },
  
  createDiscount: async (discountData) => {
    const response = await api.post('/discounts', discountData);
    return response.data;
  },
  
  updateDiscount: async (id, discountData) => {
    const response = await api.put(`/discounts/${id}`, discountData);
    return response.data;
  },
  
  deleteDiscount: async (id) => {
    const response = await api.delete(`/discounts/${id}`);
    return response.data;
  },
  
  getDiscountsForItem: async (itemId) => {
    const response = await api.get(`/discounts/item/${itemId}`);
    return response.data;
  },
  
  calculateDiscountsForBill: async (billData) => {
    const response = await api.post('/discounts/calculate-bill', billData);
    return response.data;
  },
  
  toggleDiscountStatus: async (id, isActive) => {
    const response = await api.patch(`/discounts/${id}/toggle-status`, { isActive });
    return response.data;
  }
};

export default discountAPI;
