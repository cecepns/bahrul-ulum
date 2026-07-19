import { api } from "./api";

const handleError = (error) => {
  let errData = error.response?.data;
  
  if (errData && typeof errData === "object") {
    // If it's a standard error object with a message property
    if (errData.message && typeof errData.message === "string") {
      // Keep it as is
    } else {
      // If it's a validation error object (keys pointing to arrays of strings)
      const messages = [];
      Object.keys(errData).forEach((key) => {
        if (Array.isArray(errData[key])) {
          messages.push(...errData[key]);
        } else if (typeof errData[key] === "string") {
          messages.push(errData[key]);
        }
      });
      
      if (messages.length > 0) {
        errData = {
          success: false,
          message: messages.map((m, idx) => `${idx + 1}. ${m}`).join("\n"),
          errors: errData
        };
      }
    }
  }
  
  return errData || { success: false, message: "Terjadi kesalahan koneksi jaringan." };
};

export const request = {
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};
