import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Request API service
export const requestService = {
  // Get all requests for current user
  getUserRequests: async () => {
    try {
      const response = await axios.get(`${API_URL}/requests`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all public requests (for map and NGO viewing)
  getAllRequests: async () => {
    try {
      const response = await axios.get(`${API_URL}/requests/map`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a specific request (victim-only)
  getRequest: async (requestId) => {
    try {
      const response = await axios.get(`${API_URL}/requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a specific request for viewing (accessible by NGOs)
  getRequestForView: async (requestId) => {
    try {
      const response = await axios.get(`${API_URL}/requests/view/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new request
  createRequest: async (requestData) => {
    try {
      const response = await axios.post(`${API_URL}/requests`, requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a request
  updateRequest: async (requestId, requestData) => {
    try {
      const response = await axios.put(`${API_URL}/requests/${requestId}`, requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a request
  deleteRequest: async (requestId) => {
    try {
      const response = await axios.delete(`${API_URL}/requests/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancel a request
  cancelRequest: async (requestId) => {
    try {
      const response = await axios.put(`${API_URL}/requests/${requestId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get potential matches for a request
  getRequestMatches: async (requestId) => {
    try {
      const response = await axios.get(`${API_URL}/matching/requests/${requestId}/matches`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Match a request with an offer
  matchRequestWithOffer: async (requestId, offerId) => {
    try {
      const response = await axios.post(`${API_URL}/matching/requests/${requestId}/match/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Accept an offer for a request
  acceptOffer: async (requestId, offerId) => {
    try {
      const response = await axios.put(`${API_URL}/matching/requests/${requestId}/accept/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reject an offer for a request
  rejectOffer: async (requestId, offerId) => {
    try {
      const response = await axios.put(`${API_URL}/matching/requests/${requestId}/reject/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark a request as fulfilled by an offer
  fulfillRequest: async (requestId, offerId) => {
    try {
      const response = await axios.put(`${API_URL}/matching/requests/${requestId}/fulfill/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's accepted and rejected matches
  getUserMatches: async () => {
    try {
      const response = await axios.get(`${API_URL}/requests`);
      const requests = response.data;
      
      // Extract all matches from all requests
      const allMatches = [];
      requests.forEach(request => {
        if (request.matchedWith && request.matchedWith.length > 0) {
          request.matchedWith.forEach(match => {
            allMatches.push({
              ...match,
              requestId: request._id,
              requestType: request.requestType,
              requestTitle: request.title || request.requestType,
              requestDescription: request.description,
              requestLocation: request.location,
              requestCreatedAt: request.createdAt
            });
          });
        }
      });
      
      return allMatches;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get accepted requests for NGO (requests that have accepted this NGO's offers)
  getAcceptedRequestsForNGO: async () => {
    try {
      const response = await axios.get(`${API_URL}/requests/accepted-for-ngo`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Offer API service
export const offerService = {
  // Get all offers for map (available to victims)
  getAllOffers: async () => {
    try {
      const response = await axios.get(`${API_URL}/offers/map`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all offers for current user
  getUserOffers: async () => {
    try {
      const response = await axios.get(`${API_URL}/offers`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get a specific offer
  getOffer: async (offerId) => {
    try {
      const response = await axios.get(`${API_URL}/offers/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new offer
  createOffer: async (offerData) => {
    try {
      const response = await axios.post(`${API_URL}/offers`, offerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update an offer
  updateOffer: async (offerId, offerData) => {
    try {
      const response = await axios.put(`${API_URL}/offers/${offerId}`, offerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete an offer
  deleteOffer: async (offerId) => {
    try {
      const response = await axios.delete(`${API_URL}/offers/${offerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark an offer as expired
  expireOffer: async (offerId) => {
    try {
      const response = await axios.put(`${API_URL}/offers/${offerId}/expire`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark an offer as fulfilled (help given)
  fulfillOffer: async (offerId) => {
    try {
      const response = await axios.put(`${API_URL}/offers/${offerId}/fulfill`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get potential matches for an offer
  getOfferMatches: async (offerId) => {
    try {
      const response = await axios.get(`${API_URL}/matching/offers/${offerId}/matches`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Match an offer with a request
  matchOfferWithRequest: async (offerId, requestId) => {
    try {
      const response = await axios.post(`${API_URL}/matching/offers/${offerId}/match/${requestId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Notification API service
export const notificationService = {
  // Get all notifications
  getNotifications: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get unread notifications
  getUnreadNotifications: async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/unread`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await axios.put(`${API_URL}/notifications/read-all`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(`${API_URL}/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Message service
export const messageService = {
  // Get all messages (sent or received)
  getAllMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/messages`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get sent messages
  getSentMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/sent`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get received messages
  getReceivedMessages: async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/received`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Send a message
  sendMessage: async (messageData) => {
    try {
      const response = await axios.post(`${API_URL}/messages`, messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const response = await axios.put(`${API_URL}/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    try {
      const response = await axios.delete(`${API_URL}/messages/${messageId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Government service
export const governmentService = {
  getMe: async () => {
    try {
      const response = await axios.get(`${API_URL}/government/me`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateProfile: async (updates) => {
    try {
      const response = await axios.put(`${API_URL}/government/me/profile`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getOverview: async () => {
    try {
      const response = await axios.get(`${API_URL}/government/overview`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getRequests: async () => {
    try {
      const response = await axios.get(`${API_URL}/government/requests`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getPendingUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/government/pending-users`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  verifyUser: async (userId) => {
    try {
      const response = await axios.put(`${API_URL}/government/users/${userId}/verify`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  rejectUser: async (userId, reason) => {
    try {
      const response = await axios.put(`${API_URL}/government/users/${userId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createEmergencyAlert: async ({ title, message, priority }) => {
    try {
      const response = await axios.post(`${API_URL}/government/alerts/emergency`, { title, message, priority });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  createAnnouncement: async ({ title, message }) => {
    try {
      const response = await axios.post(`${API_URL}/government/announcements`, { title, message });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  // Send help to emergency location (alerts nearby emergency services)
  sendEmergencyHelp: async (requestData) => {
    try {
      const response = await axios.post(`${API_URL}/government/emergency/send-help`, requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  // Contact requestor about their emergency
  contactEmergencyRequestor: async (contactData) => {
    try {
      const response = await axios.post(`${API_URL}/government/emergency/contact`, contactData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};