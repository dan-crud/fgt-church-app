# FGT Church App

A full-stack church management web application built for **FGT Church Nepalgunj**.  
This system helps manage donations, member submissions, template-based card generation, reports, and editable site content through an admin/user dashboard.

---

## Features

- Admin and church user login
- Donation registration and management
- Report viewing and filtering
- Template image upload for card generation
- Generate donation/member cards
- Contact / new member form submissions
- CMS-style editable site content
- Card coordinate settings storage
- User management for church staff
- Password change and reset options

---

## Tech Stack

### Frontend
- React
- React Router DOM
- Axios
- Lucide React
- Recharts
- html2canvas
- jsPDF
- xlsx
- nepalify / nepalify-react

### Backend
- Node.js
- Express.js
- MySQL
- multer
- cors
- dotenv

---

## Project Structure

```
fgt-church-app/
│
├── client/          # React frontend
├── server/          # Express backend
└── README.md
```

---

## Main Modules

### Frontend Pages
- Home
- Dashboard
- New Registration
- Reports
- Photo
- Generate Card
- Explore (CMS)
- Settings

### Backend APIs
- Authentication
- Church User Management
- Donation Management
- Template Upload
- Contact Submissions
- Site Content Management
- Card Coordinate Settings

---

## Getting Started

### 1. Clone the Repository

```
git clone https://github.com/dan-crud/fgt-church-app.git
cd fgt-church-app
```

### 2. Install Dependencies

#### Client
```
cd client
npm install
```

#### Server
```
cd ../server
npm install
```

---

## Environment Setup

Create a `.env` file inside the `server` folder.

```
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fgt_church_app
DB_PORT=3306
```

---

## Run the Project

### Start Backend
```
cd server
npm run dev
```

or

```
npm start
```

### Start Frontend

Open another terminal:

```
cd client
npm start
```

Frontend:
```
http://localhost:3000
```

Backend:
```
http://localhost:5000
```

---

## Database Overview

The application uses MySQL and includes tables like:

- users
- church_users
- donations
- settings
- new_members
- site_content

---

## Core Functionality

### Authentication
- Admin login
- Church user login
- Change password
- Reset user password by admin

### Donations
- Add donation records
- View donations
- Filter by year and month
- Delete single donation
- Bulk delete donations

### Template & Card Generation
- Upload template image
- Save template path
- Generate printable/downloadable cards
- Store and reuse card coordinates

### Contact / New Members
- Save new member submissions
- View all submissions
- Mark submissions as viewed

### CMS Content
- Fetch editable site content by key
- Update site content dynamically

---

## Available Scripts

### Client
```
npm start
npm run build
npm test
```

### Server
```
npm run dev
npm start
```

---

## Deployment Idea

- Frontend: Netlify or Vercel
- Backend: Render or Railway
- Database: Railway MySQL / PlanetScale

---

## Future Improvements

- JWT authentication
- Password hashing
- Role-based access control
- Better validation
- Dashboard analytics
- Export reports to Excel/PDF

---

## Author

Developed by **Dan Shahi**

---

## License

This project is for church/internal use.
