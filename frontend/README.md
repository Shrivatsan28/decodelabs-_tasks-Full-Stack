# IoT InFo - Device Monitoring & Telemetry Dashboard

IoT InFo is a premium, fully responsive, dark-themed IoT Device Monitoring Dashboard frontend. It is built using HTML, CSS (Vanilla), Bootstrap 5, and vanilla JavaScript. 

It is a modular **Single Page Application (SPA)** that features a real-time diagnostic simulation engine to mimic hardware telemetries, alerts, and provisioning flows.

## 🚀 Key Features

- **Marketing Landing Page**: Featuring specs, pricing tables, interactive feature blocks, and direct sign-in CTAs.
- **Operator Authorization**: Secure authentication redirect flows (Demo Key: `admin@iotinfo.com` / `admin123`).
- **Telemetry Console Dashboard**: Live stat summaries (Online/Offline counters), average system telemetry line streams, status distribution charts, and recent warning feeds.
- **Fleet Provisioning Manager**: Searchable device list, hardware filter dropdowns, manual power reboot switches, decommission buttons, and modals to provision new tags.
- **Sensor Analytics**: Deep-dive Chart.js line graphs to display multi-sensor telemetries (temp, humidity, flow pressure, vibration, load) dynamically.
- **System Exceptions Logs**: Searchable warnings spreadsheet categorized by critical, warning, and info levels with acknowledgment actions.
- **Data Exporter Wizard**: Parameter controllers to simulate progress compiling and export sample mock CSV/PDF files.
- **Tuning Preferences**: Calibrate simulation cycle heartbeats (from 1s to 6s heartbeats), copy/regenerate programmatic API keys, and route notification emails.

## 🛠️ Stack & Libraries

- **Structure**: HTML5 Semantic Layout
- **Style**: Custom CSS Variables & Glassmorphism design tokens integrated with **Bootstrap 5.3.2**
- **Icons**: **Bootstrap Icons 1.11.3**
- **Graphics Canvas**: **Chart.js 4.4.1**
- **Logics**: JavaScript ES Modules (Modular SPA structure)

## 💻 Running Locally

To run the application locally, you just need a simple static web server. 

### Option A: Python HTTP Server (Built-in)
Run the following command in the project root:
```bash
python -m http.server 8080
```
Then navigate to `http://localhost:8080` in your web browser.

### Option B: Node.js (Live Server / Http Server)
If you have Node.js installed, you can use `npx`:
```bash
npx http-server
```
