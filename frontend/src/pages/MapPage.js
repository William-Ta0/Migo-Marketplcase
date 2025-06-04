import React, { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  InfoWindow,
  Marker, // Deprecated, use google.maps.marker.AdvancedMarkerElement instead
  // AdvancedMarkerElement, // TODO: Move to AdvancedMarkerElement in future updates
} from "@react-google-maps/api";
import { serviceTypes } from "../constants/serviceTypes";

// NOTE: Google Maps API isn't providing phone numbers in search results currently
// TODO: Add a feature to fetch phone numbers using Place Details API if needed

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 37.3541,
  lng: -121.9552,
};

const santaClaraBounds = {
  north: 37.41, // Slightly north of Santa Clara
  south: 37.3, // Slightly south of Santa Clara
  east: -121.92, // Slightly east of Santa Clara
  west: -122.0, // Slightly west of Santa Clara
};

const libraries = ["places"];

export const handleSearch = async (mapInstance, selectedType) => {
  try {
    if (!mapInstance) {
      throw new Error(
        "Map instance is not available. Please ensure the map is loaded correctly."
      );
    }

    if (
      !window.google ||
      !window.google.maps ||
      !window.google.maps.places ||
      !window.google.maps.places.Place
    ) {
      throw new Error(
        "Google Maps Places API (Place class) is not loaded correctly."
      );
    }

    const request = {
      textQuery: `${selectedType} near Santa Clara`,
      fields: [
        "displayName", // Changed from "name"
        "location", // Changed from "geometry", provides LatLngLiteral
        "id", // Changed from "place_id"
        "formattedAddress", // Changed from "formatted_address"
        "nationalPhoneNumber", // Changed from "formatted_phone_number"
        "rating",
        "userRatingCount", // Changed from "user_ratings_total"
        "types",
      ],
      // maxResultCount: 20 // Optional: specify max results
    };

    // Use the static Place.searchByText method which returns a Promise
    // The response object is { places: Place[] }
    const { places } = await window.google.maps.places.Place.searchByText(
      request
    );

    if (places) {
      return places; // Resolve with the array of places
    } else {
      // This case might not be hit if API errors throw, but good for safety
      throw new Error(
        "searchByText returned no places or an unexpected response."
      );
    }
  } catch (error) {
    console.error("Error in handleSearch:", error);
    const errorMessage =
      error.message ||
      "An error occurred while searching for businesses. Please refresh the page or try again later.";
    alert(`Search failed: ${errorMessage}`);
    throw error; // Re-throw to be caught by handleSearchClick or other callers
  }
};

function MapPage() {
  const [center, setCenter] = useState(defaultCenter);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedType, setSelectedType] = useState("caterer");
  const [currentPage, setCurrentPage] = useState(1);

  const resultsPerPage = 10;

  const getMarkerColor = (businessType) => {
    const colors = {
      caterer: "#FF6B6B",
      baker: "#4ECDC4",
      painter: "#45B7D1",
      photographer: "#96CEB4",
      dj: "#FFEAA7",
      mechanic: "#DDA0DD",
      electrician: "#98D8C8",
    };
    return colors[businessType] || "#FF6B6B";
  };

  const handleSearchClick = async () => {
    try {
      // Ensure mapInstance is available before searching
      if (!mapInstance) {
        alert("Map is not loaded yet. Please wait a moment and try again.");
        return;
      }
      const results = await handleSearch(mapInstance, selectedType);
      setSearchResults(results || []); // Ensure searchResults is always an array
      setCurrentPage(1);
    } catch (error) {
      // Error is already logged and alerted in handleSearch
      // console.error("An error occurred while searching for businesses:", error);
      // alert("An unexpected error occurred. Please try again later."); // Redundant if handleSearch alerts
    }
  };

  const handleResultClick = (place) => {
    if (place.location) {
      setCenter(place.location); // Use place.location
    }
    setSelectedPlace(place);
  };

  const totalPages = Math.ceil(searchResults.length / resultsPerPage);
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  return (
    <div>
      <h1>Map Page</h1>
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={13}
          options={{
            restriction: {
              latLngBounds: santaClaraBounds,
              strictBounds: true,
            },
          }}
          onLoad={(map) => setMapInstance(map)}
        >
          {searchResults.map(
            (place) =>
              place.location && ( // Ensure place.location exists
                <Marker
                  key={place.id} // Changed from place.place_id
                  position={place.location} // Changed from place.geometry.location
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: getMarkerColor(selectedType),
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 3,
                    scale: 12,
                  }}
                  title={place.displayName} // Changed from place.name
                  onClick={() => {
                    setSelectedPlace(place);
                    if (place.location) {
                      setCenter(place.location); // Changed from place.geometry.location
                    }
                  }}
                />
              )
          )}

          {selectedPlace &&
            selectedPlace.location && ( // Ensure selectedPlace.location exists
              <InfoWindow
                position={selectedPlace.location} // Changed from selectedPlace.geometry.location
                onCloseClick={() => setSelectedPlace(null)}
              >
                <div>
                  <h2>{selectedPlace.displayName}</h2>{" "}
                  {/* Changed from selectedPlace.name */}
                  <p>
                    {selectedPlace.shortFormattedAddress ||
                      selectedPlace.formattedAddress ||
                      "Address not available"}
                  </p>{" "}
                  {/* Changed from selectedPlace.vicinity */}
                </div>
              </InfoWindow>
            )}
        </GoogleMap>
      </LoadScript>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="serviceType">Select Service Type:</label>
        <select
          id="serviceType"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          {serviceTypes.map((type, index) => (
            <option key={index} value={type.toLowerCase()}>
              {type}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearchClick}
          style={{ marginLeft: "10px", padding: "10px" }}
        >
          Search Businesses
        </button>
      </div>
      <div style={{ display: "flex", marginTop: "20px" }}>
        <div style={{ flex: 1, marginRight: "20px" }}>
          <h2>Search Results</h2>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {paginatedResults.map((place, index) => (
              <li
                key={place.id} // Changed from place.place_id
                style={{
                  cursor: "pointer",
                  marginBottom: "10px",
                  backgroundColor:
                    selectedPlace?.id === place.id // Changed from selectedPlace?.place_id
                      ? "#f0f8ff"
                      : "transparent",
                  padding: "10px",
                  border: "1px solid #ddd",
                }}
                onClick={() => handleResultClick(place)}
              >
                <strong>
                  {(currentPage - 1) * resultsPerPage + index + 1}.{" "}
                  {place.displayName} {/* Changed from place.name */}
                </strong>
                <p>
                  {place.shortFormattedAddress ||
                    place.formattedAddress ||
                    "Address not available"}
                </p>{" "}
                {/* Changed from place.vicinity */}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: "10px" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  marginRight: "5px",
                  padding: "5px",
                  backgroundColor: currentPage === i + 1 ? "#007BFF" : "#FFF",
                  color: currentPage === i + 1 ? "#FFF" : "#000",
                  border: "1px solid #007BFF",
                  cursor: "pointer",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        {selectedPlace && (
          <div
            style={{
              flex: 1,
              border: "1px solid #ddd",
              padding: "10px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h2>Details</h2>
            <p>
              <strong>Name:</strong>{" "}
              {selectedPlace.displayName || "Name not available"}{" "}
              {/* Changed from selectedPlace.name */}
            </p>
            <p>
              <strong>Address:</strong>{" "}
              {selectedPlace.formattedAddress || "Address not available"}{" "}
              {/* Changed from selectedPlace.formatted_address */}
            </p>
            <p>
              <strong>Phone Number:</strong>{" "}
              {selectedPlace.nationalPhoneNumber || // Changed from selectedPlace.formatted_phone_number
                "Phone number not available"}
            </p>
            <p>
              <strong>Rating:</strong>{" "}
              {selectedPlace.rating || "Rating not available"}
            </p>
            <p>
              <strong>Amount of Ratings:</strong>{" "}
              {selectedPlace.userRatingCount || "Ratings count not available"}{" "}
              {/* Changed from selectedPlace.user_ratings_total */}
            </p>
            <p>
              <strong>Business Type:</strong>{" "}
              {selectedPlace.types
                ?.map((type) => type.replace(/_/g, " "))
                .join(", ") || "Types not available"}
            </p>
            <p>
              <strong>Place ID:</strong> {selectedPlace.id}{" "}
              {/* Changed from selectedPlace.place_id */}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapPage;
