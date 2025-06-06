import axios from "axios";

/**
 * Create standardised error result for API requests
 * @param {Error} error - The caught error object
 * @param {string} apiName - Name of the API ('Smithsonian', 'Europeana')
 * @param {string} context - Context of the request ('item', 'search', etc.)
 * @returns {Object} Standardised error result object
 */
export const createApiErrorResult = (error, apiName, context = 'request') => {
  // Handle cancelled requests 
  if (axios.isCancel(error) || error.name === 'AbortError') {
    return { 
      success: false, 
      error: { 
        type: 'cancelled', 
        message: 'Request cancelled' 
      } 
    };
  }

  // Network/connection errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return { 
      success: false, 
      error: { 
        type: 'timeout', 
        message: `${apiName} server is taking too long to respond` 
      } 
    };
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.name === 'NetworkError') {
    return { 
      success: false, 
      error: { 
        type: 'network', 
        message: `Cannot connect to ${apiName} server` 
      } 
    };
  }

  // Handle fetch API errors 
  if (error.response || (error.status && typeof error.status === 'number')) {
    const status = error.response?.status || error.status;
    
    if (status >= 500) {
      return { 
        success: false, 
        error: { 
          type: 'api', 
          message: `${apiName} server is temporarily unavailable` 
        } 
      };
    }
    
    if (status === 404) {
      const message = context === 'item' ? 'Item not found' : 'No results found';
      return { 
        success: false, 
        error: { 
          type: 'api', 
          message: `${message} in ${apiName}` 
        } 
      };
    }
    
    if (status >= 400) {
      return { 
        success: false, 
        error: { 
          type: 'api', 
          message: `Invalid request to ${apiName}` 
        } 
      };
    }
  }

  // Rate limiting 
  if (error.message?.includes('rate limit') || error.message?.includes('429')) {
    return { 
      success: false, 
      error: { 
        type: 'rate_limit', 
        message: `${apiName} is currently busy, please try again in a moment` 
      } 
    };
  }

  return { 
    success: false, 
    error: { 
      type: 'unknown', 
      message: `${apiName} archives temporarily unavailable` 
    } 
  };
};

/**
 * @param {Response} response - Fetch API response object
 * @returns {Object|null} Error object if response indicates error, null if OK
 */
export const checkFetchResponse = (response) => {
  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    error.status = response.status;
    error.statusText = response.statusText;
    return error;
  }
  return null;
};