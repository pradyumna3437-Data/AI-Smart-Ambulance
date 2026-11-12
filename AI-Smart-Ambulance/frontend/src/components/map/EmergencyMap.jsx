import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { INITIAL_CITY_CENTER } from "../../services/mockData";
import { useEmergency } from "../../context/EmergencyContext";
import { Layers, MapPin, Crosshair } from "lucide-react";

// Recenter component to dynamically fly/pan when active incident or location changes
function MapRecenter({ center, zoom = 15 }) {
  const map = useMap();
  const lastCenterRef = React.useRef(null);

  useEffect(() => {
    if (
      Array.isArray(center) &&
      center.length >= 2 &&
      typeof center[0] === "number" &&
      typeof center[1] === "number" &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      const lat = center[0];
      const lng = center[1];
      const prev = lastCenterRef.current;
      if (!prev || Math.abs(prev[0] - lat) > 0.0001 || Math.abs(prev[1] - lng) > 0.0001) {
        lastCenterRef.current = [lat, lng];
        try {
          const dist = prev ? Math.hypot(prev[0] - lat, prev[1] - lng) : 999;
          if (dist > 0.03) {
            map.flyTo([lat, lng], 15, { animate: true, duration: 1.2 });
          } else {
            map.panTo([lat, lng], { animate: true, duration: 0.5 });
          }
        } catch (_) {}
      }
    }
  }, [center, zoom, map]);
  return null;
}

// Click-anywhere handler to auto-patch/set emergency pickup location
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect && e.latlng) {
        const lat = parseFloat(e.latlng.lat.toFixed(4));
        const lng = parseFloat(e.latlng.lng.toFixed(4));
        if (!isNaN(lat) && !isNaN(lng)) {
          onLocationSelect(lat, lng);
        }
      }
    },
  });
  return null;
}

// Auto-fit all active emergency assets (ambulances, hospitals, patient) into viewport
function MapFleetFitter({ trigger }) {
  const map = useMap();
  const { ambulances, hospitals, emergencies, userLocation } = useEmergency();

  useEffect(() => {
    if (trigger > 0) {
      const points = [];
      (ambulances || []).forEach((a) => {
        const lat = parseFloat(a?.latitude);
        const lng = parseFloat(a?.longitude);
        if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
      });
      (hospitals || []).forEach((h) => {
        const lat = parseFloat(h?.latitude);
        const lng = parseFloat(h?.longitude);
        if (!isNaN(lat) && !isNaN(lng)) points.push([lat, lng]);
      });
      if (userLocation && !isNaN(userLocation.lat) && !isNaN(userLocation.lng)) {
        points.push([userLocation.lat, userLocation.lng]);
      }
      if (points.length > 0) {
        try {
          map.fitBounds(points, { padding: [50, 50], maxZoom: 15 });
        } catch (_) {}
      }
    }
  }, [trigger, map, ambulances, hospitals, emergencies, userLocation]);

  return null;
}

function MapRouteFitter({ enabled, route }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !Array.isArray(route) || route.length < 2) return;

    const points = route.filter(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        typeof point[0] === "number" &&
        typeof point[1] === "number" &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    );
    if (points.length < 2) return;

    map.fitBounds(points, { padding: [55, 55], maxZoom: 15 });
  }, [enabled, route, map]);

  return null;
}

function MapFollowLocation({ enabled, position }) {
  const map = useMap();

  useEffect(() => {
    if (
      enabled &&
      Array.isArray(position) &&
      position.length >= 2 &&
      Number.isFinite(position[0]) &&
      Number.isFinite(position[1])
    ) {
      map.panTo(position, { animate: true, duration: 0.6 });
    }
  }, [enabled, position, map]);

  return null;
}

// Custom DivIcons for crisp SVG vector rendering
const createAmbulanceIcon = (status, vehicleNumber) => {
  const statusClass =
    status === "AVAILABLE"
      ? "available"
      : status === "ASSIGNED"
      ? "assigned"
      : status === "OFFLINE"
      ? "offline"
      : "en-route";

  const shortNumber = vehicleNumber
    ? vehicleNumber.replace(/^OD-\d+-AMB-|^AMB-0*/i, "#")
    : "AMB";

  const html = `
    <div class="custom-pin-ambulance ${statusClass}" title="Ambulance ${vehicleNumber} (${status})">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v9c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
        <path d="M8 8v4"/>
        <path d="M6 10h4"/>
      </svg>
      <span class="amb-pin-badge">${shortNumber}</span>
    </div>
  `;

  return L.divIcon({
    className: "custom-div-icon",
    html,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
};

const createEmergencyIcon = (severity) => {
  const isCritical = severity === "CRITICAL";
  const html = `
    <div class="custom-pin-emergency ${isCritical ? "critical" : ""}">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "custom-div-icon",
    html,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
};

const createPatientPickupIcon = () => {
  const html = `
    <div class="custom-pin-patient-pickup">
      <div class="patient-pickup-pulse"></div>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "custom-div-icon",
    html,
    iconSize: [40, 40],
    iconAnchor: [20, 38],
    popupAnchor: [0, -38],
  });
};

const createHospitalIcon = (availableBeds) => {
  const html = `
    <div class="custom-pin-hospital">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6v12"/>
        <path d="M6 12h12"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: "custom-div-icon",
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const createLiveUserIcon = () => {
  const html = `
    <div class="custom-pin-user-live" title="Your Current Location">
      <div class="user-live-radar"></div>
      <div class="user-live-center"></div>
    </div>
  `;
  return L.divIcon({
    className: "custom-div-icon",
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

function InvalidateSizeEffect() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function EmergencyMap({
  focusCenter,
  customHeight = "100%",
  showRoute = true,
  fitRoute = false,
  fitRoutePoints = null,
  routeOverride = null,
  followLocation = false,
  trackedAmbulanceId = null,
  trackedAmbulanceLocation = null,
  onEmergencyClick,
  onLocationSelect,
  patientLocation,
}) {
  const {
    emergencies,
    ambulances,
    hospitals,
    activeRoute,
    userLocation,
    fetchCurrentLocation,
    isDetectingLocation,
    locationPermissionDenied,
  } = useEmergency();
  const [mapTheme, setMapTheme] = useState("dark"); // 'dark' | 'street'
  const [fitFleetTrigger, setFitFleetTrigger] = useState(0);
  const routeToRender = routeOverride === null ? activeRoute : routeOverride;

  const isValidCoord = (n) => typeof n === "number" && !isNaN(n);
  const isValidCenter = (c) =>
    Array.isArray(c) && c.length >= 2 && isValidCoord(c[0]) && isValidCoord(c[1]);

  // Smart center: explicit focusCenter takes priority, then user GPS location, then city default
  const gpsFallback =
    userLocation && isValidCoord(userLocation.lat) && isValidCoord(userLocation.lng)
      ? [userLocation.lat, userLocation.lng]
      : null;

  const defaultCenter = isValidCenter(focusCenter)
    ? focusCenter
    : gpsFallback || [INITIAL_CITY_CENTER.lat, INITIAL_CITY_CENTER.lng];

  // Smart recenter: explicit prop > GPS location > initial city
  const recenterTarget = isValidCenter(focusCenter)
    ? focusCenter
    : gpsFallback;

  return (
    <div className={`map-wrapper map-theme-${mapTheme}`} style={{ height: customHeight, position: "relative" }}>
      {/* GPS Permission Denied Warning Banner */}
      {locationPermissionDenied && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1200,
            background: "rgba(245, 158, 11, 0.95)",
            backdropFilter: "blur(8px)",
            color: "#0c0a00",
            borderRadius: "10px",
            padding: "6px 14px",
            fontSize: "0.74rem",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          ⚠️ GPS blocked — using network location. Allow browser location for exact position.
        </div>
      )}
      {/* Floating Map Controls */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        {onLocationSelect && (
          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.74rem",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
            }}
          >
            <MapPin size={13} color="#ef4444" />
            <span>Click map to set pickup</span>
          </div>
        )}

        <button
          type="button"
          onClick={async () => {
            const loc = await fetchCurrentLocation(true);
            if (loc && loc.lat && loc.lng && onLocationSelect) {
              onLocationSelect(loc.lat, loc.lng);
            }
          }}
          disabled={isDetectingLocation}
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(6, 182, 212, 0.5)",
            color: "#38bdf8",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "0.75rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
          title="Detect and fly to your exact live GPS location"
        >
          <Crosshair size={13} color="#06b6d4" className={isDetectingLocation ? "spin-anim" : ""} />
          <span>{isDetectingLocation ? "Acquiring..." : "🎯 My GPS"}</span>
        </button>

        <button
          type="button"
          onClick={() => setFitFleetTrigger((c) => c + 1)}
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#6ee7b7",
            borderRadius: "20px",
            padding: "5px 10px",
            fontSize: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
          title="Fit view to show all ambulances and hospitals"
        >
          <span>🚑 View All Units</span>
        </button>

        <button
          type="button"
          onClick={() => setMapTheme((t) => (t === "dark" ? "street" : "dark"))}
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#f8fafc",
            borderRadius: "20px",
            padding: "5px 10px",
            fontSize: "0.75rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
          title="Toggle between Tactical Dark and Natural Street view"
        >
          <Layers size={13} color="#38bdf8" />
          <span>{mapTheme === "dark" ? "🌙 Tactical Dark" : "🗺️ Street View"}</span>
        </button>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={INITIAL_CITY_CENTER.zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* OpenStreetMap Standard Tiles: 100% FREE, NO API KEY REQUIRED, NO WATERMARK */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <InvalidateSizeEffect />
        <MapRecenter center={recenterTarget} />
        <MapRouteFitter enabled={fitRoute} route={fitRoutePoints || activeRoute} />
        <MapFollowLocation enabled={followLocation} position={trackedAmbulanceLocation} />
        <MapClickHandler onLocationSelect={onLocationSelect} />

        {/* Dedicated Live User Current Location Radar Pin */}
        {userLocation &&
          isValidCoord(userLocation.lat) &&
          isValidCoord(userLocation.lng) &&
          (!patientLocation ||
            Math.abs(userLocation.lat - patientLocation.lat) > 0.0005 ||
            Math.abs(userLocation.lng - patientLocation.lng) > 0.0005) && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={createLiveUserIcon()}
              zIndexOffset={900}
            >
              <Popup>
                <div style={{ padding: "0.25rem" }}>
                  <strong style={{ color: "#06b6d4", fontSize: "0.95rem" }}>
                    📍 Your Live Current Location
                  </strong>
                  <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "0.8rem" }}>
                    {userLocation.address || "Live Location"}
                  </p>
                  <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: "600", marginTop: "3px" }}>
                    {userLocation.isGpsDetected ? "● High Precision GPS Active" : "● Network Geolocation"}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

        {/* Dedicated Patient / Caller Selected Location Pin */}
        {patientLocation &&
          isValidCoord(patientLocation.lat) &&
          isValidCoord(patientLocation.lng) && (
            <Marker
              position={[patientLocation.lat, patientLocation.lng]}
              icon={createPatientPickupIcon()}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  if (onLocationSelect && position) {
                    onLocationSelect(
                      parseFloat(position.lat.toFixed(4)),
                      parseFloat(position.lng.toFixed(4))
                    );
                  }
                },
              }}
            >
              <Popup>
                <div style={{ padding: "0.2rem" }}>
                  <strong style={{ color: "#ef4444", fontSize: "0.95rem" }}>
                    📍 Your Selected Pickup Location
                  </strong>
                  <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "0.8rem" }}>
                    {patientLocation.address || "Patient Location Pinpoint"}
                  </p>
                  <p style={{ margin: "2px 0", color: "#64748b", fontSize: "0.7rem", fontStyle: "italic" }}>
                    (Tip: You can drag this pin or click anywhere on map)
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "#38bdf8", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                    {patientLocation.lat.toFixed(4)}, {patientLocation.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

        {/* Dynamic Route Polyline */}
        {showRoute &&
          Array.isArray(routeToRender) &&
          routeToRender.length > 1 &&
          routeToRender.every(
            (p) => Array.isArray(p) && p.length >= 2 && isValidCoord(p[0]) && isValidCoord(p[1])
          ) && (
            <>
              {/* Outer glowing path */}
              <Polyline
                positions={routeToRender}
                pathOptions={{
                  color: "#06b6d4",
                  weight: 8,
                  opacity: 0.55,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              {/* Inner focused path */}
              <Polyline
                positions={routeToRender}
                pathOptions={{
                  color: "#38bdf8",
                  weight: 4,
                  opacity: 0.95,
                  dashArray: "2, 8",
                }}
              />
            </>
          )}

        <MapFleetFitter trigger={fitFleetTrigger} />

        {/* Hospital Markers */}
        {(hospitals || [])
          .filter((h) => {
            const lat = parseFloat(h?.latitude);
            const lng = parseFloat(h?.longitude);
            return !isNaN(lat) && !isNaN(lng);
          })
          .map((hosp) => {
            const lat = parseFloat(hosp.latitude);
            const lng = parseFloat(hosp.longitude);
            return (
              <Marker
                key={`hosp-${hosp.id}`}
                position={[lat, lng]}
                icon={createHospitalIcon(hosp.available_beds)}
              >
                <Popup>
                  <div style={{ padding: "0.2rem" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#38bdf8" }}>
                      {hosp.name}
                    </strong>
                    <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: "0.8rem" }}>
                      {hosp.address}
                    </p>
                    <div style={{ marginTop: "6px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <span className="badge badge-medium">
                        🛏️ {hosp.available_beds} Beds Available
                      </span>
                      {hosp.icu_available && (
                        <span className="badge badge-critical" style={{ fontSize: "0.68rem" }}>
                          ICU Ready
                        </span>
                      )}
                      {hosp.trauma_available && (
                        <span className="badge badge-high" style={{ fontSize: "0.68rem" }}>
                          Trauma Center
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Ambulance Markers */}
        {(ambulances || [])
          .filter((a) => {
            const lat = parseFloat(a?.latitude);
            const lng = parseFloat(a?.longitude);
            return !isNaN(lat) && !isNaN(lng);
          })
          .map((amb) => {
            const isTrackedAmbulance =
              trackedAmbulanceId != null && String(amb.id) === String(trackedAmbulanceId);
            const lat = isTrackedAmbulance
              ? trackedAmbulanceLocation?.[0] ?? parseFloat(amb.latitude)
              : parseFloat(amb.latitude);
            const lng = isTrackedAmbulance
              ? trackedAmbulanceLocation?.[1] ?? parseFloat(amb.longitude)
              : parseFloat(amb.longitude);
            return (
              <Marker
                key={`amb-${amb.id}`}
                position={[lat, lng]}
                icon={createAmbulanceIcon(amb.status, amb.vehicle_number)}
                zIndexOffset={isTrackedAmbulance ? 1200 : 0}
              >
                <Popup>
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "#f8fafc" }}>
                      🚑 {amb.vehicle_number}
                    </strong>
                    <div style={{ marginTop: "4px", fontSize: "0.8rem", color: "#94a3b8" }}>
                      <div>Type: <strong>{amb.ambulance_type} Life Support</strong></div>
                      <div>Driver: {amb.driver_name || "Assigned Driver"}</div>
                      <div>Phone: {amb.driver_phone || "+91 94370 12345"}</div>
                      {amb.base_location && <div>Stand: {amb.base_location}</div>}
                    </div>
                    <div style={{ marginTop: "6px" }}>
                      <span
                        className={`badge ${
                          amb.status === "AVAILABLE"
                            ? "badge-available"
                            : amb.status === "ASSIGNED"
                            ? "badge-assigned"
                            : amb.status === "OFFLINE"
                            ? "badge-offline"
                            : "badge-en-route"
                        }`}
                      >
                        {amb.status}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Emergency Distress Markers */}
        {(emergencies || [])
          .filter((e) => e && isValidCoord(e.latitude) && isValidCoord(e.longitude))
          .map((emerg) => (
            <Marker
              key={`emerg-${emerg.id}`}
              position={[emerg.latitude, emerg.longitude]}
              icon={createEmergencyIcon(emerg.severity)}
              eventHandlers={{
                click: () => onEmergencyClick && onEmergencyClick(emerg),
              }}
            >
              <Popup>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span className="badge badge-critical">SOS INCIDENT #{emerg.id}</span>
                    <span className="badge badge-high">Priority: {Math.round((emerg.priority_score || 0.5) * 100)}%</span>
                  </div>
                  <strong style={{ color: "#ef4444", fontSize: "0.9rem" }}>
                    {emerg.emergency_type}
                  </strong>
                  <div style={{ marginTop: "4px", fontSize: "0.8rem", color: "#94a3b8" }}>
                    <div>Caller: {emerg.caller_name || "Anonymous / Citizen"}</div>
                    <div>Status: <strong>{emerg.status}</strong></div>
                    <div>Severity: <strong style={{ color: emerg.severity === "CRITICAL" ? "#ef4444" : "#f59e0b" }}>{emerg.severity}</strong></div>
                    {emerg.address_hint && <div>Location: {emerg.address_hint}</div>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}


