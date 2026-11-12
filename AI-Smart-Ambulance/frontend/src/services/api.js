import {
  MOCK_AMBULANCES,
  MOCK_EMERGENCIES,
  MOCK_HOSPITALS,
  calculateDistanceKm,
  generateRoutePoints,
  generateLocalEmergencyInfrastructure,
} from "./mockData";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const TIMEOUT_MS = 2500;

// Local in-memory state for simulation mode
let simEmergencies = [...MOCK_EMERGENCIES];
let simAmbulances = [...MOCK_AMBULANCES];
let simHospitals = [...MOCK_HOSPITALS];
const localEmergencyIds = new Set();
const localTripIds = new Set();
let simTrips = [
  {
    id: 501,
    emergency_id: 101,
    ambulance_id: 3,
    hospital_id: 4,
    status: "EN_ROUTE",
    start_time: new Date(Date.now() - 5 * 60000).toISOString(),
    distance: 3.4,
    estimated_time: 6.5,
  },
];

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

let backendOnlineCached = false;
let lastHealthCheckTime = 0;

async function authRequest(endpoint, payload, fallbackError) {
  let response;
  try {
    response = await fetchWithTimeout(`${API_BASE}/auth/${endpoint}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Authentication request timed out. Please try again.");
    }
    throw new Error(
      "Authentication service is unavailable. Start the backend on port 8000 and try again."
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || fallbackError);
  }
  return response.json();
}

export const apiService = {
  // Check whether backend is online
  async checkHealth() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1000);
      const res = await fetch("http://localhost:8000/health", { signal: controller.signal });
      clearTimeout(id);
      backendOnlineCached = res.ok;
      lastHealthCheckTime = Date.now();
      return res.ok;
    } catch {
      backendOnlineCached = false;
      lastHealthCheckTime = Date.now();
      return false;
    }
  },

  // Set active location & cluster dynamic emergency infrastructure
  setSimulationLocation(lat, lng, placeName) {
    const infra = generateLocalEmergencyInfrastructure(lat, lng, placeName);
    const activeTrips = simTrips.filter(
      (trip) => trip.status !== "COMPLETED" && trip.status !== "CANCELLED"
    );
    const activeEmergencyIds = new Set([
      ...activeTrips.map((trip) => String(trip.emergency_id)),
      ...localEmergencyIds,
    ]);
    const activeAmbulanceIds = new Set(
      activeTrips
        .map((trip) => trip.ambulance_id)
        .filter((id) => id != null)
        .map(String)
    );
    const activeHospitalIds = new Set(
      activeTrips
        .map((trip) => trip.hospital_id)
        .filter((id) => id != null)
        .map(String)
    );

    const activeEmergencies = simEmergencies.filter((emergency) =>
      activeEmergencyIds.has(String(emergency.id))
    );
    const activeAmbulances = simAmbulances.filter((ambulance) =>
      activeAmbulanceIds.has(String(ambulance.id))
    );
    const activeHospitals = simHospitals.filter((hospital) =>
      activeHospitalIds.has(String(hospital.id))
    );

    simHospitals = [
      ...infra.hospitals.filter(
        (hospital) => !activeHospitalIds.has(String(hospital.id))
      ),
      ...activeHospitals,
    ];
    simAmbulances = [
      ...infra.ambulances.filter(
        (ambulance) => !activeAmbulanceIds.has(String(ambulance.id))
      ),
      ...infra.ambulances.filter((ambulance) =>
        activeAmbulanceIds.has(String(ambulance.id))
      ).map((ambulance) => {
        const activeAmbulance = activeAmbulances.find(
          (item) => String(item.id) === String(ambulance.id)
        );
        return activeAmbulance ? { ...ambulance, ...activeAmbulance } : ambulance;
      }),
      ...activeAmbulances.filter(
        (ambulance) =>
          !infra.ambulances.some((item) => String(item.id) === String(ambulance.id))
      ),
    ];
    simEmergencies = [
      ...activeEmergencies,
      ...infra.emergencies.filter(
        (emergency) => !activeEmergencyIds.has(String(emergency.id))
      ),
    ];
    simTrips = activeTrips;

    return infra;
  },

  // Emergencies
  async getEmergencies() {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/emergencies/`);
        if (res.ok) {
          const emergencies = await res.json();
          const backendIds = new Set(emergencies.map((emergency) => String(emergency.id)));
          const localEmergencies = simEmergencies.filter(
            (emergency) =>
              localEmergencyIds.has(String(emergency.id)) &&
              !backendIds.has(String(emergency.id))
          );
          return [...emergencies, ...localEmergencies];
        }
      } catch (_) {
        backendOnlineCached = false;
      }
    }
    return simEmergencies;
  },

  async createEmergency(data) {
    if (backendOnlineCached && data.user_id != null) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/emergencies/`, {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    // Simulation fallback
    const priorityScore =
      data.severity === "CRITICAL"
        ? 0.95
        : data.severity === "HIGH"
        ? 0.78
        : data.severity === "MEDIUM"
        ? 0.5
        : 0.25;

    const newEmerg = {
      id: Date.now(),
      user_id: data.user_id || 1,
      caller_name: data.caller_name || "Citizen (You)",
      caller_phone: data.caller_phone || "+91 94370 12345",
      emergency_type: data.emergency_type,
      severity: data.severity,
      latitude: data.latitude,
      longitude: data.longitude,
      status: "REQUESTED",
      priority_score: priorityScore,
      assigned_ambulance_id: null,
      recommended_hospital_id: null,
      address_hint: data.address_hint || "Location Pinpoint",
      created_at: new Date().toISOString(),
    };
    simEmergencies = [newEmerg, ...simEmergencies];
    localEmergencyIds.add(String(newEmerg.id));
    return newEmerg;
  },

  async updateEmergencyStatus(id, status) {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/emergencies/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    simEmergencies = simEmergencies.map((e) =>
      String(e.id) === String(id) ? { ...e, status } : e
    );
    if (status === "COMPLETED" || status === "CANCELLED") {
      localEmergencyIds.delete(String(id));
    }
    return simEmergencies.find((e) => e.id === id);
  },

  // Ambulances
  async getAmbulances() {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/ambulances/`);
        if (res.ok) {
          const ambulances = await res.json();
          if (ambulances.length > 0) return ambulances;
        }
      } catch (_) {
        backendOnlineCached = false;
      }
    }
    return simAmbulances;
  },

  async updateAmbulanceStatus(id, status) {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/ambulances/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    simAmbulances = simAmbulances.map((a) =>
      a.id === id ? { ...a, status } : a
    );
    return simAmbulances.find((a) => a.id === id);
  },

  async recommendAmbulance(lat, lng) {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(
          `${API_BASE}/ambulances/recommend?latitude=${lat}&longitude=${lng}`
        );
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    // Simulation nearest calculation
    const avail = simAmbulances.filter((a) => a.status === "AVAILABLE");
    const candidates = avail.length > 0 ? avail : simAmbulances;
    if (candidates.length === 0) return null;

    let nearest = candidates[0];
    let minD = calculateDistanceKm(lat, lng, nearest.latitude, nearest.longitude);
    for (const amb of candidates) {
      const dist = calculateDistanceKm(lat, lng, amb.latitude, amb.longitude);
      if (dist < minD) {
        minD = dist;
        nearest = amb;
      }
    }
    return nearest;
  },

  // Hospitals
  async getHospitals() {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/hospitals/`);
        if (res.ok) {
          const hospitals = await res.json();
          if (hospitals.length > 0) return hospitals;
        }
      } catch (_) {
        backendOnlineCached = false;
      }
    }
    return simHospitals;
  },

  async recommendHospital(lat, lng, needsIcu = false, needsTrauma = false) {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(
          `${API_BASE}/hospitals/recommend?latitude=${lat}&longitude=${lng}&needs_icu=${needsIcu}&needs_trauma=${needsTrauma}`
        );
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    let candidates = simHospitals.filter(
      (h) =>
        (!needsIcu || h.icu_available) &&
        (!needsTrauma || h.trauma_available) &&
        h.available_beds > 0
    );
    if (candidates.length === 0) candidates = simHospitals;

    let nearest = candidates[0];
    let minD = calculateDistanceKm(lat, lng, nearest.latitude, nearest.longitude);
    for (const h of candidates) {
      const dist = calculateDistanceKm(lat, lng, h.latitude, h.longitude);
      if (dist < minD) {
        minD = dist;
        nearest = h;
      }
    }
    return nearest;
  },

  // Trips
  async getTrips() {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/trips/`);
        if (res.ok) {
          const trips = await res.json();
          if (trips.length > 0) {
            const backendIds = new Set(trips.map((trip) => String(trip.id)));
            const localTrips = simTrips.filter(
              (trip) =>
                localTripIds.has(String(trip.id)) &&
                !backendIds.has(String(trip.id))
            );
            return [...trips, ...localTrips];
          }
        }
      } catch (_) {
        backendOnlineCached = false;
      }
    }
    return simTrips;
  },

  async createTrip(payload) {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/trips/`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    const newTrip = {
      id: Date.now(),
      emergency_id: payload.emergency_id,
      ambulance_id: payload.ambulance_id,
      hospital_id: payload.hospital_id,
      status: "ASSIGNED",
      start_time: new Date().toISOString(),
      distance: 3.8,
      estimated_time: 7.0,
    };
    simTrips = [newTrip, ...simTrips];
    localTripIds.add(String(newTrip.id));

    // Mark ambulance as assigned
    this.updateAmbulanceStatus(payload.ambulance_id, "ASSIGNED");
    // Mark emergency as assigned
    this.updateEmergencyStatus(payload.emergency_id, "ASSIGNED");

    return newTrip;
  },

  async updateTripStatus(tripId, status) {
    if (backendOnlineCached) {
      try {
        const res = await fetchWithTimeout(`${API_BASE}/trips/${tripId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        if (res.ok) return await res.json();
      } catch (_) {
        backendOnlineCached = false;
      }
    }

    simTrips = simTrips.map((t) =>
      String(t.id) === String(tripId) ? { ...t, status } : t
    );
    if (status === "COMPLETED" || status === "CANCELLED") {
      localTripIds.delete(String(tripId));
    }
    return simTrips.find((t) => String(t.id) === String(tripId));
  },

  // Routes: prefer the fastest available alternative when selecting a hospital route.
  async getRoute(originLat, originLng, destLat, destLng, preferLowTraffic = false) {
    const fetchOsrmRoute = async (alternatives) => {
      const alternativeParam = alternatives ? "&alternatives=3" : "";
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson${alternativeParam}`;
      const osrmRes = await fetchWithTimeout(osrmUrl);
      if (!osrmRes.ok) return null;

      const osrmData = await osrmRes.json();
      if (!osrmData.routes || osrmData.routes.length === 0) return null;
      const route = alternatives
        ? osrmData.routes.reduce((best, candidate) =>
            candidate.duration < best.duration ? candidate : best
          )
        : osrmData.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return {
        distance_km: parseFloat((route.distance / 1000).toFixed(2)),
        duration_min: Math.max(3, Math.round(route.duration / 60)),
        points: coords,
        source: alternatives ? "osrm_fastest_available_alternative" : "osrm_real_streets",
      };
    };

    if (preferLowTraffic) {
      try {
        const preferredRoute = await fetchOsrmRoute(true);
        if (preferredRoute) return preferredRoute;
      } catch (_) {}
    }

    // Try the local backend before the standard OSRM route.
    try {
      const res = await fetchWithTimeout(
        `${API_BASE}/routes/?origin_lat=${originLat}&origin_lng=${originLng}&dest_lat=${destLat}&dest_lng=${destLng}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.geometry && data.geometry.coordinates) {
          const coords = data.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          return {
            distance_km: data.distance_km,
            duration_min: data.duration_min,
            points: coords,
            source: data.source,
          };
        }
      }
    } catch (_) {}

    // Direct public OSRM OpenStreetMap routing.
    try {
      const route = await fetchOsrmRoute(false);
      if (route) return route;
    } catch (_) {}

    // Realistic curve interpolation fallback.
    const dist = calculateDistanceKm(originLat, originLng, destLat, destLng);
    return {
      distance_km: dist,
      duration_min: Math.max(3, Math.round((dist / 35) * 60 + 2)),
      points: generateRoutePoints(originLat, originLng, destLat, destLng),
      source: "simulation_interpolated",
    };
  },

  // Authentication API
  async login(email, password) {
    return authRequest("login", { email, password }, "Invalid email or password");
  },

  async register(data) {
    return authRequest("register", data, "Registration failed");
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  },
};

