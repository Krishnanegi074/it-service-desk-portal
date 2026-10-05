# Corporate IT Service Desk AI Portal

An automated IT pre-triage web portal featuring an integrated conversational AI agent that collects technical diagnostics and routes structured incident tickets directly to engineers.

🌐 **Live Demo:** https://triage-portal-dun.vercel.app

---

## 🛠 Features

- **Automated Pre-Triage:** Captures device operating system, environment (office/home Wi-Fi), and exact error logs.
- **Incident Synthesizer:** Summarizes diagnostic context into structured tickets with priority tags.
- **ITSM Backend Pipeline:** Logs incident rows directly to a centralized spreadsheet for engineer review.
- **Enterprise Design:** Branded corporate interface with customized Voiceflow webchat integration.

## 🚀 Tech Stack

- **Frontend:** HTML5, CSS3 Variables, Responsive Design
- **Agent Runtime:** Voiceflow Webchat CDN SDK
- **Hosting & CI/CD:** Vercel

---

## 💻 Local Setup

1. Clone repository:
   git clone https://github.com/Krishnanegi074/it-service-desk-portal.git
   cd it-service-desk-portal

2. Deploy directly with Vercel CLI:
   npx vercel --prod
