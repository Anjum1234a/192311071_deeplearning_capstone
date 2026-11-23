# CLINIDENT – AI-Powered Dental Clinic Management System (Web Application)

**CLINIDENT** is a comprehensive, modern, web-based dental clinic management system designed with a **Single Doctor User Role**. The doctor manages patient electronic health records (EHR), appointment queues, visual 32-tooth odontograms, clinical SOAP notes with voice-to-text dictation, digital e-prescriptions, radiographic imaging, 3D intraoral STL scans, and AI-assisted decision support—all from a single, intuitive dashboard.

---

## 🎨 Design & Theme

- **Design System:** Clean Healthcare SaaS interface.
- **Theme:** Strict Light Theme only.
- **Primary Color:** Electric Blue (`#0A84FF`).
- **Secondary Color:** Healthcare Teal (`#00C2A8`).
- **Background:** Crisp White (`#FFFFFF`) and Soft Slate (`#F8FAFC`).
- **Typography:** Inter & Poppins.
- **Responsiveness:** Fully responsive across Desktop, Tablet, and Mobile devices.

---

## ⚙️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Tailwind CSS.
- **Odontogram:** SVG & Canvas based FDI Two-Digit Standard (11–48).
- **3D Imaging:** Interactive HTML5 Canvas / WebGL 3D Intraoral STL Mesh Viewer with rotation, pitch, and zoom.
- **Voice Dictation:** Web Speech Recognition API (`webkitSpeechRecognition`).
- **Backend:** PHP 8.x RESTful APIs with PDO prepared statements and input validation.
- **Database:** MySQL 8.x / MariaDB (Normalized 3NF schema with foreign keys and cascades).
- **Server:** XAMPP (Apache + MySQL) or standalone server.
- **Data Exchange:** JSON over HTTP/HTTPS.

---

## 🩺 System Modules & Features

### 1. Doctor Dashboard
- Real-time clinic statistics: **Total Patients**, **Today's Appointments**, **Upcoming**, **Completed**, and **Pending** queues.
- Today's appointment queue with one-click **"Complete"** status transition.
- Recent patient activity feed.
- Quick clinical shortcuts (Odontogram, E-Rx, AI Scan, 3D STL Viewer).

### 2. Patient Management (EHR)
- Add, search, view, edit, and delete patient records.
- Patient code generation (e.g., `CD-1001`).
- Digital Profile tabs: Demographics, Contact, Medical History (Hypertension, Diabetes), Dental History, and Emergency Contacts.
- **Drug Allergy Highlighting:** Prominent warning pills for contraindications (e.g. `⚠️ Penicillin (Skin Rash)`).

### 3. Appointment Scheduling
- Schedule, complete, reschedule, or cancel patient appointments.
- Status filters: `Scheduled`, `Completed`, `Cancelled`, `Waiting List`.
- Conflict prevention and reminder tracking.

### 4. Visual Interactive Odontogram
- **Adult 32-Tooth Dental Chart** adhering to the **FDI Two-Digit Standard**:
  - Maxillary Arch (Upper Jaw: Teeth 18 to 28)
  - Mandibular Arch (Lower Jaw: Teeth 48 to 38)
- Real-time pathology states: **Healthy** (Teal), **Caries / Cavity** (Red), **Restored / Filled** (Blue), **Crown / Bridge** (Amber), **Missing / Extracted** (Gray), **Root Canal Treated** (Purple).
- Surface selection: **M** (Mesial), **O** (Occlusal), **D** (Distal), **B** (Buccal), **L** (Lingual).
- Periodontal pocket depth slider (1 to 9 mm), mobility grades (0 to 3), and endodontic status (Vital, Symptomatic, Treated).

### 5. Clinical Documentation (SOAP & Voice Notes)
- Standardized **SOAP** framework:
  - **Subjective (S):** Chief complaint and pain timeline.
  - **Objective (O):** Percussion tests, cold test findings, pocket depths.
  - **Assessment (A):** Diagnosis (e.g., Symptomatic Irreversible Pulpitis).
  - **Plan (P):** Procedure executed, medicament placed, recall date.
- **Voice-to-Text Input:** Tap the **"Voice Dictate"** microphone button to dictate observations hands-free while wearing gloves.
- Saved clinical notes history list.

### 6. Prescription Management (Rx)
- Generate tamper-proof digital e-prescriptions.
- Dynamic medication rows: Drug Name, Dosage (e.g. 500mg), Frequency (e.g. 1-0-1), Duration (e.g. 5 Days), and Instructions (e.g. After food).
- **Print Rx Slip:** Formats a formal prescription slip complete with clinic branding, patient info, Rx symbol, dosage table, doctor's advice, and signature line.

### 7. Dental Imaging & 3D STL Viewer
- Manage **IOPA**, **OPG**, **CBCT**, **Intraoral Photos**, and **STL dental scans**.
- Patient-wise image storage.
- **Interactive 3D STL Scan Viewer:** Rotate, inspect, and zoom 3D dental scan files in the browser with **Solid Shaded** and **Wireframe** modes.
- *Format Guard:* AI analysis is restricted to 2D radiographs (JPG, JPEG, PNG); 3D STL files are handled in the dedicated 3D viewer.

### 8. AI-Assisted Radiograph Analysis
- **Decision-Support Banner:** Explicitly presents findings as non-diagnostic assistive indicators requiring confirmation by the treating dentist.
- Real-time simulated CNN inference with laser scan animation.
- Bounding box annotations with confidence metrics (e.g. *Interproximal Caries: 93.4%*, *Periapical Radiolucency: 86.8%*).
- Spacing and crowding assessment.
- Missing tooth identification.
- **Interactive Before-and-After Treatment Comparison Slider:** Draggable split slider to visually monitor healing and composite restoration over time.

### 9. Reports, Analytics & Settings
- Overview of total patients, completed treatments, and radiographic records.
- Clinical procedure distribution breakdown.
- Doctor and clinic contact settings with local persistence.

---

## 🚀 Installation & Setup Guide

### Method A: Running on XAMPP (Recommended Full-Stack Setup)

1. **Start XAMPP:**
   Open the XAMPP Control Panel and start **Apache** and **MySQL**.

2. **Import Database:**
   - Open your browser and go to `http://localhost/phpmyadmin/`.
   - Click **Import** and select the file `database/clinident.sql`.
   - Click **Go**. The database `clinident` will be created with all tables and sample records.

3. **Deploy to `htdocs`:**
   Copy the `Deep learning project` folder into `C:\xampp\htdocs\clinident\`.

4. **Open in Browser:**
   Visit: `http://localhost/clinident/`

### Method B: Immediate Direct Launch (Offline / Client Mode)

The application includes an **automatic smart fallback storage engine**:
- Simply double-click `index.html` to open it directly in Google Chrome, Microsoft Edge, or Firefox.
- If MySQL is not running, the application automatically uses local client storage with all 4 sample patients, odontograms, appointments, and prescriptions fully functional.

---

## 🔑 Doctor Credentials

- **Email:** `doctor@clinident.com`
- **Password:** `Doctor@123`
*(Or click the one-touch **"Use Demo Doctor Credentials"** button on the sign-in modal)*

---

## 📂 Project Structure

```
Deep learning project/
├── index.html                    # Single-page doctor application shell
├── css/
│   └── main.css                  # Theme stylesheet, odontogram, 3D viewer & print rules
├── js/
│   ├── app.js                    # UI router, view management, modals, and toasts
│   ├── store.js                  # Data store layer (PHP REST sync + fallback cache)
│   ├── odontogram.js             # Visual 32-tooth odontogram module
│   ├── ai-analysis.js            # AI decision support, radiograph scanner, before/after slider
│   ├── stl-viewer.js             # 3D Dental STL mesh viewer with WebGL/Canvas projection
│   └── voice-notes.js            # Web Speech API voice-to-text dictation
├── api/
│   ├── config/
│   │   └── db.php                # Database connection, CORS, and JSON helpers
│   ├── auth.php                  # Doctor authentication and session verification
│   ├── patients.php              # CRUD for patient electronic health records
│   ├── appointments.php          # CRUD for appointments & scheduler
│   ├── dental_chart.php          # Odontogram tooth conditions CRUD
│   ├── clinical_notes.php        # SOAP notes and procedure history CRUD
│   ├── prescriptions.php         # E-prescriptions CRUD
│   ├── imaging.php               # Dental images and 3D STL files CRUD
│   ├── ai_analysis.php           # AI decision-support inference endpoints
│   └── reports.php               # Clinic statistics & analytics
├── database/
│   └── clinident.sql             # Complete MySQL schema + initial sample clinic data
├── uploads/
│   ├── images/                   # Uploaded IOPA, OPG, and Intraoral radiographs
│   └── stl/                      # Uploaded 3D dental scan files (.stl)
└── README.md                     # Documentation & setup manual
```
