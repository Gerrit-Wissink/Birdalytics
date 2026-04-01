import React from 'react'
import { useEffect, useRef } from 'react'

const Map = ({ boxesData }) => {
  const birdboxData = boxesData
  console.log("Loaded birdbox data:", birdboxData)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  // Helper function: iterates over birdbox data and adds a marker for each box
  const createBirdboxMarkers = (L, map) => {
    birdboxData.forEach((box) => {
      const marker = L.marker([box.birdbox_lat, box.birdbox_long])
        .addTo(map)
        .bindPopup(box.birdbox_name, { closeButton: false })

      marker.on('mouseover', function () { this.openPopup() })
      marker.on('mouseout', function () { this.closePopup() })
      marker.on('click', function () { window.location.href = `/#/camInfo?selected=${box.birdbox_id}` })
    })
  }

  useEffect(() => {
    if (mapInstanceRef.current) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
    document.head.appendChild(link)

    const style = document.createElement('style')
    style.textContent = `
      .leaflet-popup-content-wrapper { text-align: center; }
      .leaflet-popup-content { margin: 8px 12px; }
    `
    document.head.appendChild(style)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
    script.onload = () => {
      const L = window.L

      // Center the map roughly over all birdbox locations
      const map = L.map(mapRef.current).setView([43.15, -77.5], 10)

      L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=mSTdm4DhBZ8zLJjrs2Kj', {
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        maxZoom: 20,
      }).addTo(map)

      // Add all birdbox markers
      createBirdboxMarkers(L, map)

      mapInstanceRef.current = map
    }
    document.body.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [boxesData]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
    </div>
  )
}

export default Map