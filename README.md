# 🔐 DigiWarr — Smart Warranty, Invoice & Policy Locker


> A single intelligent app to store, track, and get reminded about your invoices, warranties, and insurance policies — before it's too late.

DigiWarr solves a universal problem: people lose bills, forget warranty expiry dates, and miss insurance renewals. Upload any document or photo, and AI automatically extracts the key details, tracks expiry, and sends you timely reminders.

---

## 🚩 The Problem

- 📄 **Lost bills** — paper invoices get misplaced; digital ones get buried in emails
- ⏰ **Missed warranties** — products break just after expiry because no one was tracking
- 🛡️ **Forgotten policies** — insurance lapses silently, leaving people unprotected
- 🗂️ **No central place** — documents are scattered across WhatsApp, email, and drawers

---

## 💡 The Solution

DigiWarr gives you **one secure locker** for all your important documents:

| Document Type | What it tracks |
|---|---|
| 🧾 Invoice | Purchase date, amount, product details |
| 🛠️ Warranty | Purchase date, warranty period, expiry date |
| 🛡️ Insurance | Policy number, premium, renewal date |

Upload a photo or PDF → AI reads it → details auto-fill → you get reminded before anything expires.

---

## 🚀 Features

- **📤 Smart Upload** — Upload invoice/policy as a photo or PDF; AI extracts product name, date, and expiry automatically
- **🧠 AI Extraction** — Claude Vision / GPT-4o reads documents and returns structured data with no manual entry needed
- **📋 Unified Dashboard** — All your documents in one place, filterable by type, brand, and expiry status
- **⏰ Expiry Reminders** — Automated email alerts sent 30, 7, and 1 day(s) before expiry or renewal
- **🔍 Search & Filter** — Find any document instantly by name, brand, or category
- **🔐 Auth & Privacy** — Each user's vault is private and accessible only after login
- **📱 Mobile Friendly** — Fully responsive design, works on any device

---

## ⚙️ How It Works

```
User uploads photo/PDF
        ↓
File stored on Cloudinary
        ↓
File URL sent to Claude Vision API
        ↓
AI returns: { title, brand, type, purchaseDate, expiryDate }
        ↓
Data saved to PostgreSQL via Prisma
        ↓
Daily cron job checks expiry dates
        ↓
Reminder emails sent via Resend
---
## 🚀 Future Scope 

VaultDoc is just the beginning. The vision is to evolve it into a complete digital document and asset intelligence platform.

### 🔗 Insurance Policy Integration

* Store and manage all insurance policies in one place
* Track policy renewals with automated reminders
* Enable future support for policy purchase and renewal directly from the platform


### 📱 Mobile Application

* Dedicated Android and iOS apps for quick access
* Instant upload using camera
* Push notifications for real-time alerts


### 🔔 Smart Notification System

* Multi-channel alerts (Email, Push, SMS)
* Custom reminder settings based on user preference
* Priority alerts for high-value warranties and policies

### 🛒 Shopkeeper Ecosystem Expansion

* Allow shopkeepers to directly issue digital warranties at purchase
* Build a network where customers automatically receive warranties without uploading
* Introduce premium plans with extended warranty limits and analytics
