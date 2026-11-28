# SafeStreet-AI-Buildathon-2026
# SafeStreet AI
### Know Your Route Before You Walk It.

**SafeStreet AI** is a smart city-walking platform designed to help citizens identify better-informed walking routes using street-condition evidence. It helps citizens report street problems and enables city administrators to review reports and identify areas that need attention.

Built for **CityFix Buildathon 2026**.

---

##  Project Overview

Walking safely in cities can be challenging due to poor street lighting, damaged footpaths, blocked walkways, unsafe crossings, and accessibility barriers.

SafeStreet AI aims to address these problems through a citizen-reporting platform and route-condition information.

The platform brings together citizens and city administrators to make street issues more visible and support better urban infrastructure management.

##  Key Features

### 1.  Route Comparison
- Compare available walking routes.
- View street-lighting conditions.
- Check footpath conditions.
- Review pedestrian crossing infrastructure.
- View accessibility evidence.
- Display observation counts behind route scores.

### 2.  Report Street Issues
Citizens can report problems such as:
- Poor street lighting.
- Damaged footpaths.
- Blocked walkways.
- Unsafe crossings.
- Accessibility barriers.

Reports can include a location, description, and optional photograph.

### 3.  AI-Assisted Report Review
- Organises and categorises reported issues.
- Generates summaries of reports.
- Identifies possible duplicate reports.
- Provides AI-assisted severity and confidence suggestions.

**Note:** AI outputs are suggestions and require human verification.

### 4.  Citizen Dashboard
- Explore available routes.
- Compare route conditions.
- Submit street issue reports.
- View community observations.
- Track report statuses.

### 5.  Admin Dashboard
- Review citizen reports.
- Search and filter reports.
- View category-wise analytics.
- Monitor ward-wise problems.
- Identify repeated problem areas.
- Track verified, resolved, pending, and rejected reports.

### 6. User Authentication Interface
- Citizen and Admin login interfaces.
- Citizen registration.
- Forgot password interface.
- Reset password interface.

---

##  Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Interactive functionality |
| Leaflet.js | Interactive maps |
| OpenStreetMap | Map tiles and geographic display |
| Google Fonts | Typography |

---

## 📂 Project Structure

```text
SafeStreet/
│
└── frontend/
    │
    ├── Index/
    │   ├── Index.html
    │   └── style.css
    │
    ├── Citizen/
    │   └── Dashboard Citizen.html
    │
    ├── admin/
    │   └── Dashboard Admin.html
    │
    └── login/
        ├── Login.html
        ├── Register.html
        ├── forgotpass.html
        └── reset.html
```

---

##  How to Run the Project

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/SafeStreet.git
```

### Step 2: Open the Project

```bash
cd SafeStreet
```

Open the project folder in Visual Studio Code.

### Step 3: Run the Website

Open the following file using the VS Code Live Server extension:

```text
frontend/Index/Index.html
```

Alternatively, run a local server from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/frontend/Index/Index.html
```

An internet connection is needed for externally hosted map tiles and fonts.

---

##  How It Works

1. **Citizen Reports:** Citizens report street problems with their location and description.
2. **AI Organises:** Reports can be categorised, summarised, and checked for possible duplicates.
3. **City Reviews:** Administrators review reports and identify recurring problems.
4. **Status Tracking:** Reports are represented through statuses such as Pending, Verified, and Resolved.

---

##  Current Project Status

The supplied project currently contains frontend HTML, CSS, and JavaScript interfaces with demonstration data.

- Route scores and report records are sample data.
- Login and registration interfaces use demo behavior.
- Report submission is not connected to persistent backend storage.
- Password recovery requires backend integration.
- AI-assisted review and city analytics are represented through demo interfaces and sample data.

A backend, database, real authentication service, and production AI integration are not included in the supplied project files.

---

##  Future Enhancements

- Integrate a secure backend and database.
- Implement real-time citizen report submission.
- Integrate AI-based issue classification.
- Add live city infrastructure data.
- Implement secure user authentication.
- Add image storage for citizen reports.
- Provide notifications when report statuses change.
- Expand route-condition analysis using verified observations.

---

##  Project Goal

Our goal is to make urban walking information more transparent, encourage citizen participation, and help city authorities identify and prioritise street infrastructure problems.

**SafeStreet AI – Better Street Information. Better Urban Mobility.**

---

**Project:** SafeStreet AI  
**Event:** CityFix Buildathon 2026  
**Category:** Smart City / Urban Mobility