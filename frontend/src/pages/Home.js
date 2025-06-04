import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getServices, getFeaturedServices, getServicesByCategory } from '../api/serviceApi';
import '../styles/Home.css';

const Home = () => {
  const { currentUser } = useAuth();
  const [address, setAddress] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Real data state
  const [topServices, setTopServices] = useState([]);
  const [featuredVendors, setFeaturedVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const servicesRef = useRef(null);
  const topServicesRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuredVendorsRef = useRef(null);
  const categoriesRef = useRef(null);
  const appDownloadRef = useRef(null);
  const promotionalRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      
      // Add animation classes based on scroll position
      const sections = [
        howItWorksRef, 
        topServicesRef, 
        featuredVendorsRef, 
        categoriesRef, 
        appDownloadRef, 
        promotionalRef
      ];
      
      sections.forEach(ref => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.75 && rect.bottom > 0) {
            ref.current.classList.add('animate-in');
          }
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Trigger once on mount to check initial visible elements
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch featured services (top rated)
      const [featuredResponse, allServicesResponse] = await Promise.all([
        getFeaturedServices({ limit: 6 }),
        getServices({ limit: 20, sort: 'rating', order: 'desc' })
      ]);

      if (featuredResponse?.data) {
        setTopServices(featuredResponse.data);
      }

      if (allServicesResponse?.data) {
        // Extract unique vendors from services
        const uniqueVendors = new Map();
        allServicesResponse.data.forEach(service => {
          if (service.vendor && !uniqueVendors.has(service.vendor._id)) {
            uniqueVendors.set(service.vendor._id, {
              _id: service.vendor._id,
              name: service.vendor.name,
              avatar: service.vendor.avatar,
              rating: service.vendor.rating || { average: 4.5, count: 10 },
              verified: service.vendor.verified || true,
              category: service.category?.name || 'General Services'
            });
          }
        });
        setFeaturedVendors(Array.from(uniqueVendors.values()).slice(0, 6));

        // Extract unique categories
        const uniqueCategories = new Map();
        allServicesResponse.data.forEach(service => {
          if (service.category && !uniqueCategories.has(service.category._id)) {
            uniqueCategories.set(service.category._id, {
              _id: service.category._id,
              name: service.category.name,
              slug: service.category.slug,
              icon: getCategoryIcon(service.category.name),
              image: service.images?.[0] || getDefaultCategoryImage(service.category.name)
            });
          }
        });
        setCategories(Array.from(uniqueCategories.values()).slice(0, 8));
      }

    } catch (error) {
      console.error('Error fetching real data:', error);
      setError('Unable to load real data');
      // Fallback to mock data
      setTopServices(mockTopServices);
      setFeaturedVendors(mockFeaturedVendors);
      setCategories(mockCategories);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for icons and images
  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Plumbing': '🔧',
      'Electrical': '💡',
      'Catering': '🍽️',
      'Photography': '📸',
      'Gardening': '🌱',
      'Cleaning': '🧹',
      'Web Development': '💻',
      'Graphic Design': '🎨',
      'Home Services': '🏠',
      'Personal Services': '👤',
      'Business Services': '💼',
      'Automotive': '🚗',
      'Health & Wellness': '💪',
      'Technology': '🔧'
    };
    return icons[categoryName] || '⚡';
  };

  const getDefaultCategoryImage = (categoryName) => {
    const images = {
      'Plumbing': 'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=240&auto=format&fit=crop',
      'Electrical': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=240&auto=format&fit=crop',
      'Catering': 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=240&auto=format&fit=crop',
      'Photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=240&auto=format&fit=crop',
      'Gardening': 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?q=80&w=240&auto=format&fit=crop',
      'Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=240&auto=format&fit=crop'
    };
    return images[categoryName] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=240&auto=format&fit=crop';
  };

  // Mock data as fallback
  const mockTopServices = [
    {
      _id: 'mock-1',
      title: 'Professional Web Development',
      shortDescription: 'Modern, responsive websites',
      images: ['https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=240&auto=format&fit=crop'],
      pricing: { amount: 500 },
      stats: { rating: { average: 4.8, count: 243 } },
      vendor: { _id: 'v1', name: 'TechPro', avatar: null }
    }
  ];

  const mockFeaturedVendors = [
    {
      _id: 'vendor-1',
      name: "Mike's Services",
      avatar: null,
      rating: { average: 4.8, count: 318 },
      verified: true,
      category: 'Home Services'
    }
  ];

  const mockCategories = [
    { _id: 'cat-1', name: "Plumbing", slug: "plumbing", icon: "🔧", image: 'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=240&auto=format&fit=crop' }
  ];

  const promotionalBanners = [
    {
      id: 1,
      title: "Best deals",
      highlight: "Event Photography",
      description: "Professional photographers for your special occasions. Limited time offers!",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2089&auto=format&fit=crop",
      buttonText: "Book a Session",
      category: "photography"
    },
    {
      id: 2,
      title: "Celebrate parties with",
      highlight: "Catering",
      description: "Exquisite food and service for your events and gatherings. Start from $299.",
      image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2070&auto=format&fit=crop",
      buttonText: "Order Catering",
      category: "catering"
    },
    {
      id: 3,
      title: "Need tech help?",
      highlight: "IT Support",
      description: "Professional IT support and computer repair services. Book now and get 15% off!",
      image: "https://images.unsplash.com/photo-1558458878-36c4321e1e82?q=80&w=2070&auto=format&fit=crop",
      buttonText: "Get Support",
      category: "technology"
    }
  ];

  const handleFindServices = () => {
    // Always navigate to browse services page
    navigate('/services');
  };

  const handleBookService = (service) => {
    navigate(`/services/${service._id}/book`);
  };

  const handleContactVendor = (vendor) => {
    navigate(`/vendor/${vendor._id}/profile`);
  };

  const handleCategoryClick = async (category) => {
    try {
      // Check if category has services
      const response = await getServicesByCategory(category.slug, { limit: 1 });
      
      if (response?.data && response.data.length > 0) {
        // Navigate to services filtered by category
        navigate(`/services?category=${category.slug}`);
      } else {
        // Show message for empty categories
        alert(`Sorry, we currently don't have any services in the ${category.name} category. Please check back later!`);
      }
    } catch (error) {
      console.error('Error checking category services:', error);
      // Still navigate in case of API error
      navigate(`/services?category=${category.slug}`);
    }
  };

  const handlePromoBannerClick = (banner) => {
    navigate(`/services?category=${banner.category}`);
  };

  const scrollServices = (direction, ref) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const formatPrice = (service) => {
    const amount = service.pricing?.amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getRating = (service) => {
    return service.stats?.rating?.average || 4.5;
  };

  const getReviewCount = (service) => {
    return service.stats?.rating?.count || 0;
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className={`header ${scrollPosition > 50 ? 'header-scrolled' : ''}`}>
        <div className="logo">
          <svg className="logo-svg" width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="15" cy="15" r="15" fill="#F9B233"/>
            <path d="M8 12C8 10.8954 8.89543 10 10 10H20C21.1046 10 22 10.8954 22 12V14C22 15.1046 21.1046 16 20 16H10C8.89543 16 8 15.1046 8 14V12Z" fill="white"/>
            <path d="M10 18C10 17.4477 10.4477 17 11 17H19C19.5523 17 20 17.4477 20 18V20C20 20.5523 19.5523 21 19 21H11C10.4477 21 10 20.5523 10 20V18Z" fill="white"/>
          </svg>
          <span className="logo-text">migo</span>
        </div>

        <div className="search-food">
          <button className="search-food" onClick={() => navigate('/services')}>
            <span className="search-icon">🔍</span>
            <span>Search Services</span>
          </button>
        </div>

        <div className="header-right">
          <div className="location-bar">
            <span>Service Address:</span>
            <span className="location-text">
              <span className="location-icon">📍</span>
              Current Location Santa Clara, CA, USA
            </span>
          </div>
          
          <Link to={currentUser ? '/profile' : '/login'} className="login-button">
            <span className="login-icon">👤</span>
            {currentUser ? 'Profile' : 'Login'}
          </Link>
        </div>
      </header>

      {/* Hero Section - Simplified without delivery/pickup */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-content">
          <h1>In need of services?</h1>
          <p>Within a few clicks, find services that are accessible near you</p>
          
          <div className="search-box">
            <div className="address-input">
              <span className="address-icon">📍</span>
              <input 
                type="text" 
                placeholder="Enter Your Address (Optional)" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            
            <button className="find-services-button" onClick={handleFindServices}>
              <span className="search-icon">🔍</span> Find Services
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=500&auto=format&fit=crop" alt="Home Service Professional" />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works-section" ref={howItWorksRef}>
        <h2>How does it work</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-icon">
              <span>💡</span>
            </div>
            <h3>Find what you need</h3>
            <p>Browse through a wide range of services in your area</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>📝</span>
            </div>
            <h3>Book your service</h3>
            <p>Select a time and date that works best for you</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>⭐</span>
            </div>
            <h3>Enjoy and rate</h3>
            <p>Get your service done and share your experience</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <span>🔄</span>
            </div>
            <h3>Repeat</h3>
            <p>Book again or try out new services</p>
          </div>
        </div>
      </section>

      {/* Top Rated Services Section - Real Data */}
      <section className="top-rated-section">
        <div className="services-header">
          <h2>Top Rated Services</h2>
          <div className="scroll-controls">
            <button className="scroll-button" onClick={() => scrollServices('left', servicesRef)}>
              <span>←</span>
            </button>
            <button className="scroll-button" onClick={() => scrollServices('right', servicesRef)}>
              <span>→</span>
            </button>
          </div>
        </div>
        
        <div className="services-scroll-container">
          {loading ? (
            <div className="loading-message">Loading top services...</div>
          ) : (
            <div className="services-grid" ref={servicesRef}>
              {topServices.map(service => (
                <div key={service._id} className="top-service-card">
                  <div 
                    className="service-image" 
                    style={{ backgroundImage: `url(${service.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=400&auto=format&fit=crop'})` }}
                  ></div>
                  <div className="service-info">
                    <h3>{service.title}</h3>
                    <p className="service-description">{service.shortDescription}</p>
                    <div className="rating">
                      <span className="stars">{'★'.repeat(Math.floor(getRating(service)))}{'☆'.repeat(5-Math.floor(getRating(service)))}</span>
                      <span className="rating-number">{getRating(service)}</span>
                      <span className="reviews">({getReviewCount(service)})</span>
                    </div>
                    <div className="service-price">{formatPrice(service)}</div>
                    <button className="book-now" onClick={() => handleBookService(service)}>
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Vendors Section - Real Data */}
      <section className="featured-vendors-section" ref={featuredVendorsRef}>
        <div className="services-header">
          <h2>Featured Vendors</h2>
          <div className="scroll-controls">
            <button className="scroll-button" onClick={() => scrollServices('left', featuredVendorsRef)}>
              <span>←</span>
            </button>
            <button className="scroll-button" onClick={() => scrollServices('right', featuredVendorsRef)}>
              <span>→</span>
            </button>
          </div>
        </div>
        
        <div className="services-scroll-container">
          {loading ? (
            <div className="loading-message">Loading featured vendors...</div>
          ) : (
            <div className="vendors-grid" ref={featuredVendorsRef}>
              {featuredVendors.map(vendor => (
                <div key={vendor._id} className="vendor-card">
                  <div className="vendor-image" style={{ 
                    backgroundImage: vendor.avatar 
                      ? `url(${vendor.avatar})` 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}>
                    {!vendor.avatar && (
                      <div className="vendor-initial">{vendor.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="vendor-info">
                    <h3>{vendor.name}</h3>
                    <p className="vendor-category">{vendor.category}</p>
                    <div className="rating">
                      <span className="stars">{'★'.repeat(Math.floor(vendor.rating.average))}{'☆'.repeat(5-Math.floor(vendor.rating.average))}</span>
                      <span className="rating-number">{vendor.rating.average}</span>
                      <span className="reviews">({vendor.rating.count})</span>
                    </div>
                    <div className="vendor-tags">
                      {vendor.verified && <span className="verified-tag">✓ Verified</span>}
                    </div>
                    <button className="contact-now" onClick={() => handleContactVendor(vendor)}>
                      Contact Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search by Category Section - Real Data with Proper Navigation */}
      <section className="categories-section" ref={categoriesRef}>
        <h2>Search by Service Category</h2>
        <div className="categories-scroll-container">
          <button className="scroll-button left" onClick={() => scrollServices('left', categoriesRef)}>
            <span>←</span>
          </button>
          <div className="categories-grid" ref={categoriesRef}>
            {loading ? (
              <div className="loading-message">Loading categories...</div>
            ) : (
              categories.map((category) => (
                <div 
                  key={category._id} 
                  className="category-item"
                  onClick={() => handleCategoryClick(category)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="category-image" style={{ backgroundImage: `url(${category.image})` }}>
                    <div className="category-icon-overlay">{category.icon}</div>
                  </div>
                  <span>{category.name}</span>
                </div>
              ))
            )}
          </div>
          <button className="scroll-button right" onClick={() => scrollServices('right', categoriesRef)}>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* App Download Section */}
      <section className="app-download-section" ref={appDownloadRef}>
        <div className="app-content">
          <div className="app-description">
            <div className="chat-bubble">
              <h3>What do you need help with?</h3>
              <p>Tell Migo and get connected with the right service providers</p>
            </div>
            <h2>Mobile App Coming Soon</h2>
            <p>We're developing a feature-rich mobile experience to help you find and book services on the go. Stay tuned for our launch!</p>
            <div className="app-buttons">
              <div className="coming-soon-badge">In Development</div>
            </div>
          </div>
          <div className="app-mockup">
            <img src="https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?q=80&w=1926&auto=format&fit=crop" alt="Mobile App Preview" />
          </div>
        </div>
      </section>

      {/* Promotional Banners Section */}
      <section className="promotional-banners-section" ref={promotionalRef}>
        {promotionalBanners.map((banner) => (
          <div key={banner.id} className="promo-banner">
            <div className="promo-content">
              <span className="promo-title">{banner.title}</span>
              {banner.highlight && <h2 className="promo-highlight">{banner.highlight}</h2>}
              <p className="promo-description">{banner.description}</p>
              <button 
                className="promo-button" 
                onClick={() => handlePromoBannerClick(banner)}
              >
                {banner.buttonText}
              </button>
            </div>
            <div className="promo-image" style={{ backgroundImage: `url(${banner.image})` }}></div>
          </div>
        ))}
      </section>

      {/* Final CTA */}
      <section className="final-cta-section">
        <div className="cta-background"></div>
        <h2>Ready to find the perfect service provider?</h2>
        <button className="cta-button" onClick={() => navigate('/services')}>
          Get Started
        </button>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Team</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Contact</h3>
            <ul>
              <li><a href="#">Help & Support</a></li>
              <li><a href="#">Partner With Us</a></li>
              <li><a href="#">Ride With Us</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Legal</h3>
            <ul>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookies Policy</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Follow Us</h3>
            <div className="social-icons">
              <a href="#" className="social-icon">📱</a>
              <a href="#" className="social-icon">💻</a>
              <a href="#" className="social-icon">📷</a>
              <a href="#" className="social-icon">📺</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Migo Services. All rights reserved.</p>
          <div className="footer-language">
            <select>
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
            </select>
          </div>
        </div>
      </footer>

      {/* AI Chat Bot Button and Chat Window */}
      <div className={`chat-container ${chatOpen ? 'open' : ''}`}>
        {chatOpen ? (
          <div className="chat-window">
            <div className="chat-header">
              <h3>Ask Migo</h3>
              <button className="close-chat" onClick={toggleChat}>×</button>
            </div>
            <div className="chat-messages">
              <div className="message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content">Hi there! I'm Migo's AI assistant. How can I help you find services today?</div>
              </div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Type your question here..." />
              <button className="send-button">Send</button>
            </div>
          </div>
        ) : (
          <button className="chat-button" onClick={toggleChat}>
            <span className="chat-icon">🤖</span>
            <span className="chat-text">Ask Migo</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Home; 