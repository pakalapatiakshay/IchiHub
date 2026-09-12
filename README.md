# 🛍️ IchiHub Marketplace

**IchiHub** is a full-stack, real-time marketplace platform that connects customers with verified service providers. It supports service discovery, bookings, vendor availability, live location tracking, reviews, payments, complaints, and administrative management.

## 📸 Screenshots
<img width="1912" height="977" alt="image" src="https://github.com/user-attachments/assets/58390534-d1ae-42cc-af5c-558bc96ca405" />


## ✨ Features

* 👤 **Multi-role system** — Customer, Vendor & Admin
* 🏪 **Vendor management** — Profiles, verification & availability
* 📅 **Booking system** — Create and manage service bookings
* 📍 **Live tracking** — Real-time vendor location using SSE
* 🗺️ **Interactive maps** — Powered by React Leaflet
* 💳 **Payments & reviews**
* 📢 **Customer complaints & support**
* 📊 **Admin dashboard** — Analytics, verification & audit records

## 🛠️ Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* React Router
* React Leaflet
* Lucide React

### Backend

* Node.js 20+
* Native Node.js HTTP server
* Server-Sent Events (SSE)
* JSON-based data storage

> The backend is built using native Node.js APIs without Express or other external backend frameworks.

## 🚀 Getting Started

### Prerequisites

* Node.js 20+
* npm

### Clone the repository

```bash
git clone https://github.com/pakalapatiakshay/ichihub.git
cd ichihub
```

### Backend

```bash
cd backend
```

Create the environment file:

```bash
cp .env.example .env
```

Then start the server:

```bash
node server.js
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The application will be available at the local URL provided by Vite.

## 📁 Project Structure

```text
ichihub/
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── data/
│   │   └── ichihub.json
│   ├── server.js
│   └── .env.example
│
└── README.md
```

## 🔮 Future Improvements

* Production database integration
* Push notifications
* Advanced vendor recommendations
* Mobile application
* Cloud deployment
* Automated testing & CI/CD

## 📄 License

This project is intended for educational and development purposes.

---

⭐ **If you like this project, consider giving it a star!**
