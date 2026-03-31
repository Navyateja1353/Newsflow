# NEWSFLOW (DIGITAL NEWSPAPER ALIGNMENT & GENERATION)

## 1. LOCAL SYSTEM SETUP & EXECUTION GUIDE

This section provides step-by-step instructions to set up and run the Newsflow system on a local machine.

### Step 1: Verify Project Structure

Ensure the project folder contains the following essential files and directories:

- **backend/**  
  Contains the Node.js/Express application server and Twilio WhatsApp integration.
- **backend/server.js**  
  Main backend application server entry point.
- **backend/db.js**  
  Database configuration and schema definitions (MySQL).
- **backend/package.json**  
  List of required Node.js backend dependencies.
- **newsflow-frontend/**  
  Contains the React.js/Vite frontend application (Admin Dashboard, Newspaper Layout, etc.).
- **newsflow-frontend/src/App.jsx**  
  Main frontend routing configuration.
- **newsflow-frontend/package.json**  
  List of required React frontend dependencies.

### Step 2: Install System Prerequisites

1. **Node.js (18 or above)**  
   Download from: https://nodejs.org/en/download/  
   *(Important: Node Package Manager (npm) is included).*

2. **MySQL Server**  
   Download from: https://dev.mysql.com/downloads/installer/  
   *(Save your installation password. The default configured in the app is `root@123`)*

3. **Twilio Account**  
   Create at: https://www.twilio.com/  
   *(Required for receiving WhatsApp messages and webhooks).*

### Step 3: Create Database (MySQL)

1. Open MySQL Command Line Client or MySQL Workbench.
2. Login using your MySQL credentials (typically user: `root` and password: `root@123`).
3. Run the following command to create the database:
   ```sql
   CREATE DATABASE newsflow;
   ```
*(Note: You do not need to manually create tables. They are auto-generated when the backend runs).*

### Step 4: Configure Environment Variables

1. Inside the `backend/` folder, create a file named:
   `.env`

2. Add the following configuration (replace with your actual Twilio details):
   ```env
   PORT=5000
   TWILIO_ACCOUNT_SID=your_twilio_sid_here
   TWILIO_AUTH_TOKEN=your_twilio_token_here
   ```

### Step 5: Install Node Dependencies

Open a terminal and navigate to the **backend** folder:
```bash
cd path/to/newsflow/backend
npm install
```

Open another terminal and navigate to the **frontend** folder:
```bash
cd path/to/newsflow/newsflow-frontend
npm install
```

### Step 6: Initialize Database

The database tables are created automatically. Simply starting the backend server for the first time will execute `db.js` which creates all the necessary tables (like `news_submissions`, `images`, `published_articles`, `newspaper_editions`, etc.).

### Step 7: Run the Application

**Start the Backend Server:**
In terminal 1:
```bash
cd backend
node server.js
```
*(The server will run on http://localhost:5000 and connect to MySQL).*

**Start the Frontend App:**
In terminal 2:
```bash
cd newsflow-frontend
npm run dev
```
*(The React application will usually open on http://localhost:5173).*

### Step 8: Using the Platform

1. **Submitting Content via WhatsApp**  
   - Users or reporters can send news text and images to the configured Twilio WhatsApp number.
   - The backend processes these incoming messages automatically.

2. **Admin Dashboard**  
   - Access the dashboard to review incoming WhatsApp submissions.
   - Admins can edit content, approve/publish articles, or archive them.

3. **Digital Article Cards & Newspaper Layout**  
   - **Digital Card:** Generate a mobile-friendly, branded digital article card with automatically sized images and a custom newspaper logo layout.
   - **Newspaper Print:** View the masonry Newspaper print layout, which organizes published articles into dense, multi-column print pages without gaps.

---

## 2. SUPPORTING FILES

- **backend/server.js**  
  Express backend with API routing, webhooks, and Twilio WhatsApp logic.

- **backend/db.js**  
  MySQL database connection logic and initialization commands.

- **newsflow-frontend/src/App.jsx**  
  React component setup and Vite App configuration.

- **backend/package.json**  
  Dependency list for Node.js modules (express, twilio, mysql2).

- **newsflow-frontend/package.json**  
  Dependency list for React modules (react-router-dom, qrcode.react, html2canvas, jspdf).

- **backend/.env**  
  Configuration file for environment keys and ports.

- **newsflow-frontend/src/pages/**  
  Contains core frontend views (such as `Newspaper.jsx` for print layouts or `AdminDashboard.jsx` for content moderation, `DigitalCard.jsx` for online reading).
