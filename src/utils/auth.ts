export const saveCurrentRoute = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;
    // Don't save login or signup routes
    if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
      localStorage.setItem('previousRoute', currentPath);
    }
  }
};

export const getAndClearSavedRoute = () => {
  const route = localStorage.getItem('previousRoute');
  localStorage.removeItem('previousRoute');
  return route || '/offers'; // fallback to /offers if no saved route
}; 