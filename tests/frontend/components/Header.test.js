import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../../frontend/src/components/Header';

// Mock Firebase Auth
const mockSignOut = jest.fn();
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User'
};

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signOut: () => mockSignOut(),
  onAuthStateChanged: jest.fn()
}));

// Mock React Router hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock User Context
const mockUserContext = {
  user: null,
  userProfile: null,
  setUser: jest.fn(),
  setUserProfile: jest.fn()
};

jest.mock('../../../frontend/src/context/UserContext', () => ({
  useUser: () => mockUserContext
}));

// Test wrapper with router
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserContext.user = null;
    mockUserContext.userProfile = null;
  });

  describe('Unauthenticated User', () => {
    test('should render header with login/register buttons when user is not authenticated', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Migo')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    test('should navigate to login page when login button is clicked', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should navigate to register page when register button is clicked', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    test('should display navigation links for unauthenticated users', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    beforeEach(() => {
      mockUserContext.user = mockUser;
      mockUserContext.userProfile = {
        _id: 'profile-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        avatar: ''
      };
    });

    test('should render header with user menu when user is authenticated', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    test('should display user avatar when available', () => {
      mockUserContext.userProfile.avatar = 'https://example.com/avatar.jpg';
      
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const avatar = screen.getByAltText('User Avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('should display default avatar when user avatar is not available', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Should display default avatar or initials
      expect(screen.getByText('TU')).toBeInTheDocument(); // First letters of Test User
    });

    test('should show user menu when avatar is clicked', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const avatarButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    test('should navigate to profile page when profile menu item is clicked', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const avatarButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const profileLink = screen.getByText('Profile');
        fireEvent.click(profileLink);
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });

    test('should handle logout when logout button is clicked', async () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const avatarButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockUserContext.setUser).toHaveBeenCalledWith(null);
      expect(mockUserContext.setUserProfile).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Vendor-specific Features', () => {
    beforeEach(() => {
      mockUserContext.user = mockUser;
      mockUserContext.userProfile = {
        _id: 'vendor-profile-id',
        name: 'Test Vendor',
        email: 'vendor@example.com',
        role: 'vendor',
        avatar: ''
      };
    });

    test('should show vendor-specific navigation for vendors', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('My Services')).toBeInTheDocument();
      expect(screen.getByText('Jobs')).toBeInTheDocument();
      expect(screen.getByText('Create Service')).toBeInTheDocument();
    });

    test('should navigate to create service page for vendors', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const createServiceLink = screen.getByText('Create Service');
      fireEvent.click(createServiceLink);

      expect(mockNavigate).toHaveBeenCalledWith('/create-service');
    });
  });

  describe('Customer-specific Features', () => {
    beforeEach(() => {
      mockUserContext.user = mockUser;
      mockUserContext.userProfile = {
        _id: 'customer-profile-id',
        name: 'Test Customer',
        email: 'customer@example.com',
        role: 'customer',
        avatar: ''
      };
    });

    test('should show customer-specific navigation for customers', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByText('My Bookings')).toBeInTheDocument();
      expect(screen.getByText('Find Services')).toBeInTheDocument();
    });

    test('should navigate to bookings page for customers', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const bookingsLink = screen.getByText('My Bookings');
      fireEvent.click(bookingsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/jobs');
    });
  });

  describe('Search Functionality', () => {
    test('should render search input', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search services/i);
      expect(searchInput).toBeInTheDocument();
    });

    test('should handle search input changes', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search services/i);
      fireEvent.change(searchInput, { target: { value: 'web development' } });

      expect(searchInput.value).toBe('web development');
    });

    test('should navigate to search results when search is submitted', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText(/search services/i);
      fireEvent.change(searchInput, { target: { value: 'web development' } });
      fireEvent.submit(searchInput.closest('form'));

      expect(mockNavigate).toHaveBeenCalledWith('/services/search?q=web development');
    });
  });

  describe('Mobile Menu', () => {
    test('should show mobile menu toggle button on small screens', () => {
      // Mock window.innerWidth to simulate mobile screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
      expect(menuToggle).toBeInTheDocument();
    });

    test('should toggle mobile menu when menu button is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768
      });

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const menuToggle = screen.getByRole('button', { name: /toggle menu/i });
      fireEvent.click(menuToggle);

      // Menu should now be visible
      expect(screen.getByRole('navigation')).toHaveClass('mobile-menu-open');
    });
  });

  describe('Error Handling', () => {
    test('should handle logout errors gracefully', async () => {
      mockSignOut.mockRejectedValue(new Error('Logout failed'));
      
      mockUserContext.user = mockUser;
      mockUserContext.userProfile = {
        name: 'Test User',
        role: 'customer'
      };

      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const avatarButton = screen.getByRole('button', { name: /user menu/i });
      fireEvent.click(avatarButton);

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
      });

      // Should still clear user state even if Firebase logout fails
      expect(mockUserContext.setUser).toHaveBeenCalledWith(null);
      expect(mockUserContext.setUserProfile).toHaveBeenCalledWith(null);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText(/search services/i)).toBeInTheDocument();
    });

    test('should be keyboard navigable', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      const firstLink = screen.getByText('Migo');
      firstLink.focus();
      expect(document.activeElement).toBe(firstLink);

      // Tab through navigation items
      fireEvent.keyDown(document.activeElement, { key: 'Tab' });
      expect(document.activeElement).toHaveAttribute('tabindex', '0');
    });
  });
}); 