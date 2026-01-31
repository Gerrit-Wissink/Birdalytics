import { useEffect, useRef } from 'react'

const Map = () => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'
    document.head.appendChild(link)

    // Add custom styles for centered popup text
    const style = document.createElement('style')
    style.textContent = `
      .leaflet-popup-content-wrapper {
        text-align: center;
      }
      .leaflet-popup-content {
        margin: 8px 12px;
      }
    `
    document.head.appendChild(style)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
    script.onload = () => {
      const L = window.L

      const map = L.map(mapRef.current).setView([43.0847, -77.6715], 13)

      L.tileLayer('https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=mSTdm4DhBZ8zLJjrs2Kj', {
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
        maxZoom: 20,
      }).addTo(map)

      const marker = L.marker([43.0847, -77.6715])
        .addTo(map)
        .bindPopup('RIT', {
          closeButton: false
        })

      marker.on('mouseover', function() {
        this.openPopup();
      })

      marker.on('mouseout', function() {
        this.closePopup();
      })

      mapInstanceRef.current = map
    }
    document.body.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{width: '100%', maxHeight: 'auto'}}>
      <div ref={mapRef} style={{width: '100%', maxHeight: 'auto', borderRadius: '10px'}}/>
    </div>
  )
}

export default Map