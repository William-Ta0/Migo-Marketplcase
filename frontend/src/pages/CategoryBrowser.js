import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories, searchCategories } from '../api/categoryApi';
import '../styles/CategoryBrowser.css';

const CategoryBrowser = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories({ active: true });
      if (response.success) {
        setCategories(response.data);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      setError('Error loading categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const response = await searchCategories(searchQuery.trim());
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (err) {
      console.error('Error searching categories:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryClick = (categorySlug) => {
    navigate(`/services/category/${categorySlug}`);
  };

  const handleSubcategoryClick = (categorySlug, subcategoryName) => {
    navigate(`/services/category/${categorySlug}?subcategory=${encodeURIComponent(subcategoryName)}`);
  };

  if (loading) {
    return (
      <div className="category-browser">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="category-browser">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchCategories} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-browser">
      {/* Header Section */}
      <div className="browser-header">
        <div className="header-content">
          <h1>Browse Services</h1>
          <p>Discover the perfect service for your needs from our wide range of categories</p>
          
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search categories and services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="clear-search"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="search-results">
                {isSearching ? (
                  <div className="search-loading">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="search-results-list">
                    {searchResults.map((result) => (
                      <div 
                        key={`${result.type}-${result.id}`}
                        className={`search-result-item ${result.type}`}
                        onClick={() => {
                          if (result.type === 'category') {
                            handleCategoryClick(result.slug);
                          } else {
                            handleSubcategoryClick(result.parentCategory.slug, result.name);
                          }
                        }}
                      >
                        <div className="result-icon" style={{ color: result.color || result.parentCategory?.color }}>
                          {result.icon || result.parentCategory?.icon}
                        </div>
                        <div className="result-content">
                          <div className="result-name">{result.name}</div>
                          <div className="result-description">
                            {result.type === 'subcategory' && (
                              <span className="parent-category">in {result.parentCategory.name} • </span>
                            )}
                            {result.description}
                          </div>
                        </div>
                        <div className="result-type">{result.type}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-search-results">
                    No categories or services found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="categories-section">
        <div className="section-header">
          <h2>All Categories</h2>
          <p>Choose from {categories.length} service categories</p>
        </div>
        
        <div className="categories-grid">
          {categories.map((category) => (
            <div 
              key={category._id}
              className="category-card"
              onClick={() => handleCategoryClick(category.slug)}
              style={{ '--category-color': category.color }}
            >
              <div className="category-header">
                <div className="category-icon" style={{ color: category.color }}>
                  {category.icon}
                </div>
                <div className="category-info">
                  <h3 className="category-name">{category.name}</h3>
                  <p className="category-description">{category.description}</p>
                </div>
              </div>
              
              <div className="category-stats">
                <div className="stat-item">
                  <span className="stat-value">{category.subcategories?.length || 0}</span>
                  <span className="stat-label">Subcategories</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{category.metadata?.totalServices || 0}</span>
                  <span className="stat-label">Services</span>
                </div>
              </div>

              {/* Subcategories Preview */}
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="subcategories-preview">
                  <div className="subcategories-list">
                    {category.subcategories.slice(0, 6).map((subcategory, index) => (
                      <span 
                        key={subcategory._id || index}
                        className="subcategory-tag"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubcategoryClick(category.slug, subcategory.name);
                        }}
                      >
                        {subcategory.icon} {subcategory.name}
                      </span>
                    ))}
                    {category.subcategories.length > 6 && (
                      <span className="more-subcategories">
                        +{category.subcategories.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="category-action">
                <span className="view-services-btn">
                  View Services <span className="arrow">→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Can't find what you're looking for?</h2>
          <p>Browse all services or get in touch with us for custom requirements</p>
          <div className="cta-buttons">
            <Link to="/services" className="btn btn-primary">
              Browse All Services
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryBrowser; 