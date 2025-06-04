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
  const [center] = useState(defaultCenter);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapInstance, setMapInstance] = useState(null); // Store map instance

  const handleSearch = async () => {
    try {
      if (!mapInstance) {
        console.error("Map instance is not available.");
        alert("Map is not loaded yet. Please try again later.");
        return;
      }

      const service = new window.google.maps.places.PlacesService(mapInstance);

      const request = {
        query: "businesses near Santa Clara", // Updated to use a valid query string
        fields: ["name", "geometry", "place_id", "vicinity"],
      };

      console.log("TextSearch request:", request); // Log the request object

      service.textSearch(request, (results, status) => {
        console.log("TextSearch status:", status); // Log the status
        console.log("TextSearch results:", results); // Log the results

        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSearchResults(results);
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

  return (
    <div>
      <h1>Map Page</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleSearch} style={{ padding: "10px" }}>
          Search Businesses
        </button>
      </div>
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
    </div>
  );
}

export default MapPage;
