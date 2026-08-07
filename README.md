<div align="center">

# 💰 Student Finance Dashboard

### *Track. Save. Split.*

A modern finance management platform built specifically for students to track expenses, manage budgets, achieve savings goals, analyze spending, and split group expenses in real time.

<br/>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

![Firestore](https://img.shields.io/badge/Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![React Hooks](https://img.shields.io/badge/React_Hooks-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Local Storage](https://img.shields.io/badge/Local_Storage-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![QR Code](https://img.shields.io/badge/QR_Code-qrcode.react-000000?style=for-the-badge)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)

![Lucide React](https://img.shields.io/badge/Lucide_React-000000?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Responsive](https://img.shields.io/badge/Responsive-Mobile%20%7C%20Tablet%20%7C%20Desktop-00C853?style=for-the-badge)
![License](https://img.shields.io/badge/License-Hackathon-blue?style=for-the-badge)

</div>

---
# 📄 Project Overview

Student Finance Dashboard helps students understand where their money goes by providing an easy-to-use finance management platform.

Unlike traditional finance applications built for professionals, this dashboard focuses on everyday student expenses such as food, transportation, subscriptions, shopping, and college activities.

The application enables users to:

* Track income and expenses
* Plan monthly budgets
* Set savings goals
* Monitor financial health
* Analyze spending habits
* Split group expenses with friends in real time

---

# 🧩 Abstract

Managing money is one of the biggest challenges students face. Small daily expenses often accumulate without proper tracking, making it difficult to save or stay within budget.

Student Finance Dashboard addresses this problem by providing a student-focused financial management platform that combines budgeting, analytics, savings planning, and collaborative bill splitting into one responsive web application.

Its signature **Split & Settle** feature allows users to create shared bills, invite friends through QR codes, calculate fair payments automatically, and track settlement status in real time using Firebase Firestore.

---

# ❗ Problem Statement

Many students receive pocket money, scholarships, internships, or part-time income but rarely maintain records of their spending.

### Key Issues

* No daily expense tracking
* Poor budgeting habits
* Difficulty achieving savings goals
* Lack of financial awareness
* Unable to analyze spending patterns
* Manual and confusing bill splitting among friends

### Impact

* Overspending before month-end
* Financial stress
* Poor saving discipline
* Difficulty understanding spending behavior
* Time wasted calculating shared expenses

---

# 💡 Proposed Solution

Student Finance Dashboard provides a simple yet powerful finance management system designed exclusively for students.

The application:

* Tracks income and expenses
* Categorizes transactions automatically
* Creates monthly budgets
* Calculates daily safe-to-spend amount
* Tracks multiple savings goals
* Generates interactive financial analytics
* Calculates Financial Health Score
* Splits group expenses using QR Codes
* Synchronizes settlement status in real time

---

# 🚀 Features

## 💵 Income & Expense Tracking

* Add, edit and delete transactions
* Income & Expense categories
* Smart keyword-based category suggestions
* Date filtering
* Transaction history
* Local Storage persistence

---

## 📊 Financial Analytics

Interactive dashboards using Chart.js

* Doughnut Chart (Category-wise Spending)
* Monthly Income vs Expense
* Spending Trend Analysis

---

## 🎯 Savings Goal Tracker

* Create multiple savings goals
* Monthly saving calculation
* Goal progress visualization
* Pace indicator
* Remaining savings calculation

---

## 📅 Budget Planner

* Category-wise monthly budgets
* Budget utilization tracking
* Color-coded budget indicators
* Daily Safe-to-Spend calculation

---

## ❤️ Financial Health Score

Automatically calculates a score (0–100) based on:

* Budget adherence
* Savings rate
* Spending consistency

Displays financial status such as:

* 🟢 Excellent
* 🟢 Good
* 🟡 Fair
* 🔴 Needs Attention

---

## ⭐ Split & Settle (Signature Feature)

A real-time collaborative bill splitting system powered by Firebase Firestore.

Supports:

### Even Split

* Equal bill distribution
* QR Code joining
* Live participant updates

### Itemized Split

* Item-wise bill selection
* GST / Service Charge distribution
* Automatic fair calculation

### Settlement

* Live payment status
* Paid / Pending indicators
* QR-based payment simulation
* Real-time synchronization

---

# 🏗️ System Architecture

```
Student
     │
     ▼
Dashboard
     │
     ├──────────────┐
     ▼              ▼
Transaction      Budget Planner
Management
     │              │
     └──────┬───────┘
            ▼
     Financial Analytics
            │
            ▼
 Financial Health Score
            │
            ▼
     Split & Settle Module
            │
            ▼
 Firebase Firestore
            │
            ▼
 QR Join → Participants → Finalize Split → Settlement Status
```

---

# ⚙️ Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS

## Charts

* Chart.js
* React Chart.js 2

## Database

* Firebase Firestore

## State Management

* React Hooks
* Local Storage

## QR Code

* qrcode.react

## Deployment

* Vercel / Netlify

---

# 📂 Project Structure

```text
src
│
├── components
├── pages
├── layouts
├── hooks
├── context
├── firebase
├── services
├── utils
├── assets
├── data
└── App.jsx
```

---

# 🧠 Core Modules

## 💰 Transaction Management

* CRUD Operations
* Smart categorization
* Expense filtering
* Local persistence

---

## 📈 Budget Planner

* Monthly budgets
* Budget alerts
* Daily spending recommendation

---

## 🎯 Savings Goals

* Goal creation
* Monthly target calculation
* Progress monitoring

---

## ❤️ Financial Health Engine

Calculates health score using

* Budget adherence (40%)
* Savings rate (40%)
* Spending consistency (20%)

---

## 🤝 Split & Settle

Supports

* QR-based joining
* Itemized bill selection
* Live participant updates
* Real-time payment tracking
* Firestore synchronization

---

# 🔄 System Workflow

```text
Add Transaction
        │
        ▼
Store in Local Storage
        │
        ▼
Update Dashboard
        │
        ▼
Charts + Budget + Savings
        │
        ▼
Calculate Financial Health Score
        │
        ▼
Create Split Bill
        │
        ▼
Generate QR Code
        │
        ▼
Participants Join
        │
        ▼
Finalize Split
        │
        ▼
Realtime Settlement Updates
```

---

# 📊 Financial Health Levels

| Score  | Status          | Indicator |
| ------ | --------------- | --------- |
| 0–25   | Needs Attention | 🔴        |
| 26–50  | Fair            | 🟡        |
| 51–75  | Good            | 🟢        |
| 76–100 | Excellent       | 🟢        |

---

# 📈 Impact

## For Students

* Better financial awareness
* Improved budgeting habits
* Easier savings planning
* Reduced unnecessary spending
* Faster bill splitting

### Friends & Groups

* Fair expense sharing
* No manual calculations
* Live settlement tracking

### Educational Value

* Encourages financial literacy
* Develops responsible spending habits
* Makes money management simple

---

# 💡 Innovation Highlights

* Student-focused finance dashboard
* Financial Health Score
* Daily Safe-to-Spend calculation
* Smart expense categorization
* Real-time QR-based bill splitting
* Live payment status tracking
* Interactive financial analytics
* Mobile-responsive experience

---

# 🧠 Challenges Faced

* Designing a student-friendly finance interface
* Managing Local Storage efficiently
* Creating accurate financial score calculations
* Real-time Firestore synchronization
* Building a responsive Split & Settle flow
* Optimizing charts for different screen sizes

---

# 📚 What We Learned

* React + Vite application architecture
* Tailwind CSS responsive design
* Firebase Firestore real-time database
* Chart.js data visualization
* QR code integration
* Local Storage management
* Financial analytics implementation
* Real-time collaborative application development

---

# 🏁 Conclusion

Student Finance Dashboard is a modern finance management platform built specifically for students. By combining expense tracking, budgeting, savings goals, financial analytics, and a real-time Split & Settle system, it simplifies personal finance management while promoting better financial habits. The application provides an intuitive, responsive, and collaborative experience that helps students make informed financial decisions and manage shared expenses effortlessly.