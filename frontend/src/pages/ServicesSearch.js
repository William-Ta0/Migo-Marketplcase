import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getServices } from "../api/serviceApi";
import "../styles/ServicesSearch.css";

const ServicesSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "",
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    rating: searchParams.get("rating") || "",
    sort: searchParams.get("sort") || "featured",
    page: parseInt(searchParams.get("page")) || 1,
  });

  useEffect(() => {
    fetchServices();
  }, [filters]);

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

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const queryParams = {
        page: filters.page,
        limit: 12,
        sort: filters.sort,
      };

      // Add non-empty filters to query
      if (filters.location) queryParams.location = filters.location;
      if (filters.search) queryParams.search = filters.search;
      if (filters.category) queryParams.category = filters.category;
      if (filters.priceMin) queryParams.priceMin = filters.priceMin;
      if (filters.priceMax) queryParams.priceMax = filters.priceMax;
      if (filters.rating) queryParams.rating = filters.rating;

      const response = await getServices(queryParams);

      if (response.success) {
        setServices(response.data || []);
        setPagination(response.pagination || {});
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
      location: "",
      type: "",
      search: "",
      category: "",
      priceMin: "",
      priceMax: "",
      rating: "",
      sort: "featured",
      page: 1,
    });
  };

  const formatPrice = (service) => {
    if (service.pricing.type === "custom") {
      return "Get Quote";
    }

    const currency = service.pricing.currency || "USD";
    const symbol = currency === "USD" ? "$" : currency;
    const amount = service.pricing.amount;

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

  if (loading) {
    return (
      <div className="services-search">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching for services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="services-search">
      <div className="search-container">
        {/* Header */}
        <div className="search-header">
          <h1>Service Search Results</h1>
          {filters.location && (
            <p>
              Services near: <strong>{filters.location}</strong>
            </p>
          )}
          {pagination.total && (
            <p className="results-count">{pagination.total} services found</p>
          )}
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="filters-row">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Search services..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="location-input"
              />
            </div>

            <div className="filter-group">
              <select
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

          <div className="filters-row">
            <div className="filter-group">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                className="price-input"
              />
            </div>

            <div className="filter-group">
              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                className="price-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange("rating", e.target.value)}
                className="rating-select"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="search-results">
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
              <p>Try adjusting your search criteria or browse our categories</p>
              <Link to="/categories" className="browse-categories-btn">
                Browse All Categories
              </Link>
            </div>
          ) : (
            <>
              <div className="services-grid">
                {services.map((service) => (
                  <Link
                    key={service._id}
                    to={`/services/${service._id}`}
                    className="service-card"
                  >
                    <div className="service-image">
                      {service.primaryImage ? (
                        <img
                          src={service.primaryImage.url}
                          alt={service.title}
                        />
                      ) : (
                        <div className="no-image">📷</div>
                      )}
                      {service.isPromoted && (
                        <div className="featured-badge">Featured</div>
                      )}
                    </div>

                    <div className="service-content">
                      <div className="service-category">
                        <span
                          className="category-badge"
                          style={{ backgroundColor: service.category.color }}
                        >
                          {service.category.icon} {service.subcategory.name}
                        </span>
                      </div>

                      <h3>{service.title}</h3>
                      <p className="service-description">
                        {service.shortDescription}
                      </p>

                      <div className="service-vendor">
                        <div className="vendor-info">
                          {service.vendor.avatar && (
                            <img
                              src={service.vendor.avatar}
                              alt={service.vendor.name}
                              className="vendor-avatar"
                            />
                          )}
                          <span className="vendor-name">
                            {service.vendor.name}
                          </span>
                        </div>
                      </div>

                      <div className="service-footer">
                        <div className="service-rating">
                          <span className="stars">⭐</span>
                          <span>{service.displayRating || "0.0"}</span>
                          <span className="reviews">
                            ({service.reviewCount || 0})
                          </span>
                        </div>

                        <div className="service-price">
                          {formatPrice(service)}
                        </div>
                      </div>

                      <div className="service-location">
                        📍{" "}
                        {service.location.type === "remote"
                          ? "Remote"
                          : service.location.serviceArea?.cities
                              ?.slice(0, 2)
                              .join(", ") || "Multiple locations"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

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
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter((page) => {
                        const current = filters.page;
                        return (
                          page === 1 ||
                          page === pagination.pages ||
                          (page >= current - 2 && page <= current + 2)
                        );
                      })
                      .map((page) => (
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesSearch;
