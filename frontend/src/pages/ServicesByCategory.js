import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getServicesByCategory, getServices } from "../api/serviceApi";
import { getCategoryBySlug } from "../api/categoryApi";
import "../styles/ServicesByCategory.css";

const ServicesByCategory = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    subcategory: searchParams.get("subcategory") || "",
    sort: searchParams.get("sort") || "featured",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    rating: searchParams.get("rating") || "",
    page: parseInt(searchParams.get("page")) || 1,
  });

  useEffect(() => {
    if (slug) {
      fetchCategoryData();
      fetchServices();
    }
  }, [slug, filters]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const fetchCategoryData = async () => {
    try {
      const response = await getCategoryBySlug(slug);
      if (response.success) {
        setCategory(response.data);
      }
    } catch (err) {
      console.error("Error fetching category:", err);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const queryParams = {
        category: slug,
        page: filters.page,
        sort: filters.sort,
        limit: 12,
      };

      if (filters.subcategory) queryParams.subcategory = filters.subcategory;
      if (filters.priceMin) queryParams.priceMin = filters.priceMin;
      if (filters.priceMax) queryParams.priceMax = filters.priceMax;
      if (filters.rating) queryParams.rating = filters.rating;

      const response = await getServicesByCategory(slug, queryParams);

      if (response.success) {
        setServices(response.data.services || []);
        setPagination(response.pagination || {});
        if (response.data.category) {
          setCategory(response.data.category);
        }
      } else {
        setError("Failed to load services");
      }
    } catch (err) {
      setError("Error loading services");
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilters({
      subcategory: "",
      sort: "featured",
      priceMin: "",
      priceMax: "",
      rating: "",
      page: 1,
    });
  };

  const formatPrice = (service) => {
    if (service.pricing.type === "custom") {
      return "Custom Quote";
    }

    const amount = service.pricing.amount;
    const currency = service.pricing.currency || "USD";
    const symbol = currency === "USD" ? "$" : currency;

    switch (service.pricing.type) {
      case "hourly":
        return `${symbol}${amount}/hr`;
      case "fixed":
        return `${symbol}${amount}`;
      case "package":
        return `Starting at ${symbol}${amount}`;
      default:
        return `${symbol}${amount}`;
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="services-category">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-category">
      {/* Category Header */}
      {category && (
        <div
          className="category-header"
          style={{ "--category-color": category.color }}
        >
          <div className="header-content">
            <div className="breadcrumb">
              <Link to="/categories">Categories</Link>
              <span className="separator">•</span>
              <span className="current">{category.name}</span>
            </div>

            <div className="category-info">
              <div className="category-icon" style={{ color: category.color }}>
                {category.icon}
              </div>
              <div className="category-details">
                <h1>{category.name}</h1>
                <p>{category.description}</p>
                <div className="category-stats">
                  <span className="stat">
                    {pagination.total || 0} Services Available
                  </span>
                  {category.subcategories && (
                    <span className="stat">
                      {category.subcategories.length} Subcategories
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Content */}
      <div className="services-content">
        <div className="content-container">
          {/* Filters Sidebar */}
          <div className="filters-sidebar">
            <div className="filters-header">
              <h3>Filter Services</h3>
              {(filters.subcategory ||
                filters.priceMin ||
                filters.priceMax ||
                filters.rating) && (
                <button onClick={clearFilters} className="clear-filters">
                  Clear All
                </button>
              )}
            </div>

            {/* Subcategory Filter */}
            {category &&
              category.subcategories &&
              category.subcategories.length > 0 && (
                <div className="filter-group">
                  <h4>Subcategory</h4>
                  <div className="subcategory-filters">
                    <button
                      className={`subcategory-btn ${
                        !filters.subcategory ? "active" : ""
                      }`}
                      onClick={() => handleFilterChange("subcategory", "")}
                    >
                      All
                    </button>
                    {category.subcategories.map((sub, index) => (
                      <button
                        key={sub._id || index}
                        className={`subcategory-btn ${
                          filters.subcategory === sub.name ? "active" : ""
                        }`}
                        onClick={() =>
                          handleFilterChange("subcategory", sub.name)
                        }
                      >
                        {sub.icon} {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Price Range Filter */}
            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) =>
                    handleFilterChange("priceMin", e.target.value)
                  }
                  className="price-input"
                />
                <span className="price-separator">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) =>
                    handleFilterChange("priceMax", e.target.value)
                  }
                  className="price-input"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="filter-group">
              <h4>Minimum Rating</h4>
              <div className="rating-filters">
                {[4, 3.5, 3, 2.5].map((rating) => (
                  <button
                    key={rating}
                    className={`rating-btn ${
                      filters.rating === rating.toString() ? "active" : ""
                    }`}
                    onClick={() =>
                      handleFilterChange("rating", rating.toString())
                    }
                  >
                    {"⭐".repeat(Math.floor(rating))} {rating}+
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="services-main">
            {/* Sort and Results Header */}
            <div className="services-header">
              <div className="results-info">
                <h2>
                  {filters.subcategory
                    ? `${filters.subcategory} Services`
                    : "All Services"}
                  {pagination.total && (
                    <span className="results-count">
                      ({pagination.total} results)
                    </span>
                  )}
                </h2>
              </div>

              <div className="sort-controls">
                <label htmlFor="sort">Sort by:</label>
                <select
                  id="sort"
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="sort-select"
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Services Grid */}
            {error ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchServices} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : services.length === 0 ? (
              <div className="no-services">
                <div className="no-services-icon">🔍</div>
                <h3>No services found</h3>
                <p>Try adjusting your filters or browse other categories</p>
                <Link to="/categories" className="browse-categories-btn">
                  Browse All Categories
                </Link>
              </div>
            ) : (
              <div className="services-grid">
                {services.map((service) => (
                  <div key={service._id} className="service-card">
                    <Link
                      to={`/services/${service._id}`}
                      className="service-link"
                    >
                      {/* Service Image */}
                      <div className="service-image">
                        {service.primaryImage ? (
                          <img
                            src={service.primaryImage.url}
                            alt={service.primaryImage.alt || service.title}
                          />
                        ) : (
                          <div className="no-image">
                            <span>📷</span>
                          </div>
                        )}
                        {service.isFeatured && (
                          <div className="featured-badge">Featured</div>
                        )}
                      </div>

                      {/* Service Content */}
                      <div className="service-content">
                        <div className="service-meta">
                          <span className="subcategory">
                            {service.subcategory.name}
                          </span>
                          <div className="service-rating">
                            <span className="stars">
                              {"⭐".repeat(
                                Math.floor(service.displayRating || 0)
                              )}
                            </span>
                            <span className="rating-text">
                              {service.displayRating || "0.0"} (
                              {service.reviewCount || 0})
                            </span>
                          </div>
                        </div>

                        <h3 className="service-title">{service.title}</h3>
                        <p className="service-description">
                          {service.shortDescription}
                        </p>

                        {/* Vendor Info */}
                        <div className="vendor-info">
                          <div className="vendor-avatar">
                            {service.vendor.avatar ? (
                              <img
                                src={service.vendor.avatar}
                                alt={service.vendor.name}
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                {service.vendor.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="vendor-details">
                            <span className="vendor-name">
                              {service.vendor.name}
                            </span>
                            {service.vendor.address && (
                              <span className="vendor-location">
                                {service.vendor.address.city},{" "}
                                {service.vendor.address.state}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Service Features */}
                        {service.features && service.features.length > 0 && (
                          <div className="service-features">
                            {service.features
                              .slice(0, 3)
                              .map((feature, index) => (
                                <span key={index} className="feature-tag">
                                  ✓ {feature}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="service-pricing">
                          <span className="price">{formatPrice(service)}</span>
                          <span className="pricing-type">
                            {service.pricing.type}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="page-btn"
                >
                  ← Previous
                </button>

                <div className="page-numbers">
                  {Array.from(
                    { length: pagination.pages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`page-btn ${
                        page === filters.page ? "active" : ""
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= pagination.pages}
                  className="page-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesByCategory;
