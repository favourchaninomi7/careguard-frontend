# CareGuard Web

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)
![License](https://img.shields.io/badge/license-MIT-green)

CareGuard Web is the frontend application for the **CareGuard Healthcare Compliance Platform**.

It provides an intuitive, modern interface for residential care homes to manage residents, care records, medication records, compliance monitoring, audit trails, and record integrity verification.

---

## Features

### Dashboard

- Compliance overview
- Resident statistics
- Medication summary
- Integrity verification summary
- Audit activity feed

### Resident Management

- Resident registration
- Resident profile management
- Emergency contacts
- Assigned caregivers
- Resident version history

### Care Records

- Create care records
- Update care records
- View version history
- Integrity verification
- Record replay

### Medication Records

- Medication scheduling
- Medication administration
- Medication continuation
- Version history
- Integrity verification

### Compliance

- Compliance dashboard
- Integrity status
- Verification status
- Compliance reporting

### Audit

- Activity timeline
- User actions
- Record history
- Version playback

---

## Technology Stack

- React
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- TanStack Query
- Axios

---

## Project Structure

```
src/

├── app/
├── assets/
├── components/
│
├── features/
│   ├── auth/
│   ├── residents/
│   ├── care-records/
│   ├── medication/
│   ├── compliance/
│   ├── audit/
│   └── dashboard/
│
├── hooks/
├── layouts/
├── lib/
├── pages/
├── routes/
├── services/
├── store/
├── types/
└── utils/
```

---

## Installation

Clone the repository

- Frontend Codebase

```bash
git clone https://github.com/favourchaninomi7/careguard-frontend.git
```

- Backend Codebase

```bash
git clone https://github.com/favourchaninomi7/careguard-backend.git
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Build production

```bash
npm run build
```

Preview production build

```bash
npm run preview
```

---

## Environment Variables

Create a `.env` file.

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Key Features

- Secure Authentication
- Role-based UI
- Compliance Dashboard
- Resident Management
- Care Records
- Medication Records
- Version History
- Audit Timeline
- SHA-256 Integrity Status
- Integrity Playback

---

## User Roles

- Administrator
- Manager
- Care Staff
- Compliance Officer
- Inspector

---

## Screens

- Login
- Dashboard
- Residents
- Resident Details
- Care Records
- Medication Records
- Audit Logs
- Compliance
- Reports
- Settings

---

## Future Improvements

- Dark Mode
- Notifications
- Mobile Application
- Offline Support
- Multi-Care Home Support
- Analytics Dashboard

---

## Demonstration Administrator Credentials

The following credentials were created for the purpose of demonstrating and evaluating the CareGuard application:

*Administrator Email:* [admin@careguard.com](mailto:admin@careguard.com)
*Administrator Password:* 11223344

> *Note:* These credentials are provided for academic demonstration and testing purposes only.

---

## Author

Favour Chaninomi

Healthcare Compliance Platform for Residential Care Homes.