# 🏥 Queue Cure '26

### Smart Real-Time Hospital Queue Management System

> Reducing patient wait anxiety through real-time queue visibility, AI-powered wait-time prediction, and live doctor queue synchronization.

---

## 🚀 Problem Statement

Traditional hospital queues suffer from:

* Long and uncertain waiting times
* Lack of real-time updates
* Manual token management
* Poor visibility for patients
* Queue conflicts during peak hours

Queue Cure '26 provides a modern real-time queue management platform that keeps receptionists, doctors, and patients synchronized instantly.

---

# ✨ Key Features

### 👩‍⚕️ Receptionist Dashboard

* Add patients instantly
* Live queue monitoring
* Call next patient
* Skip patient
* Pause/Resume queue
* Real-time doctor status

### 📱 Patient View

* Live queue position
* AI-estimated waiting time
* Current token being served
* Queue progress updates
* Mobile-friendly interface

### ⚡ Real-Time Synchronization

Powered by Socket.IO:

* No page refresh required
* Instant queue updates
* Live token advancement
* Automatic reconnection handling

### 🤖 AI Wait-Time Prediction

Queue Cure calculates:

* Rolling consultation averages
* Dynamic ETA prediction
* Confidence score
* Consultation drift detection

---

# 🏗️ System Architecture

Frontend (React)
↓
REST APIs
↓
Node.js + Express
↓
Socket.IO Real-Time Layer
↓
MongoDB Atlas

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Socket.IO Client
* CSS3

## Backend

* Node.js
* Express.js
* Socket.IO
* Mongoose

## Database

* MongoDB Atlas

## Deployment

* Vercel (Frontend)
* Render (Backend)
* MongoDB Atlas (Database)

---

# 📂 Project Structure

```bash
queuecure/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── socket/
│   ├── routes.js
│   ├── server.js
│   └── seed.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── socket.js
│       └── index.js
│
└── README.md
```

---

# 🔄 Workflow

### Patient Registration

Receptionist adds patient

↓

Token generated automatically

↓

Patient enters queue

↓

ETA calculated

↓

Patient receives live updates

---

### Consultation Flow

Call Next

↓

Patient moves to Active Consultation

↓

Consultation duration recorded

↓

Rolling average updated

↓

Future ETAs recalculated

---

# 🧠 AI Wait-Time Engine

The system continuously analyzes recent consultation durations.

```javascript
ETA =
Patients Ahead × Rolling Average Consultation Time
```

### Confidence Score

Higher consistency in consultation durations results in higher confidence.

### Drift Detection

```javascript
if (rollingAverage > baseline * 1.2)
{
   aiAdjusted = true;
}
```

When consultation durations increase significantly, Queue Cure automatically adjusts future ETAs.

---

# 🔒 Concurrency Protection

To prevent queue corruption when multiple receptionists operate simultaneously:

```javascript
lockService.withLock(doctorId)
```

### Result

✅ First request succeeds

❌ Second request receives HTTP 409

Queue integrity remains protected.

---

# ⚠️ Edge Cases Handled

| Scenario               | Handling                         |
| ---------------------- | -------------------------------- |
| Empty Queue            | Returns proper error             |
| Duplicate Patient      | Prevented using phone validation |
| Duplicate Token        | Auto-increment logic             |
| Browser Refresh        | Full queue snapshot resent       |
| Lost Connection        | Auto reconnect                   |
| Queue Pause            | New calls blocked                |
| Simultaneous Call Next | Mutex locking                    |
| No-show Patient        | Skip functionality               |

---

# 📡 API Highlights

### Add Patient

```http
POST /api/patients
```

### Get Queue

```http
GET /api/queue
```

### Call Next

```http
POST /api/queue/call-next
```

### Complete Consultation

```http
POST /api/queue/complete
```

---

# 🔌 Socket Events

| Event                 | Description            |
| --------------------- | ---------------------- |
| subscribe             | Join queue updates     |
| patientAdded          | New patient added      |
| queueUpdated          | Queue changed          |
| tokenAdvanced         | Token called           |
| consultationStarted   | Consultation begins    |
| consultationCompleted | Consultation ends      |
| waitTimeUpdated       | ETA recalculated       |
| doctorStatsUpdated    | Doctor metrics updated |
| systemStatusUpdated   | Pause/Resume updates   |

---

# 💻 Local Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

# 🌍 Deployment

## Backend (Render)

```bash
Build Command:
npm install

Start Command:
node server.js
```

Environment Variables:

```env
PORT=5000
MONGODB_URI=<your-atlas-uri>
FRONTEND_URL=<frontend-url>
```

---

## Frontend (Vercel)

Environment Variables:

```env
REACT_APP_BACKEND_URL=<render-backend-url>
```

---

# 🎯 Impact

Queue Cure '26 improves healthcare experience by:

* Reducing uncertainty for patients
* Improving queue transparency
* Minimizing receptionist workload
* Preventing queue conflicts
* Delivering accurate wait-time estimates

---

# 👥 Team

Queue Cure '26

Built for Hackathon 2026 🚀

"Real-Time Care Starts With Real-Time Queues."
