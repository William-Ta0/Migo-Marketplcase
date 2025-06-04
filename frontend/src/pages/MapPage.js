import React, { useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import Header from "../components/Header";

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
  south: 37.30, // Slightly south of Santa Clara
  east: -121.92, // Slightly east of Santa Clara
  west: -122.00, // Slightly west of Santa Clara
};

function MapPage() {
  const [center] = useState(defaultCenter);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const handleSearch = async () => {
    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    const request = {
      location: new window.google.maps.LatLng(
        defaultCenter.lat,
        defaultCenter.lng
      ),
      radius: "5000",
      type: ["business"],
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSearchResults(results);
      } else {
        alert("No businesses found. Please try again.");
      }
    });
  };

  return (
    <div>
      <h1>Map Page</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={handleSearch} style={{ padding: "10px" }}>
          Search Businesses
        </button>
      </div>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
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
