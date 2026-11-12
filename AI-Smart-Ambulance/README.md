# AI-Powered Smart Ambulance Emergency Response & Route Optimization System

A 3-person college project for emergency ambulance dispatch, route optimization, AI-assisted decision support, hospital recommendation, and analytics.

## Team
- Member 1: Backend + Database + GitHub coordination
- Member 2: Frontend + Maps
- Member 3: AI/ML + Analytics

## Technology Stack
- Python
- REST APIs
- Streamlit
- React
- HTML/CSS/JavaScript
- Pandas
- NumPy
- Scikit-learn
- MySQL
- OpenStreetMap
- Leaflet
- Power BI

## Project Structure
- `backend/` — Python REST API and business logic
- `database/` — MySQL schema and seed data
- `frontend/` — React web application
- `ai/` — ML/data science
- `streamlit/` — AI/model dashboard
- `powerbi/` — analytics dashboards
- `docs/` — project documentation
- `tests/` — integration/API tests

## Team Workflow
Each member works on their own branch:
- `backend`
- `frontend`
- `ai-analytics`

`main` is the stable branch.

## Run the app locally

Start the backend API in a separate terminal (mobile login and emergency requests use it):

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Keep the phone and computer on the same Wi-Fi network. The mobile app uses the Expo development host to reach the API. If needed, set `EXPO_PUBLIC_API_URL` in the mobile app environment to the API's reachable URL, ending in `/api`.

For a physical phone, configure `mobile-app/.env` with the computer's Wi-Fi IPv4 address (copy `mobile-app/.env.example` and replace `YOUR_COMPUTER_LAN_IP`). Start the backend with `--host 0.0.0.0`; restart Expo after changing `.env`. Expo tunnel mode only tunnels the app bundle, not this local API.

Frontend web app:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open:

- http://localhost:5173

Mobile app:

```bash
cd mobile-app
npm install
npx expo start
```

Use Expo Go on your phone or run the mobile app in an Android/iOS emulator.

The project includes a React dashboard for emergency response workflows, ambulance tracking, driver/admin portals, emergency SOS interactions, and a React Native mobile application for on-the-go dispatch management.
