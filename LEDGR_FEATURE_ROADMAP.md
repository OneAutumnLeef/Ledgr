# Ledgr 🌿 — Feature Roadmap & Enhancement Ideas

## ✅ Currently Implemented
- Statement parsing (SBI, IOB, PDF support)
- 16 merchant categories with auto-classification
- 5 full-featured dashboard tabs
- Dark/light mode with localStorage persistence
- Spending analytics & anomaly detection
- Budget tracking & savings goals
- Transaction filtering & CSV export

---

## 🚀 **High-Impact Features to Add**

### Tier 1: Core User Requests (2-4 hours each)

#### 1. **Monthly Spending Trends**
- **Value**: Understand if spending is increasing or decreasing month-over-month
- **Implementation**:
  - Store multiple statement imports with month/year metadata
  - Add "Trends" tab showing:
    - Line chart: Total spend by month
    - Category trends: How each category changes monthly
    - YoY comparison: Current month vs same month last year
  - Calculate % change and highlight anomalies
- **UI**: Simple line chart in new tab, or embed in Overview

#### 2. **Recurring Expense Detection**
- **Value**: Auto-flag subscriptions and standing orders users forget about
- **Implementation**:
  - Enhance existing subscription logic to detect recurring patterns
  - Show: Merchant name, frequency (weekly/bi-weekly/monthly), amount variation
  - Flag potential recurring charges not in subscription set: electricity, gym, etc.
  - Monthly cost projection: "You're spending ₹15,847/month on recurring charges"
- **UI**: Card in Insights tab with "Pause this subscription" action

#### 3. **Split Bill Calculator**
- **Value**: Quick math for shared expenses (eating out, cab rides, utilities)
- **Implementation**:
  - Floating action button or dedicated calculator interface
  - Input: amount, number of people, tip %
  - Output: Per-person cost, total with tip
  - Option to save as transaction tagged with "Split: [X people]"
- **UI**: Modal calculator with clear/reset buttons

#### 4. **Custom Category Creation**
- **Value**: Users can define "Business Expenses", "Medical", "Self-Care" etc.
- **Implementation**:
  - Settings panel: Create new category with name + color + icon
  - Store in localStorage alongside default 16
  - During merchant classification: "Apply manual category to SBI/IOB vendors"
  - Option to rename existing categories
- **UI**: Settings tab or gear icon in header

#### 5. **Spending Alerts & Notifications**
- **Value**: "You're 80% of the way to your budget for Groceries"
- **Implementation**:
  - Browser notifications (if user grants permission)
  - Toast alerts on transactions if they exceed:
    - Category budget (80%, 100% thresholds)
    - Single transaction value > ₹10k
  - Email digest option (requires backend)
- **UI**: Toggle in settings for notification preferences

---

### Tier 2: Good-to-Have (1-2 hours each)

#### 6. **Tax Category Tracking**
- **Value**: Prepare for tax filing season
- **Implementation**:
  - Mark transactions as "Tax-relevant" (HRA, medical, education, charity)
  - Summary card: "₹X deductible under Section 80C"
  - Export tax-year (Apr-Mar for India) filtered view
  - Calculate tax savings estimate (basic formula)
- **UI**: Checkbox on transaction detail, summary in Insights

#### 7. **Receipt Photo Upload**
- **Value**: Attach proof to transactions
- **Implementation**:
  - Add image input to transaction drawer
  - Store as blob in localStorage (or use IndexedDB for size)
  - Display thumbnail in transaction row
  - Show gallery modal on click
- **UI**: Camera icon in transaction drawer + preview

#### 8. **Wishlist/Savings Tracker**
- **Value**: "I want to save ₹50k for a laptop by June"
- **Implementation**:
  - Separate from budget goals: Savings Goals tab shows
  - Item name, target amount, current savings, target date
  - Progress ring (already in code, reuse)
  - Suggest monthly savings needed: "Save ₹8,333/month"
- **UI**: Wishlist card with add/edit/delete, progress ring

#### 9. **Spending Ratios & Health Indicators**
- **Value**: Quick financial health checks
- **Implementation**:
  - "50-30-20 Rule": Needs vs Wants vs Savings %
  - Display as gauge or progress bar
  - Highlight if any category exceeds 50% of income
  - Compare to industry averages (if available)
- **UI**: New card in Insights tab

#### 10. **Cash Flow Waterfall Chart**
- **Value**: See exactly where money comes in and goes out
- **Implementation**:
  - Waterfall chart: Start balance → Credits ↓ Debits ↓ End balance
  - Hover shows category breakdown
  - Helps identify where to cut spending
- **UI**: New chart in Analysis tab

---

### Tier 3: Advanced (3-6 hours each)

#### 11. **Monthly Report PDF Export**
- **Value**: Share spending report or save for records
- **Implementation**:
  - Generate PDF with: Top merchants, category breakdown, KPIs, charts as images
  - Include date range, account summary
  - Use `jsPDF` + `html2canvas` libraries
  - Option to email (requires backend)
- **UI**: "Export Report" button in each tab

#### 12. **Data Export to Google Sheets**
- **Value**: Users manage data externally
- **Implementation**:
  - OAuth with Google Sheets API
  - Create/update sheet with all transactions
  - Automatically sync on new import
  - Users can pivot, analyze in Sheets
- **UI**: "Sync to Google Sheets" in settings

#### 13. **Cloud Sync (Firebase)**
- **Value**: Keep data synced across devices
- **Implementation**:
  - Firebase Firestore for transaction storage
  - Auth with Google/email
  - Encrypt sensitive data client-side before upload
  - Manual backup/restore UI
- **UI**: Login modal, Cloud icon in header

#### 14. **Spending Heatmap Calendar**
- **Value**: See spending patterns by day of week/month
- **Implementation**:
  - GitHub-style heatmap: Darker = more spending
  - Filter by category
  - Hover shows ₹ amount
  - Identify spending clusters (e.g., Mondays = food?)
- **UI**: New chart in Analysis tab

#### 15. **Simple Budget Forecasting**
- **Value**: "At this rate, you'll spend ₹2,15,000 by year-end"
- **Implementation**:
  - Linear projection: Current month burn rate × remaining months
  - Account for seasonal variations
  - Suggest cost-cutting targets
  - Compare to previous years
- **UI**: Card in Budget tab

---

## 🎯 **Quick Wins** (15-30 min each)

- **Copy Button on KPIs**: Let users copy formatted amounts (e.g., "₹85,234.50")
- **Transaction Search**: Full-text search in Transactions tab (already exists, but improve UX)
- **Dark Mode Per-Tab Memory**: Remember active tab when switching themes
- **Mobile: Slide-up Amount Slider**: Better UX on mobile for amount range filter
- **Keyboard Shortcuts**: Cmd/Ctrl+K for command palette, Cmd+E for export
- **Print Friendly View**: Add print styles so charts/tables look good on paper
- **Share Transaction**: Generate shareable link with merchant name & amount (anonymized)
- **Data size indicator**: "You're using X KB of local storage (Y% available)"

---

## 🔒 **Security & Privacy Enhancements**

- **Session Timeout**: Auto-clear sensitive data after 30 mins of inactivity
- **Export Encryption**: Protect CSV exports with password
- **Incognito Mode Check**: Warn users if browsing in private window (data lost on close)
- **Payment Method Masking**: Hide last 4 digits of cards in transaction list
- **Audit Log**: Show when data was last modified/exported

---

## 📊 **Analytics Deep-Dives**

- **Merchant ROI**: "How much value did you get from this ₹942 RunPod spend?"
- **Spend Velocity**: Compare current week → last week → last month growth
- **Category Correlation**: "You spend more on Zomato after late-night coding sessions"
- **Peer Comparison**: "Indian average food expense is ₹8,500/month (optional anonymized data)"
- **Seasonal Breakdown**: Q1 vs Q2 vs Q3 vs Q4 spending patterns

---

## 🚀 **Advanced Features (Requires Backend)**

- **Recurring Payment Management**: Cancel/pause subscriptions directly from Ledgr
- **Price Alerts**: Notify when favorite cafes raise prices
- **Transaction Tagging**: #lunch #shopping #medical for custom analysis
- **Habit Tracking**: Spending changes correlate with habit changes (exercise, sleep)
- **Open Banking Integration**: Real-time bank sync (requires RBI OpenBanking approval)

---

## 🎨 **UI/UX Enhancements**

- **Dashboard Widgets**: Customizable home screen with drag-drop cards
- **Dark Mode Variants**: True black vs soft dark for OLED preservation
- **Animation Settings**: Reduce motion for accessibility
- **Sidebar Navigation**: Left drawer with quick filters
- **Fullscreen Charts**: Click chart to expand in modal
- **Search History**: Recent searches in transaction filter

---

## 📱 **Mobile-Specific Improvements**

- **Native App**: React Native version for iOS/Android
- **Bottom Sheet Drawer**: More natural on mobile than side drawer
- **Quick Snap**: Take photo of receipt, auto-extract amount
- **Biometric Lock**: Fingerprint to unlock app
- **Widget**: iOS/Android home screen widget showing daily spend

---

## 🌐 **Regional Localization**

- **Multiple Languages**: Hindi, Tamil, Kannada, Telugu support
- **Regional Banks**: Add Axis, Kotak, HDFC, IndusInd parsers
- **Local Merchants**: Better recognition of regional chains (Swiggy vs local restaurants)
- **Currency Options**: Support USD, EUR for NRIs
- **Tax Rules by State**: GST, property tax, state-specific deductions

---

## 🎓 **Learning Features**

- **Money Tips**: Contextual lessons: "How to reduce food spend", "Emergency fund guide"
- **Spending Goals Gamification**: Badges for achieving budgets, streaks
- **Financial Literacy**: Modal popups: "What is a deductible expense?"
- **Comparison Benchmarks**: "People who track spending save 23% more"

---

## ⭐ **Your Top 5 Recommendations**

Based on user experience impact, here are the **most impactful features to build next**:

1. ✅ **PDF Support** — Done! (Just completed)
2. **Monthly Trends Tab** — See if spending is improving (2-3 hrs)
3. **Custom Categories** — Let users organize their way (1-2 hrs)
4. **Recurring Expense Detection** — Find forgotten subscriptions (2 hrs)
5. **Spending Alerts** — Browser notifications on budget overages (1.5 hrs)

---

## 🛠 **Development Notes**

- **State Management**: Currently using React hooks + localStorage. For cloud sync, consider Redux + Firebase.
- **Performance**: At 130+ transactions, might need virtualization for transaction table.
- **Testing**: Add Jest tests for parsing logic before adding major features.
- **Accessibility**: Add ARIA labels, keyboard nav for all new features.
- **Mobile**: Test all new features on iPhone/Android browsers.

---

**Questions?** Build time estimates are rough and assume your current skill level. Start with Tier 1 for maximum user value per hour invested.
