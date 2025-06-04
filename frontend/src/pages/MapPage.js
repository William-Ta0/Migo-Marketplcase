import React, { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

// NOTE: Issue with google.maps.places.PlacesService
// As of March 1st, 2025, google.maps.places.PlacesService is not available to new customers. Please use google.maps.places.Place instead.
// At this time, google.maps.places.PlacesService is not scheduled to be discontinued, but google.maps.places.Place is recommended over google.maps.places.PlacesService.
// While google.maps.places.PlacesService will continue to receive bug fixes for any major regressions, existing bugs in google.maps.places.PlacesService will not be addressed.
// At least 12 months notice will be given before support is discontinued.
// Please see https://developers.google.com/maps/legacy for additional details and https://developers.google.com/maps/documentation/javascript/places-migration-overview for the migration guide.

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

function MapPage() {
  const [center, setCenter] = useState(defaultCenter); // Allow updating map center
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Store map instance
  const [selectedType, setSelectedType] = useState("caterer"); // Default type
  const [currentPage, setCurrentPage] = useState(1); // Track current page

  const resultsPerPage = 5; // Number of results per page

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
        fields: ["name", "geometry", "place_id", "vicinity"],
      };

      console.log("TextSearch request:", request); // Log the request object

      service.textSearch(request, (results, status) => {
        console.log("TextSearch status:", status); // Log the status
        console.log("TextSearch results:", results); // Log the results

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
        libraries={["places"]}
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
              onClick={() => setSelectedPlace(place)}
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
      <div style={{ marginBottom: "20px" }}>
        <h2>Search Results</h2>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {paginatedResults.map((place, index) => (
            <li
              key={place.place_id}
              style={{ cursor: "pointer", marginBottom: "10px" }}
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
    </div>
  );
}

export default MapPage;
