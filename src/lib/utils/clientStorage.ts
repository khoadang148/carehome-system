
export const clientStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Helper function to safely parse JSON from localStorage
export const getParsedItem = <T>(key: string, defaultValue: T): T => {
  const item = clientStorage.getItem(key);
  if (!item) {
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch (error) {
    console.error('Error parsing JSON from localStorage:', error);
    return defaultValue;
  }
};

// Helper function to safely stringify and store objects
export const setParsedItem = <T>(key: string, value: T): void => {
  try {
    const stringValue = JSON.stringify(value);
    clientStorage.setItem(key, stringValue);
  } catch (error) {
    console.error('Error stringifying object for localStorage:', error);
  }
}; 