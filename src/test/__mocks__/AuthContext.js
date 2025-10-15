module.exports = {
  useAuth: () => ({ 
    login: jest.fn(),
    logout: jest.fn(),
    user: null,
    isAuthenticated: false
  })
};
