
# SafeStreet AI

### Know Your Route Before You Walk It.

SafeStreet AI is a smart-city walking and street-condition platform built for **CityFix Buildathon 2026**.

The platform helps citizens report street infrastructure problems, explore walking-route conditions, and enables city administrators to review reports and identify areas that need attention.

> Better street information. Better urban mobility.

---

## Project Overview

Walking through a city can be challenging due to poor street lighting, damaged footpaths, blocked walkways, unsafe crossings, and accessibility barriers.

SafeStreet AI brings citizens and city administrators together through a digital platform that makes street-related observations easier to report, review, and track.

The project combines a citizen-facing interface, an administrative dashboard, a backend API, and route-condition information to demonstrate how technology can support more informed urban mobility.

---

## Key Features

### 1. Walking Route Exploration

- Search for locations and compare walking routes.
- Explore routes between different locations.
- View route information on an interactive map.
- Review available street-condition indicators.
- Display observations and evidence behind route information.

Route availability and street-condition data depend on connected map services and available observations.

### 2. Citizen Street Reports

Citizens can report issues such as:

- Poor street lighting
- Damaged footpaths
- Blocked walkways
- Unsafe pedestrian crossings
- Accessibility barriers

Reports can include a description, category, location, and supporting photograph where available.

### 3. AI-Assisted Report Analysis

The project includes an AI-assisted report-processing component intended to support:

- Issue categorisation
- Report summarisation
- Possible duplicate identification
- Severity and confidence suggestions

AI-generated results are assistive suggestions, not final decisions. Reports should be reviewed by a human administrator before action is taken.

### 4. Citizen Dashboard

- Explore route information.
- Submit street-condition reports.
- View submitted reports.
- Track report status.
- Review community observations.

### 5. Admin Dashboard

- View submitted citizen reports.
- Review and verify reports.
- Update report statuses.
- Monitor reported street issues.
- View report information and available analytics.

### 6. Authentication Interfaces

- Citizen login
- Admin login
- Citizen registration
- Forgot-password interface
- Reset-password interface

---

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and responsive UI |
| JavaScript | Frontend interactions |
| Node.js | Backend runtime |
| Express.js | REST API |
| SQLite | Local database |
| better-sqlite3 | SQLite database access |
| Leaflet.js | Interactive maps |
| OpenStreetMap | Map data and geographic display |
| Nominatim | Location search and geocoding |
| OSRM | Walking-route calculation |
| AI service integration | Assisted report analysis |

---

## Project Architecture

```text
SafeStreet-AI-Buildathon-2026-GalaxyBrain/
│
├── Backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── server.js
│   │   ├── seed-admin.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── services/
│   │   │   └── ai.js
│   │   └── utils.js
│   ├── uploads/
│   ├── package.json
│   ├── package-lock.json
│   └── API-TESTS.http
│
├── Frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── forgot-password.html
│   ├── reset-password.html
│   ├── citizen-dashboard.html
│   ├── admin-dashboard.html
│   └── assets/
│       ├── app.js
│       ├── enhancements.css
│       └── quick-automate-logo.svg
│
├── public/
│   └── citizen-dashboard.html
│
├── .env.example
├── .gitignore
└── README.md
```

---

## How the Platform Works

1. **Explore:** Citizens search for locations and explore available walking-route information.
2. **Report:** Citizens submit street-condition reports with relevant details.
3. **Process:** The backend receives and stores report information.
4. **Assist:** AI-assisted processing can organise and summarise report information.
5. **Review:** Administrators inspect submitted reports and verify relevant issues.
6. **Track:** Report statuses are updated so citizens and administrators can follow progress.

---

## Backend API

The backend exposes API endpoints for report submission, citizen report history, administrative report review, and status management.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/reports` | Submit a street-condition report |
| `GET` | `/api/my/reports` | Retrieve reports for the authenticated citizen |
| `GET` | `/api/admin/reports` | Retrieve reports for the admin dashboard |
| `PATCH` | `/api/reports/:id/status` | Update a report status as an administrator |

Authentication is required for protected report and administrative operations.

---

## Getting Started

### Prerequisites

- Node.js
- npm
- Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/SkArif-1/SafeStreet-AI-Buildathon-2026-GalaxyBrain.git
```

### 2. Open the Project

```bash
cd SafeStreet-AI-Buildathon-2026-GalaxyBrain
```

### 3. Install Backend Dependencies

```bash
cd Backend
npm install
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Add the required configuration values to `.env` according to `.env.example`.

**Never commit secrets, API keys, or private environment variables.**

### 5. Start the Backend

```bash
npm start
```

### 6. Run the Frontend

Open `Frontend/index.html` in Visual Studio Code and launch it using Live Server.

Ensure the frontend API configuration points to the running backend.

---

## Current Implementation & Limitations

SafeStreet AI is a buildathon prototype.

The current implementation includes frontend interfaces, backend report handling, authentication-related functionality, report status management, and route exploration.

Some route-condition indicators, scores, or observations may use demonstration or limited data. The availability of real street infrastructure information depends on connected services and verified observations.

AI-generated classifications and summaries should be treated as suggestions and reviewed by humans.

The project is not a replacement for official emergency services, verified municipal infrastructure records, or professional safety assessments.

---

## Future Enhancements

- Expand verified street-condition data.
- Improve route-condition scoring with reliable observations.
- Add stronger duplicate-report detection.
- Integrate municipal infrastructure datasets.
- Improve image-based street issue classification.
- Add report-status notifications.
- Expand accessibility-focused route analysis.
- Deploy the platform with production-grade security and monitoring.

---

## Team & Contributions

SafeStreet AI was developed collaboratively for CityFix Buildathon 2026.

| Contributor | Contribution |
|---|---|
| **Sk Arif** | Frontend development |
| **Mukim Shah** | AI Developer & Backend Developer |
| **@skabar808** | AI contribution |
| **@yasir** | Data Analysis & CSV |


### Project Contribution

**Mukim Shah**  
AI Developer & Backend Developer  
**Quick Automate**

Website: [quickautomate.in](https://quickautomate.in)

---

## Project Information

- **Project:** SafeStreet AI
- **Event:** CityFix Buildathon 2026
- **Category:** Smart City / Urban Mobility
- **Objective:** Improve street-condition awareness and support safer, more informed urban walking.

---

<p align="center">
  <strong>SafeStreet AI</strong><br>
  Know Your Route Before You Walk It.
</p>
