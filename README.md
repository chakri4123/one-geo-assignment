
# Well-Log Data Analytics Platform

A full-stack engineering system for ingesting, parsing, storing, and visualizing subsurface well-log (LAS) data.

Built with a **Python (FastAPI) backend** and a **React-based frontend**, this project simulates a real-world engineering data workflow used in subsurface analysis and energy systems.

---

## Overview

This platform enables users to:

* Upload LAS (Log ASCII Standard) files
* Parse depth-indexed well-log curves
* Store structured curve data in a database
* Persist raw files in AWS S3
* Visualize logs interactively (Depth vs Curves)
* Filter by depth range
* Zoom and pan across data

The system is modular, scalable, and designed with production architecture principles.

---

## Tech Stack

### Backend (Python)

* FastAPI
* lasio (LAS file parsing)
* PostgreSQL / MongoDB
* AWS S3
* Uvicorn

### Frontend

* React (Vite)
* Tailwind CSS
* Plotly.js

---

## Core Features

### LAS File Upload

* REST API endpoint for `.las` files
* Raw file stored in AWS S3
* Metadata extraction (well name, curve names, units)

### Data Parsing & Modeling

* Depth-indexed curve extraction
* Structured data storage in database
* Clean response models via FastAPI

### Interactive Visualization

* Depth vs selected curve plotting
* Inverted depth axis (industry standard)
* Curve selection dropdown
* Depth range filtering
* Zoom & pan interaction

---

## API Endpoints

### Upload File

```
POST /upload
```

Returns:

* File ID
* Curve list
* Well metadata

---

### Retrieve Curves

```
GET /curves/{file_id}
```

Optional query parameters:

```
?depth_from=1000&depth_to=1500
```

Returns:

* Depth array
* Selected curve values

---

## Architecture

```
React Frontend
        ↓
FastAPI (Python Backend)
        ↓
LAS Parsing (lasio)
        ↓
Database Storage
        ↓
AWS S3 (Raw Files)
        ↓
Plotly Visualization
```

Separation of concerns:

* Frontend → UI & visualization
* Backend → Business logic & parsing
* Database → Structured curve storage
* Cloud → Durable object storage

---

## Local Setup

### Clone Repository

```bash
git clone https://github.com/your-username/well-log-platform.git
cd well-log-platform
```

---

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Engineering Skills Demonstrated

* Python backend development
* REST API design
* File ingestion pipeline
* Data parsing & transformation
* Cloud storage integration
* Interactive data visualization
* Full-stack system architecture

---

## Future Improvements

* Multi-track log visualization
* Cross-plot analysis
* AI-assisted interpretation
* Report generation (PDF export)
* Authentication & multi-user support
* Dockerized deployment

---
