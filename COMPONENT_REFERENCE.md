# 🎯 **COMPONENT REFERENCE GUIDE**

## **Complete Reference for All MEV Detector Components**

---

## 📊 **MAIN APP COMPONENT**

### **App.js** (Updated - 330 lines)
**Purpose:** Main application shell with tab navigation

**Features:**
- ✅ 5 navigation tabs (Dashboard, Risk Map, Alerts, Learn, Rewards)
- ✅ Real-time data fetching (5-second intervals)
- ✅ Error handling & loading states
- ✅ Dynamic stats calculation
- ✅ Component composition

**State Management:**
```javascript
const [mevData, setMevData] = useState([])     // MEV attacks
const [loading, setLoading] = useState(false)  // Loading state
const [error, setError] = useState(null)       // Error messages
const [activeTab, setActiveTab] = useState('dashboard') // Current tab
```

**API Integration:**
- Endpoint: `GET http://localhost:3001/api/attacks`
- Update Interval: 5 seconds
- Error Handling: User-friendly messages

**Rendered Sections:**
1. **Header** - Branding, wallet connection, network status
2. **Navigation** - 5 tabs with icons
3. **Main Content** - Tab-specific content
4. **Footer** - Credit and attribution

---

## 🎨 **DASHBOARD COMPONENTS**

### **1. AIChat.js** (220 lines)
**Purpose:** Floating AI chatbot with MEV knowledge base

**Features:**
- ✅ Floating chat button (bottom-right corner)
- ✅ Expandable chat panel
- ✅ Message history
- ✅ MEV knowledge base Q&A
- ✅ Typing indicators
- ✅ Auto-scroll to latest message

**Topics Covered:**
```javascript
'what is mev'       → MEV definition
'sandwich attack'   → Attack explanation
'front run'         → Front-running details
'back run'          → Back-running details
'protect'           → Protection strategies
'gas price'         → Gas explanations
'slippage'          → Slippage details
'flashbots'         → Flashbots info
'default'           → General help
```

**Component Structure:**
```
AIChat
├── Floating Button (cyan, glowing)
│   ├── SVG Icon (chat bubble)
│   └── Pulse indicator
├── Chat Panel (when open)
│   ├── Header (with close button)
│   ├── Messages Area
│   │   ├── Bot messages (left-aligned)
│   │   ├── User messages (right-aligned)
│   │   └── Typing indicator
│   └── Input Area
│       ├── Text input
│       └── Send button
```

**Styling:**
- Dark background with glassmorphism
- Cyan accent colors
- Smooth animations
- Responsive sizing

**Usage:**
```jsx
<AIChat />
```

---

### **2. EmailAlerts.js** (170 lines)
**Purpose:** Email subscription form with customizable alert preferences

**Features:**
- ✅ Email input validation
- ✅ 5 alert type toggles
- ✅ Subscription confirmation
- ✅ Status switching (subscribe/manage)
- ✅ User feedback messages

**Alert Types:**
```javascript
alerts = {
  sandwich: true,    // Sandwich attacks
  frontrun: true,    // Front-running
  backrun: true,     // Back-running
  highGas: true,     // High gas wars
  highSlippage: true // High slippage
}
```

**Form Validation:**
- Email format check
- Required field validation
- Error messages

**Component Structure:**
```
EmailAlerts
├── Subscription Form (if not subscribed)
│   ├── Email Input
│   ├── Alert Type Checkboxes
│   │   ├── Sandwich Attacks
│   │   ├── Front-Running
│   │   ├── Back-Running
│   │   ├── High Gas Wars
│   │   └── High Slippage
│   ├── Error Message (conditional)
│   └── Subscribe Button
└── Success State (if subscribed)
    ├── Confirmation Message
    ├── Preference Display
    └── Update Button
```

**API Integration:**
- Endpoint: `POST http://localhost:3001/api/alerts/subscribe`
- Payload: `{ email, alerts }`
- Ready for EmailJS integration

**Styling:**
- Color-coded boxes (success/error)
- Labeled checkboxes
- Description text for each option

**Usage:**
```jsx
<EmailAlerts />
```

---

### **3. RiskHeatmap.js** (180 lines)
**Purpose:** 24-hour risk intensity visualization

**Features:**
- ✅ Grid of 24 hourly cells
- ✅ Color-coded risk levels
- ✅ Hover tooltips
- ✅ Attack count per hour
- ✅ Risk statistics
- ✅ Safe hours detection

**Risk Levels:**
```
0-20%   → Green (Low)
20-40%  → Yellow (Medium)
40-60%  → Orange (High)
60-100% → Red (Critical)
```

**Component Structure:**
```
RiskHeatmap
├── Title & Stats
│   ├── Average Risk
│   └── Peak Hour Info
├── Heatmap Grid (6 columns × 4 rows)
│   └── Hourly Risk Cells (with tooltips)
├── Legend (4 risk levels)
└── Statistics Cards
    ├── Total Attacks
    ├── Peak Risk
    └── Safe Hours
```

**Data Generation:**
```javascript
// Sample data (can be replaced with real data)
hours = [
  { hour: "23:00", risk: 45, attacks: 8 },
  { hour: "22:00", risk: 32, attacks: 5 },
  // ... 24 hours
]
```

**Tooltips:**
- Show on hover
- Display: Hour, Risk %, Attacks count
- Positioned above cell

**Styling:**
- Color-coded backgrounds
- Border colors match risk level
- Smooth hover transitions

**Usage:**
```jsx
<RiskHeatmap data={mevData} />
```

---

### **4. Education.js** (220 lines)
**Purpose:** Interactive MEV education hub with 4 learning sections

**Features:**
- ✅ 4 tab sections (Basics, Attacks, Protection, Advanced)
- ✅ Multiple explanations per section
- ✅ Quick tips section
- ✅ Interactive tab switching

**Content Sections:**

**📖 Basics:**
- What is MEV?
- Why does it matter?
- Who extracts MEV?

**⚔️ Attacks:**
- Sandwich Attack 🥪
- Front-Running ⚡
- Back-Running 📉

**🔐 Protection:**
- Flashbots Protect
- MEV-Resistant Routers
- Smart Slippage Settings

**🧪 Advanced:**
- Risk Scoring Algorithm
- Transaction Replay
- Multi-Chain MEV

**Component Structure:**
```
Education
├── Title & Description
├── Tab Navigation (4 buttons)
└── Content Area
    ├── Section Title
    └── Multiple Explanation Cards
        ├── Card Title
        └── Card Description
├── Quick Tips Section
    └── 5 actionable tips
```

**Tab Switching:**
```javascript
const [activeTab, setActiveTab] = useState('basics')
tabs = [
  { id: 'basics', label: 'Basics', icon: '📖' },
  { id: 'attacks', label: 'Attacks', icon: '⚔️' },
  { id: 'protection', label: 'Protection', icon: '🔐' },
  { id: 'advanced', label: 'Advanced', icon: '🧪' }
]
```

**Styling:**
- Hover effects on cards
- Smooth tab transitions
- Border highlights for active tabs

**Usage:**
```jsx
<Education />
```

---

### **5. Rewards.js** (240 lines)
**Purpose:** Gamification system with points, badges, and leaderboard

**Features:**
- ✅ User profile section
- ✅ Level progression tracking
- ✅ 6 collectible badges
- ✅ Points earning guide
- ✅ Top 5 leaderboard
- ✅ Rewards shop placeholder

**User Profile:**
```javascript
{
  points: 1250,
  level: 3,
  badges: [earned: 3, locked: 3],
  streak: 3
}
```

**Badges Available:**
```
1. First Strike ⚡
   → Detect your first MEV attack
   
2. Guardian 🛡️
   → Successfully protect 5 transactions
   
3. Analyst 📊
   → Run 10 transaction simulations
   
4. Researcher 🔬
   → Submit attack report
   
5. Legend 👑
   → Reach 5000 protection points
   
6. Speedrunner 🏃
   → Protected transaction in <15s
```

**Points System:**
```javascript
+10 pts  → Detect MEV attack
+25 pts  → Protect transaction
+5 pts   → Run simulation
+50 pts  → Daily login streak
```

**Component Structure:**
```
Rewards
├── Profile Section
│   ├── User Address
│   ├── Level Display
│   └── Progress Bar
├── Stats (3 cards)
│   ├── Total Points
│   ├── Badges Earned
│   └── Streak Days
├── Badges Grid (6 badges)
│   └── Earned/Locked indicators
├── Earning Guide
│   └── How to earn points
├── Leaderboard (Top 5)
│   └── Rank, Address, Points, Badges
└── Rewards Shop (Coming Soon)
```

**Leaderboard Data:**
```javascript
[
  { rank: 1, address: '0x5678...', points: 3200, badges: 5 },
  { rank: 2, address: '0x1234...', points: 2800, badges: 4 },
  { rank: 3, address: userAddress, points: 1250, badges: 3 },
  // ... etc
]
```

**Styling:**
- Gold for top rank
- Silver for 2nd
- Bronze for 3rd
- Highlight user's row
- Progress bar animation

**Usage:**
```jsx
<Rewards userAddress="0x742d3...8Qf2c" />
```

---

## 🎯 **DATA FLOW DIAGRAM**

```
API Data
   ↓
App.js (Fetches every 5s)
   ├→ Dashboard Tab
   │   └→ Cards + Stats
   ├→ Risk Map Tab
   │   └→ RiskHeatmap.js
   ├→ Alerts Tab
   │   └→ EmailAlerts.js
   ├→ Learn Tab
   │   └→ Education.js
   ├→ Rewards Tab
   │   └→ Rewards.js
   └→ AIChat.js (Always visible)
      └→ Knowledge Base Q&A
```

---

## 🎨 **STYLING SYSTEM**

### **Color Palette:**
```javascript
Tailwind Colors Used:
- Cyan (cyan-500, cyan-600, cyan-400) → Primary
- Blue (blue-600) → Secondary
- Green (green-400, green-500) → Success
- Orange (orange-400, orange-500) → Warning
- Red (red-400, red-500) → Danger
- Slate (slate-950 to slate-400) → Backgrounds & Text
- Yellow (yellow-400) → Accent
```

### **Spacing:**
```javascript
Padding: p-4, p-6, p-8 (standard)
Margins: m-4, mb-6 (standard)
Gaps: gap-2, gap-4, gap-6
Rounded: rounded-lg, rounded-xl, rounded-2xl
```

### **Animations:**
```css
@keyframes fadeIn { }      → Fade in effect
@keyframes slideUp { }     → Slide up effect
@keyframes pulse { }       → Pulsing effect
@keyframes glow { }        → Glowing text
@keyframes shimmer { }     → Shimmer effect
```

### **Responsive Breakpoints:**
```javascript
Mobile:  1 column
Tablet:  2 columns
Desktop: 3+ columns
```

---

## 🔌 **API CONTRACTS**

### **GET /api/attacks**
```javascript
Response: {
  success: boolean,
  data: [
    {
      hash: string,              // Transaction hash
      attackType: string,        // Type of attack
      riskScore: number,         // 0-100
      slippageLoss: number,      // USD amount
      gasPrice: string,          // Gwei
      timestamp: ISO string      // When detected
    }
  ]
}
```

### **POST /api/alerts/subscribe** (Future)
```javascript
Request: {
  email: string,
  alerts: {
    sandwich: boolean,
    frontrun: boolean,
    backrun: boolean,
    highGas: boolean,
    highSlippage: boolean
  }
}

Response: {
  success: boolean,
  message: string
}
```

---

## 🚀 **COMPONENT USAGE EXAMPLES**

### **In App.js:**
```jsx
// Import all components
import AIChat from './components/AIChat';
import EmailAlerts from './components/EmailAlerts';
import RiskHeatmap from './components/RiskHeatmap';
import Education from './components/Education';
import Rewards from './components/Rewards';

// Use in appropriate tabs
{activeTab === 'dashboard' && <Dashboard />}
{activeTab === 'heatmap' && <RiskHeatmap data={mevData} />}
{activeTab === 'alerts' && <EmailAlerts />}
{activeTab === 'education' && <Education />}
{activeTab === 'rewards' && <Rewards userAddress={userAddress} />}

// Always visible
<AIChat />
```

---

## 📚 **PROP INTERFACES**

```javascript
// RiskHeatmap Props
interface RiskHeatmapProps {
  data?: MEVAttack[]  // Optional MEV data
}

// Rewards Props
interface RewardsProps {
  userAddress?: string  // User's wallet address
}

// EmailAlerts Props
interface EmailAlertsProps {
  // No props required
}

// Education Props
interface EducationProps {
  // No props required
}

// AIChat Props
interface AIChatProps {
  // No props required
}
```

---

## 🔍 **COMPONENT SIZES**

| Component | Lines | Complexity | Reusability |
|-----------|-------|-----------|-------------|
| AIChat | 220 | Medium | High |
| EmailAlerts | 170 | Medium | High |
| RiskHeatmap | 180 | Medium | High |
| Education | 220 | Low | High |
| Rewards | 240 | Medium | High |

---

## ✅ **TESTING CHECKLIST**

- [ ] AIChat opens/closes smoothly
- [ ] All chat topics have responses
- [ ] EmailAlerts form validates
- [ ] RiskHeatmap displays all 24 hours
- [ ] Education tabs switch correctly
- [ ] Rewards show correct user data
- [ ] All tabs load without errors
- [ ] Responsive on mobile
- [ ] No console errors

---

## 🎓 **EXTENDING COMPONENTS**

### **Add New Chat Topics:**
```javascript
// In AIChat.js knowledgeBase
'your topic': 'Your response here'
```

### **Add New Alert Types:**
```javascript
// In EmailAlerts.js
{ key: 'newType', label: 'New Alert', desc: 'Description' }
```

### **Add New Badges:**
```javascript
// In Rewards.js
{ id: 7, name: 'New Badge', icon: '🎉', desc: 'Description', earned: false }
```

### **Add New Education Section:**
```javascript
// In Education.js
newSection: {
  title: 'Section Title',
  sections: [
    { title: 'Topic', content: 'Content' }
  ]
}
```

---

## 🎉 **SUMMARY**

You now have 5 powerful components:
- 💬 **AIChat** - Knowledge base assistant
- 📧 **EmailAlerts** - Subscription management
- 🔥 **RiskHeatmap** - Risk visualization
- 📚 **Education** - Learning hub
- 🏆 **Rewards** - Gamification system

All integrated into **App.js** with tab navigation!

**Ready to customize and deploy!** 🚀