import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import '../pages/cameras.css';
import apiClient from '../utils/apiClient';

// Fix Leaflet's default marker icons in webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function PinDropper({ onPin }) {
  useMapEvents({
    click(e) {
      onPin(e.latlng);
    },
  });
  return null;
}

export default function AddCameraModal({ setShowModal, selectedCamera = null }) {
  const [formData, setFormData] = useState({
    cameraName: selectedCamera ? selectedCamera.birdbox_name : '',
    location: selectedCamera ? selectedCamera.location : '',
    latitude: selectedCamera ? selectedCamera.birdbox_lat : '',
    longitude: selectedCamera ? selectedCamera.birdbox_long : '',
  });

  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState([39.0997, -76.8483]); // fallback: US center
  const [pin, setPin] = useState(null);

  useEffect(() => {
    if (showMap) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserLocation([coords.latitude, coords.longitude]),
        () => {} // silently use fallback on denial
      );
    }
  }, [showMap]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePinDrop = (latlng) => {
    setPin(latlng);
  };

  const handleConfirmPin = () => {
    if (pin) {
      setFormData(prev => ({
        ...prev,
        latitude: pin.lat.toFixed(6),
        longitude: pin.lng.toFixed(6),
      }));
      setShowMap(false);
      setPin(null);
    }
  };

  const handleAddCamera = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (
        !formData.cameraName?.trim() ||
        !formData.location?.trim() ||
        !formData.latitude?.trim() ||
        !formData.longitude?.trim()
      ) {
        setError('All fields are required');
        return;
      }

      const result = await apiClient.post('/boxes', formData); // added await (was missing!)

      if (result.status === 201) {
        setShowModal(false);
        setFormData({ cameraName: '', location: '', latitude: '', longitude: '' });
      } else {
        setError('Failed to add camera. Please try again.');
      }
    } catch (err) {
      console.error('Error adding camera:', err);
      setError('Failed to add camera. Please try again.');
    }
  };

  const handleUpdateCamera = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (
        !formData.cameraName?.trim() ||
        !formData.location?.trim() ||
        !formData.latitude?.trim() ||
        !formData.longitude?.trim()
      ) {
        setError('All fields are required');
        return;
      }

      const result = await apiClient.put(`/boxes/${selectedCamera.birdbox_id}`, formData);

      if (result.status === 200) {
        setShowModal(false);
        setFormData({ cameraName: '', location: '', latitude: '', longitude: '' });
      } else {
        setError('Failed to update camera. Please try again.');
      }
    } catch (err) {
      console.error('Error updating camera:', err);
      setError('Failed to update camera. Please try again.');
    }
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setFormData({ cameraName: '', location: '', latitude: '', longitude: '' });
  };

  return (
    <div className="modal-overlay" onClick={handleCancelModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Camera</h2>
          <button className="modal-close" onClick={handleCancelModal}>✕</button>
        </div>

        <form onSubmit={
          selectedCamera ? 
          handleUpdateCamera :
          handleAddCamera
        }>
          <div className="form-group">
            <label htmlFor="cameraName">Camera Name <span className="required">*</span></label>
            <input
              type="text"
              id="cameraName"
              name="cameraName"
              placeholder="New Camera 1..."
              value={formData.cameraName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Camera Location <span className="required">*</span></label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="MacKay Wildlife Reserve"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Camera Coordinates <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                name="latitude"
                placeholder="Latitude"
                value={formData.latitude}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="longitude"
                placeholder="Longitude"
                value={formData.longitude}
                onChange={handleInputChange}
              />
            </div>
            <button
                type="button"
                className='open'
                onClick={() => setShowMap(prev => !prev)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {showMap ? 'Hide Map' : '📍 Pick on Map'}
            </button>
          </div>

          {showMap && (
            <div style={{ marginBottom: '12px' }}>
              <MapContainer
                center={userLocation}
                zoom={13}
                style={{ height: '300px', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <PinDropper onPin={handlePinDrop} />
                {pin && <Marker position={pin} />}
              </MapContainer>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5em', marginTop: '.5em'}}>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  {pin
                    ? `📍 ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`
                    : 'Click the map to drop a pin'}
                </span>
                <button
                  type="button"
                  onClick={handleConfirmPin}
                  disabled={!pin}
                  className="add-btn"
                >
                  Confirm Pin
                </button>
              </div>
            </div>
          )}

          {error && <span style={{ color: 'red' }}>{error}</span>}

          <div className="modal-buttons">
            <button type="button" className="cancel-btn" onClick={handleCancelModal}>Cancel</button>
            <button type="submit" className="add-btn">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}