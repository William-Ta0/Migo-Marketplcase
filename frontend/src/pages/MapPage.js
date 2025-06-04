import React, { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  InfoWindow,
  Marker, // Deprecated, use google.maps.marker.AdvancedMarkerElement instead
  // AdvancedMarkerElement, // TODO: Move to AdvancedMarkerElement in future updates
} from "@react-google-maps/api";

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

function MapPage() {
  const [center, setCenter] = useState(defaultCenter); // Allow updating map center
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Store map instance
  const [selectedType, setSelectedType] = useState("caterer"); // Default type
  const [currentPage, setCurrentPage] = useState(1); // Track current page

  const resultsPerPage = 10; // Number of results per page

  // Add a function to get marker colors based on business type
  const getMarkerColor = (businessType) => {
    const colors = {
      caterer: "#FF6B6B", // Red
      baker: "#4ECDC4", // Teal
      painter: "#45B7D1", // Blue
      photographer: "#96CEB4", // Green
      dj: "#FFEAA7", // Yellow
      mechanic: "#DDA0DD", // Purple
      electrician: "#98D8C8", // Mint
    };
    return colors[businessType] || "#FF6B6B"; // Default to red
  };

  const handleSearch = async () => {
    try {
      if (!mapInstance) {
        console.error("Map instance is not available.");
        alert("Map is not loaded yet. Please try again later.");
        return;
      }

      const service = new window.google.maps.places.PlacesService(mapInstance);

      const request = {
        query: `${selectedType} near Santa Clara`, // Use selected type in query
        fields: [
          "name",
          "geometry",
          "place_id",
          "vicinity",
          "formatted_address",
          "rating",
          "user_ratings_total",
          "types",
        ],
      };

      console.log("TextSearch request:", request); // Log the request object

      service.textSearch(request, (results, status) => {
        console.log("TextSearch status:", status); // Log the status
        console.log("TextSearch results:", results); // Log the results
        console.log("TextSearch results (detailed):", results); // Log detailed results to inspect fields

        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSearchResults(results);
          setCurrentPage(1); // Reset to the first page
        } else {
          console.error("TextSearch failed with status:", status);
          alert("No businesses found. Please try again.");
        }
      });
    } catch (error) {
      console.error("An error occurred while searching for businesses:", error);
      alert("An unexpected error occurred. Please try again later.");
    }
  };

  const handleResultClick = (place) => {
    setCenter(place.geometry.location); // Update map center to the clicked place
    setSelectedPlace(place); // Highlight the selected place
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
        libraries={libraries} // Use the static libraries constant
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
          onLoad={(map) => setMapInstance(map)} // Capture map instance
        >
          {searchResults.map((place) => (
            <Marker
              key={place.place_id}
              position={place.geometry.location}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: getMarkerColor(selectedType),
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 3,
                scale: 12,
              }}
              title={place.name} // Tooltip with business name
              onClick={() => {
                setSelectedPlace(place);
                setCenter(place.geometry.location); // Adjust map center dynamically
              }}
            />
          ))}

          {selectedPlace && (
            <InfoWindow
              position={selectedPlace.geometry.location}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div>
                <h2>{selectedPlace.name}</h2>
                <p>{selectedPlace.vicinity}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="business-type">Select Business Type:</label>
        <select
          id="business-type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="caterer">Caterer</option>
          <option value="baker">Baker</option>
          <option value="painter">Painter</option>
          <option value="photographer">Photographer</option>
          <option value="dj">DJ</option>
          <option value="mechanic">Mechanic</option>
          <option value="electrician">Electrician</option>
        </select>
        <button
          onClick={handleSearch}
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
                key={place.place_id}
                style={{
                  cursor: "pointer",
                  marginBottom: "10px",
                  backgroundColor:
                    selectedPlace?.place_id === place.place_id
                      ? "#f0f8ff"
                      : "transparent",
                  padding: "10px",
                  border: "1px solid #ddd",
                }}
                onClick={() => handleResultClick(place)}
              >
                <strong>
                  {(currentPage - 1) * resultsPerPage + index + 1}. {place.name}
                </strong>
                <p>{place.vicinity}</p>
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
              <strong>Name:</strong> {selectedPlace.name}
            </p>
            <p>
              <strong>Address:</strong>{" "}
              {selectedPlace.formatted_address || "Address not available"}
            </p>
            <p>
              <strong>Phone Number:</strong>{" "}
              {selectedPlace.formatted_phone_number ||
                "Phone number not available"}
            </p>
            <p>
              <strong>Rating:</strong>{" "}
              {selectedPlace.rating || "Rating not available"}
            </p>
            <p>
              <strong>Amount of Ratings:</strong>{" "}
              {selectedPlace.user_ratings_total || "Rating not available"}
            </p>
            <p>
              <strong>Business Type:</strong>{" "}
              {selectedPlace.types
                ?.map((type) => type.replace(/_/g, " "))
                .join(", ") || "Types not available"}
            </p>
            <p>
              <strong>Place ID:</strong> {selectedPlace.place_id}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapPage;
