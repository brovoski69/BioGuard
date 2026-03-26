# 🦴 BioGuard — Virtual Joint Stress Simulator

<div align="center">

![BioGuard Banner](https://img.shields.io/badge/BioGuard-Joint%20Stress%20Simulator-00f5ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMGY1ZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJ2MjBNMiAxMmgyMCIvPjwvc3ZnPg==)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Know your joints. Protect your future.**

*A biomechanics simulation platform that calculates joint stress, predicts injury risk, and provides personalized recommendations.*

[Demo](#) · [Documentation](#-documentation) · [Report Bug](https://github.com/brovoski69/BioGuard/issues) · [Request Feature](https://github.com/brovoski69/BioGuard/issues)

</div>

---

## 📖 About

**BioGuard** is a virtual joint stress simulator that uses biomechanics formulas to calculate forces on joints (knee, spine, hip) based on posture, load, and user profile. It provides:

- 🎯 **Real-time joint force calculations** using physics-based formulas
- 📊 **Risk assessment scores** (0-100) for each joint
- 📈 **Long-term injury projections** (6 months to 10 years)
- 💡 **Personalized health recommendations** based on age, conditions, and activity
- 🔬 **12 preset activity scenarios** (desk work, running, lifting, etc.)

---

## ✨ Features

### 🧮 Physics Engine
- Calculates knee torque, spinal compression, and hip forces
- Adjusts thresholds based on age, BMI, and body type
- Factors in health conditions (arthritis, osteoporosis, injuries)

### 📋 Scenario Library
| Category | Scenarios |
|----------|-----------|
| **Work** | Sitting at Desk, Heavy Lifting, Prolonged Standing |
| **Exercise** | Running, Cycling, Squatting, Yoga |
| **Daily** | Climbing Stairs, Driving |
| **Lifestyle** | Walking in High Heels, Gardening |

### 🔐 Security
- Row Level Security (RLS) — users only access their own data
- Rate limiting (1 save per minute)
- Input validation on all operations
- Secure PDF storage with signed URLs

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Vanilla JavaScript (ES6 Classes) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Storage** | Supabase Storage |
| **Runtime** | Node.js 18+ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- A [Supabase](https://supabase.com) account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/brovoski69/BioGuard.git
cd BioGuard

# Install dependencies
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in order:
   - `backend/sql/01_create_tables.sql`
   - `backend/sql/02_row_level_security.sql`
   - `backend/sql/03_storage_setup.sql`
3. Copy your API keys to `.env`

📖 See [SUPABASE_SETUP_GUIDE.md](backend/SUPABASE_SETUP_GUIDE.md) for detailed instructions.

### Verify Installation

```bash
# Run connection test
npm test

# Run full system test
npm run test:full
```

---

## 📚 Documentation

### Backend Classes

| Class | Purpose |
|-------|---------|
| `SupabaseClient` | Singleton database connection |
| `AuthManager` | User authentication (signup, login, OAuth) |
| `ProfileManager` | User profile CRUD operations |
| `SessionManager` | Simulation session management |
| `ReportManager` | Report generation & PDF storage |
| `PhysicsEngine` | Biomechanics calculations |
| `ScenarioManager` | Preset activity scenarios |

### Usage Example

```javascript
import { PhysicsEngine, ScenarioManager } from './backend/index.js';

// Initialize with user profile
const physics = new PhysicsEngine({
    age: 35,
    weight: 75,
    height: 175,
    body_type: 'mesomorph',
    health_conditions: ['arthritis']
});

// Load a scenario
const scenarios = new ScenarioManager();
const { scenario } = scenarios.loadScenario('heavy_lifting');

// Calculate joint forces (20kg load)
const forces = physics.calculateJointForces(scenario.postureAngles, 20);
// → { knee: 374, spine: 602, hip: 354 }

// Get risk scores
const risks = physics.calculateRiskScores(forces);
// → { knee: 76, spine: 49, hip: 75, overall: 75 }

// Get recommendations
const recommendations = physics.getRecommendations(risks);
// → ["⚠️ HIGH RISK: Reduce activity intensity...", ...]
```

---

## 🧬 Biomechanics Formulas

The physics engine uses these calculations:

```
Knee Force = (bodyWeight × 0.5 × sin(kneeAngle)) + (load × momentArm)
Spine Force = (bodyWeight × 0.6 × sin(trunkAngle)) + load
Hip Force = (bodyWeight × cos(hipAngle) × 0.6) + (load × momentArm)
```

Risk scores are adjusted for:
- **Age** — thresholds decrease 0.8% per year after 25
- **BMI** — higher BMI lowers safe thresholds
- **Health conditions** — multipliers for arthritis, osteoporosis, etc.

---

## 📁 Project Structure

```
BioGuard/
├── backend/
│   ├── classes/
│   │   ├── AuthManager.js
│   │   ├── PhysicsEngine.js
│   │   ├── ProfileManager.js
│   │   ├── ReportManager.js
│   │   ├── ScenarioManager.js
│   │   ├── SessionManager.js
│   │   └── SupabaseClient.js
│   ├── sql/
│   │   ├── 01_create_tables.sql
│   │   ├── 02_row_level_security.sql
│   │   └── 03_storage_setup.sql
│   ├── test/
│   │   ├── connection-test.js
│   │   └── full-test.js
│   ├── index.js
│   ├── package.json
│   ├── README.md
│   └── SUPABASE_SETUP_GUIDE.md
├── Backend_Readme.md
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Biomechanics formulas adapted from sports science literature
- Built with [Supabase](https://supabase.com) — the open source Firebase alternative

---

<div align="center">

**Made with ❤️ for healthier joints**

[⬆ Back to Top](#-bioguard--virtual-joint-stress-simulator)

</div>
