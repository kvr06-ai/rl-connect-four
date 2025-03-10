/**
 * AlphaZero Service
 * 
 * This module communicates with the AlphaZero Python API to get the best moves
 * for the Connect Four game using the pre-trained AlphaZero model.
 */

const ALPHA_ZERO_API_URL = 'http://localhost:5002';

/**
 * Initialize the AlphaZero model
 * @returns {Promise<boolean>} True if successful
 */
export async function initializeAlphaZero() {
  try {
    const response = await fetch(`${ALPHA_ZERO_API_URL}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Failed to initialize AlphaZero:', error);
    return false;
  }
}

/**
 * Get the best move from AlphaZero
 * @param {Array} board - The current board state
 * @returns {Promise<number>} The column to place the next token
 */
export async function getAlphaZeroMove(board) {
  try {
    const response = await fetch(`${ALPHA_ZERO_API_URL}/get_move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ board })
    });
    
    if (!response.ok) {
      // If the API returns an error, throw it
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error getting move from AlphaZero');
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && typeof data.column === 'number') {
      return data.column;
    } else {
      throw new Error('Invalid response from AlphaZero API');
    }
  } catch (error) {
    console.error('Failed to get move from AlphaZero:', error);
    // Return null to indicate we should fall back to the built-in AI
    return null;
  }
}

/**
 * Check if the AlphaZero API is available
 * @returns {Promise<boolean>} True if the API is available
 */
export async function isAlphaZeroAvailable() {
  try {
    const response = await fetch(`${ALPHA_ZERO_API_URL}/health`, {
      method: 'GET'
    });
    
    return response.ok;
  } catch (error) {
    console.error('AlphaZero API is not available:', error);
    return false;
  }
} 