import React, { useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { UploadCloud, AlertCircle, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, Calendar, Filter, Download, Flame, Search, AlertTriangle, ArrowRightLeft, CreditCard, ChevronRight, CheckCircle2, Copy, BarChart3, PieChart as PieChartIcon, AlignLeft, Tags, Wallet, Target, Repeat2, ArrowDownCircle, Banknote, HelpCircle, FileText, Smartphone, Tv, Zap, Train, Coffee, ShoppingCart, Landmark, Plane, Users, Plus, X, BrainCircuit, LayoutGrid, ChartColumnBig, WalletCards, Gamepad2, ShoppingBag, TrendingDown, House, BusFront, CircleDollarSign, Cpu, Dumbbell, IndianRupee, Pencil, PiggyBank, ReceiptText, RefreshCcw, ShoppingBasket, Sparkles, Target as TargetIcon, Users as UsersIcon, UtensilsCrossed, Upload } from "lucide-react";
import demoSeed from "../demo_seed.json";
import merchantCatalog from "../merchant_catalog.json";
import "./styles.css";
import { trackVisit } from "./lib/visitTracker.js";

void trackVisit();

const DEMO_SEED = demoSeed;
const MERCHANT_CATALOG = merchantCatalog;
const LEDGR_ICON = `${import.meta.env.BASE_URL}favicon.png`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const STORAGE_KEYS = {
  transactions: "ledgr-transactions",
  budgets: "ledgr-budgets",
  goals: "ledgr-goals",
  merchantOverrides: "ledgr-merchant-overrides",
  reviewRows: "ledgr-review-rows",
  splitGroups: "ledgr-split-groups",
};

const SIDEBAR_SECTIONS = [
  {
    title: "General",
    items: [
      { id: "overview",       label: "Dashboard",     icon: LayoutGrid    },
      { id: "transactions",   label: "Transactions",  icon: WalletCards   },
      { id: "subscriptions",  label: "Subscriptions", icon: RefreshCcw    },
      { id: "budget",         label: "Budgets & Goals", icon: Target      },
    ]
  },
  {
    title: "Tools",
    items: [
      { id: "analysis",  label: "Analytics", icon: ChartColumnBig },
      { id: "insights",  label: "Insights",  icon: BrainCircuit   },
      { id: "splits",    label: "Split Bills", icon: UsersIcon    },
    ]
  },
];

const TAB_ITEMS = SIDEBAR_SECTIONS.flatMap(s => s.items);

const BANK_META = {
  SBI: {
    color: "#3B82F6",
    badge: "bg-blue-500/15 text-blue-200 ring-blue-400/20",
    card: "border border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  IOB: {
    color: "#10B981",
    badge: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/20",
    card: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  CANARA: {
    color: "#F59E0B",
    badge: "bg-amber-500/15 text-amber-200 ring-amber-400/20",
    card: "border border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  DEFAULT: {
    color: "#38BDF8",
    badge: "bg-sky-500/15 text-sky-200 ring-sky-400/20",
    card: "border border-sky-500/30 bg-sky-500/10 text-sky-400",
  },
};

const CATEGORY_META = {
  "Food & Dining": { icon: UtensilsCrossed, color: "#F97316" },
  Groceries: { icon: ShoppingBasket, color: "#22C55E" },
  Transport: { icon: BusFront, color: "#F59E0B" },
  "Entertainment / Gaming": { icon: Gamepad2, color: "#8B5CF6" },
  "Tech / Cloud / Dev Tools": { icon: Cpu, color: "#3B82F6" },
  "Shopping / Electronics": { icon: ShoppingBag, color: "#E879F9" },
  "Health & Pharmacy": { icon: Sparkles, color: "#10B981" },
  "Finance & Insurance": { icon: Landmark, color: "#F59E0B" },
  "Education & Ed-Tech": { icon: BrainCircuit, color: "#7C3AED" },
  "Government & Banking": { icon: ReceiptText, color: "#1D4ED8" },
  "ATM & Cash": { icon: IndianRupee, color: "#6B7280" },
  Rent: { icon: House, color: "#FB7185" },
  "Investment / SIP": { icon: Landmark, color: "#14B8A6" },
  Utilities: { icon: Zap, color: "#FACC15" },
  "Sports & Recreation": { icon: Dumbbell, color: "#10B981" },
  "P2P / Split": { icon: Users, color: "#94A3B8" },
  "Self Transfer": { icon: Repeat2, color: "#64748B" },
  Cashback: { icon: Sparkles, color: "#C8F135" },
  "Interest Income": { icon: TrendingUp, color: "#84CC16" },
  Income: { icon: CircleDollarSign, color: "#38BDF8" },
  Other: { icon: ReceiptText, color: "#A1A1AA" },
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_META);
const CATALOG_CATEGORY_MAP = {
  "Food Delivery": "Food & Dining",
  "Restaurants & CafÃ©s": "Food & Dining",
  "Groceries & Supermarkets": "Groceries",
  "E-Commerce & Shopping": "Shopping / Electronics",
  "Transport & Travel": "Transport",
  "Subscriptions & Entertainment": "Entertainment / Gaming",
  "Tech, Cloud & Dev Tools": "Tech / Cloud / Dev Tools",
  "Utilities & Telecom": "Utilities",
  "Health & Pharmacy": "Health & Pharmacy",
  "Finance, Payments & Insurance": "Finance & Insurance",
  "Education & Ed-Tech": "Education & Ed-Tech",
  "Sports & Recreation": "Sports & Recreation",
  "Rent & Housing": "Rent",
  "Government & Banking": "Government & Banking",
  "ATM & Cash": "ATM & Cash",
  "P2P & Transfers": "P2P / Split",
};

function cleanCatalogName(value) {
  return (value || "").replace(/CafÃ©/g, "Cafe");
}

function normalizeLookupValue(value) {
  return cleanSpaces(value).toUpperCase().replace(/[^A-Z0-9]+/g, "");
}

const CATALOG_MERCHANTS = [];
const catalogMerchantNames = new Set();
for (const section of MERCHANT_CATALOG) {
  const category = CATALOG_CATEGORY_MAP[section.cat];
  if (!category) continue;
  for (const merchant of section.merchants || []) {
    const name = cleanCatalogName(merchant.name);
    if (catalogMerchantNames.has(name)) continue;
    catalogMerchantNames.add(name);
    CATALOG_MERCHANTS.push({ name, category });
  }
}

const CATALOG_ALIAS_ENTRIES = MERCHANT_CATALOG.flatMap((section) => {
  const category = CATALOG_CATEGORY_MAP[section.cat];
  if (!category || category === "P2P / Split") return [];
  return (section.merchants || []).flatMap((merchant) =>
    (merchant.keys || []).map((key) => ({
      category,
      name: cleanCatalogName(merchant.name),
      key: normalizeLookupValue(key),
    }))
  );
})
  .filter((entry) =>
    entry.key.length >= 4 &&
    !entry.key.startsWith("UPI") &&
    !["PAIDVIAUPI", "CHQ", "CLG", "NEFT", "RTGS", "IMPS", "ATW", "ATMWDL", "ATMPURCH", "CASHWDL", "ATMCASH", "CDM"].includes(entry.key)
  )
  .sort((left, right) => right.key.length - left.key.length);

function buildMerchantSet(category, extras = []) {
  return new Set([...CATALOG_MERCHANTS.filter((merchant) => merchant.category === category).map((merchant) => merchant.name), ...extras]);
}

const FOOD_MERCHANTS = buildMerchantSet("Food & Dining", ["Mealmint", "Quickdish", "Quickdish Dine", "Crisp Kitchen", "Patty House", "Ember Table", "South Table", "Crumb Theory", "Velvet Sweets", "Spice Harbor", "Cafe Stitch"]);
const GROCERY_MERCHANTS = buildMerchantSet("Groceries", ["Ratnadeep Supermarket", "Pantrynow", "Pantry Circle", "Local Pantry", "Dhanu Market", "Peekay Stores"]);
const TRANSPORT_MERCHANTS = buildMerchantSet("Transport", ["Routeloop", "Citycab", "Ride Ray", "Railconnect", "Tripnest"]);
const ENTERTAINMENT_MERCHANTS = buildMerchantSet("Entertainment / Gaming", ["Nova Forge", "Ticketmint", "Neon Nights", "Cinewave", "Viewcast", "Pulse Fm", "Orchard Services", "Discord"]);
const TECH_MERCHANTS = buildMerchantSet("Tech / Cloud / Dev Tools", ["Computedock", "Nimbus Cloud", "Velocity Stack", "Kernel Forge", "OpenAI", "Google"]);
const SHOPPING_MERCHANTS = buildMerchantSet("Shopping / Electronics", ["Audio Haven", "Cartroot", "Shoporbit"]);
const HEALTH_MERCHANTS = buildMerchantSet("Health & Pharmacy");
const FINANCE_MERCHANTS = buildMerchantSet("Finance & Insurance");
const EDUCATION_MERCHANTS = buildMerchantSet("Education & Ed-Tech");
const GOVERNMENT_MERCHANTS = buildMerchantSet("Government & Banking");
const ATM_CASH_MERCHANTS = buildMerchantSet("ATM & Cash");
const SPORTS_MERCHANTS = buildMerchantSet("Sports & Recreation", ["Apex Turf", "Cedar Courts"]);
const UTILITY_MERCHANTS = buildMerchantSet("Utilities", ["Water Board", "Airwave", "Flowtel", "Gridone", "Aquaboard"]);
const RENT_MERCHANTS = buildMerchantSet("Rent", ["Harbor House Living"]);
const CASHBACK_MERCHANTS = new Set(["BHIM Cashback", "Reward Loop"]);
const INVESTMENT_MERCHANTS = new Set(["Atal Pension Yojana", "Futurenest Sip", "APY / NPS (Atal Pension)"]);
const SUBSCRIPTION_MERCHANTS = new Set([
  "Spotify",
  "Netflix",
  "Apple Services",
  "Google Cloud",
  "RunPod",
  "Atal Pension Yojana",
  "Amazon Prime",
  "Disney+ Hotstar",
  "SonyLIV",
  "Zee5",
  "Jio Cinema",
  "Pulse Fm",
  "Cinewave",
  "Orchard Services",
  "Nimbus Cloud",
  "Computedock",
  "Futurenest Sip",
  "Velocity Stack",
]);
const SELF_TRANSFER_HINT = /DERAJ YO|DERAJ YOJITH|DERAJYOJITH|SELF LEDGR|OWN BRIDGE|OWN ACCOUNT/i;

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Fira+Code:wght@400;500&display=swap');

  :root {
    --bg: #0D0D17;
    --surface: #13131A;
    --surface-strong: #1A1A24;
    --surface-soft: #0D0D17;
    --accent: #C8F22E;
    --secondary: #13131A;
    --danger: #EF4444;
    --primary: #FAFAFA;
    --text: #FAFAFA;
    --text-80: rgba(250, 250, 250, 0.8);
    --text-75: rgba(250, 250, 250, 0.75);
    --text-70: rgba(250, 250, 250, 0.7);
    --text-65: rgba(250, 250, 250, 0.65);
    --text-60: rgba(250, 250, 250, 0.6);
    --text-50: rgba(250, 250, 250, 0.5);
    --text-45: rgba(250, 250, 250, 0.45);
    --text-40: rgba(250, 250, 250, 0.4);
    --muted: #A1A1AA;
    --line: rgba(255, 255, 255, 0.08);
    --line-10: rgba(255, 255, 255, 0.08);
    --line-5: rgba(255, 255, 255, 0.04);
    --surface-5: rgba(255, 255, 255, 0.03);
    --glow: rgba(200, 242, 46, 0.18);
    --shadow: 0 1px 3px rgba(0,0,0,0.2);
    --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.25);
    --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.3);
  }

  body {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Roboto', sans-serif;
  }
  body::before { display: none; }
  
  .ledgr-display { font-family: 'Inter', sans-serif; font-weight: 700; letter-spacing: -0.01em; }
  .ledgr-mono { font-family: 'Fira Code', monospace; font-variant-numeric: tabular-nums; }

  .glass-card {
    position: relative;
    border: 1px solid var(--line-10);
    background: var(--surface);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);
    transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .glass-card:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-2px);
  }
  .glass-card::before { display: none; }
  .soft-grid { display: none; }
  .range-input { accent-color: var(--accent); }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--surface-strong); border-radius: 0.5rem; }
  ::-webkit-scrollbar-thumb:hover { background: var(--line-10); }
`;

function storageGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local storage quota issues for this offline app.
  }
}

function toIndianAmount(value) {
  return Number(value || 0);
}

function formatCurrency(value, minimumFractionDigits = 2) {
  const number = Number(value || 0);
  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  })}`;
}

function formatAmountDisplay(value) {
  const absolute = Math.abs(Number(value || 0));
  return `${value < 0 ? "-" : ""}${formatCurrency(absolute)}`;
}

function parseStatementDate(value) {
  if (!value) return new Date(NaN);
  if (value.includes("/")) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  const [day, monthLabel, yearLabel] = value.split("-");
  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].findIndex(
    (item) => item.toLowerCase() === monthLabel.toLowerCase()
  );
  return new Date(Number(yearLabel) + 2000, monthIndex, Number(day), 12);
}

function toDateKey(value) {
  const date = value instanceof Date ? value : parseStatementDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value) {
  const date = parseStatementDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

function formatLongDate(value) {
  const date = parseStatementDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function titleCase(value) {
  return (value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function cleanSpaces(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeMerchant(rawMerchant, rawDescription) {
  const candidate = cleanSpaces(rawMerchant || rawDescription || "")
    .replace(/^[/-]+|[/-]+$/g, "")
    .replace(/(?:paid\s+via|paymentto|payment\s+f|execution|upiintent|verified|refund\s+fo|no\s+remark|mandateex|paid|upi)(?:\b|$)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const rules = [
    [/APPLE ME|APPLE MEDIA SE|APPLESERVI/i, "Apple Services"],
    [/ORCHARD SERV|ORCHARDSVC/i, "Orchard Services"],
    [/ZOMATOFOOD|ZOMATO LIMITED|ZOMATO(?:\b|$)|ETERNAL\s+LIMITE|ZOMATO GOLD/i, "Zomato"],
    [/MEALMINT|MEALMINTAPP/i, "Mealmint"],
    [/QUICKDISH DINE/i, "Quickdish Dine"],
    [/QUICKDISH/i, "Quickdish"],
    [/MC DONALDS|MCDONALDS|MCDONALDS HARD/i, "McDonald's"],
    [/PATTY HOUSE/i, "Patty House"],
    [/NETFLIX/i, "Netflix"],
    [/CINEWAVE/i, "Cinewave"],
    [/SPRINTPR|SPRINTPRO/i, "SprintPro"],
    [/VELOCITY STACK/i, "Velocity Stack"],
    [/TURF TOW|TURFTOWNTE/i, "Turf Town"],
    [/APEX TURF/i, "Apex Turf"],
    [/WESLEY T|WESLEYTURF/i, "Wesley Turf"],
    [/CEDAR COURTS/i, "Cedar Courts"],
    [/RUNPOD/i, "RunPod"],
    [/COMPUTEDOCK/i, "Computedock"],
    [/KRISH CO LIVIN/i, "Krish Co Living"],
    [/HARBOR HOUSE LIVING/i, "Harbor House Living"],
    [/HEADPHONE ZONE/i, "Headphone Zone"],
    [/AUDIO HAVEN/i, "Audio Haven"],
    [/NASSAA ENTERTA/i, "Nassaa Entertainment"],
    [/NEON NIGHTS/i, "Neon Nights"],
    [/HISTOGEN/i, "Histogen"],
    [/KERNEL FORGE/i, "Kernel Forge"],
    [/SHUBH SA|SHUBH SAGAR/i, "Shubh Sagar"],
    [/SPICE HARBOR/i, "Spice Harbor"],
    [/STICK IT UP/i, "Stick It Up"],
    [/CAFE STITCH/i, "Cafe Stitch"],
    [/BELLA SWEETS/i, "Bella Sweets"],
    [/VELVET SWEETS/i, "Velvet Sweets"],
    [/BREAD FANTASY/i, "Bread Fantasy"],
    [/CRUMB THEORY/i, "Crumb Theory"],
    [/NEW UDUPI GRAN/i, "New Udupi Grand"],
    [/SOUTH TABLE/i, "South Table"],
    [/LA CASA/i, "La Casa"],
    [/EMBER TABLE/i, "Ember Table"],
    [/FRESH ZONE/i, "Fresh Zone"],
    [/PANTRY CIRCLE/i, "Pantry Circle"],
    [/GOOGLE C|GOOGLE CLOUD|GOOGLECLOU/i, "Google Cloud"],
    [/GOOGLE IN/i, "Google"],
    [/NIMBUS CLOUD|NIMBUSREF/i, "Nimbus Cloud"],
    [/REDBUS/i, "RedBus"],
    [/ROUTELOOP/i, "Routeloop"],
    [/RIOT GAMES/i, "Riot Games"],
    [/NOVA FORGE/i, "Nova Forge"],
    [/BIGTRE+E?/i, "BookMyShow"],
    [/FLIPKART PAYME/i, "Flipkart"],
    [/CARTROOT/i, "Cartroot"],
    [/SPOTIFY/i, "Spotify"],
    [/PULSE FM|PULSEFM/i, "Pulse Fm"],
    [/YOUTUBE/i, "YouTube"],
    [/OPENAI LLC|OPENAI/i, "OpenAI"],
    [/DISCORD/i, "Discord"],
    [/JIO/i, "Jio"],
    [/DHANU/i, "Dhanu Market"],
    [/PEEKAY CO/i, "Peekay Stores"],
    [/SMS CHARGES/i, "SMS Charges"],
    [/DEBIT CARD ANNUAL/i, "Debit Card Annual Charges"],
    [/DISBURSEMENT TO CASA/i, "Loan Disbursement"],
    [/PMSBY/i, "PMSBY Insurance"],
    [/VIEWCAST/i, "Viewcast"],
    [/NPCI BHIM|BHIMCASHB/i, "BHIM Cashback"],
    [/REWARD LOOP/i, "Reward Loop"],
    [/INTEREST CREDIT|SBINT/i, "Interest Credit"],
    [/SAVINGS YIELD/i, "Savings Yield"],
    [/APY\/SI/i, "Atal Pension Yojana"],
    [/FNSIP|FUTURENEST SIP/i, "Futurenest Sip"],
    [/RATNADEEP SUPE/i, "Ratnadeep Supermarket"],
    [/LOCAL PANTRY/i, "Local Pantry"],
    [/PANTRYNOW/i, "Pantrynow"],
  ];

  for (const [pattern, value] of rules) {
    if (pattern.test(candidate) || pattern.test(rawDescription || "")) return value;
  }

  const lookupCandidate = normalizeLookupValue(candidate);
  const lookupDescription = normalizeLookupValue(rawDescription || "");
  const catalogMatch = CATALOG_ALIAS_ENTRIES.find(
    (entry) => (lookupCandidate && lookupCandidate.includes(entry.key)) || (lookupDescription && lookupDescription.includes(entry.key))
  );
  if (catalogMatch) return catalogMatch.name;

  return candidate ? titleCase(candidate) : "Unclassified";
}

function extractRawMerchant(bank, rawDescription) {
  const clean = cleanSpaces(rawDescription);
  if (/INTEREST CREDIT|SAVINGS YIELD|SBINT/i.test(clean)) return /SAVINGS YIELD/i.test(clean) ? "Savings Yield" : "Interest Credit";
  if (/APY\/SI|FNSIP|FUTURENEST SIP/i.test(clean)) return /FNSIP|FUTURENEST SIP/i.test(clean) ? "Futurenest Sip" : "Atal Pension Yojana";
  if (/POS ATM PURCH/i.test(clean)) {
    return clean
      .replace(/^POS ATM PURCH\s*/i, "")
      .replace(/^(?:OTHPG|OTHPOS)\s*\d*/i, "")
      .replace(/\+\d+.*$/i, "")
      .replace(/^\d+/i, "")
      .trim();
  }
  if (!clean.startsWith("UPI/")) return clean;
  const parts = clean.split("/").map((item) => cleanSpaces(item));
  if (bank === "SBI" || bank === "CANARA") return parts[3] || clean;
  if (parts[2] && /^(CR|DR)$/i.test(parts[2])) return parts[3] || clean;
  return parts[2] || clean;
}

function buildMerchantKey(value) {
  return cleanSpaces(value).toUpperCase().replace(/[^A-Z0-9]+/g, "-");
}

function isLikelyPerson(name) {
  if (!name || name === "Unclassified") return false;
  const knownMerchants = new Set([
    ...FOOD_MERCHANTS,
    ...GROCERY_MERCHANTS,
    ...TRANSPORT_MERCHANTS,
    ...ENTERTAINMENT_MERCHANTS,
    ...TECH_MERCHANTS,
    ...SHOPPING_MERCHANTS,
    ...HEALTH_MERCHANTS,
    ...FINANCE_MERCHANTS,
    ...EDUCATION_MERCHANTS,
    ...GOVERNMENT_MERCHANTS,
    ...ATM_CASH_MERCHANTS,
    ...SPORTS_MERCHANTS,
    ...UTILITY_MERCHANTS,
    ...RENT_MERCHANTS,
    ...CASHBACK_MERCHANTS,
    ...INVESTMENT_MERCHANTS,
    "Interest Credit",
    "Savings Yield",
  ]);
  if (knownMerchants.has(name)) return false;
  return /^[A-Za-z .]+$/.test(name);
}

function deriveCategory({ merchant, rawDescription, debit, credit, isSelfTransfer }) {
  if (isSelfTransfer) return "Self Transfer";
  if (/INTEREST CREDIT|SAVINGS YIELD|SBINT/i.test(rawDescription) || ["Interest Credit", "Savings Yield"].includes(merchant)) return "Interest Income";
  if (/NPCI BHIM|BHIMCASHB|REWARD LOOP/i.test(rawDescription) || CASHBACK_MERCHANTS.has(merchant)) return "Cashback";
  if (/APY\/SI|\bRD\b|FNSIP|FUTURENEST SIP|PMSBY|NPSCRA|PFRDA|ATALPENSION/i.test(rawDescription) || INVESTMENT_MERCHANTS.has(merchant) || merchant === "PMSBY Insurance") return "Investment / SIP";
  if (/KRISH CO LIVIN|HARBOR HOUSE LIVING/i.test(rawDescription) || RENT_MERCHANTS.has(merchant)) return "Rent";
  if (/DISBURSEMENT TO CASA/i.test(rawDescription) || merchant === "Loan Disbursement") return "Income";
  if (SPORTS_MERCHANTS.has(merchant)) return "Sports & Recreation";
  if (FOOD_MERCHANTS.has(merchant)) return "Food & Dining";
  if (GROCERY_MERCHANTS.has(merchant)) return "Groceries";
  if (TRANSPORT_MERCHANTS.has(merchant)) return "Transport";
  if (ENTERTAINMENT_MERCHANTS.has(merchant)) return "Entertainment / Gaming";
  if (TECH_MERCHANTS.has(merchant)) return "Tech / Cloud / Dev Tools";
  if (SHOPPING_MERCHANTS.has(merchant)) return "Shopping / Electronics";
  if (HEALTH_MERCHANTS.has(merchant)) return "Health & Pharmacy";
  if (FINANCE_MERCHANTS.has(merchant)) return "Finance & Insurance";
  if (EDUCATION_MERCHANTS.has(merchant)) return "Education & Ed-Tech";
  if (GOVERNMENT_MERCHANTS.has(merchant)) return "Government & Banking";
  if (ATM_CASH_MERCHANTS.has(merchant)) return "ATM & Cash";
  if (UTILITY_MERCHANTS.has(merchant)) return "Utilities";
  if (credit >= 2000 && (!isLikelyPerson(merchant) === false || merchant === "Unclassified" || /rent|salary|stipend|income/i.test(rawDescription))) return "Income";
  if (credit > 0 && isLikelyPerson(merchant) && credit >= 5000) return "Income";
  if ((debit > 0 || credit > 0) && isLikelyPerson(merchant)) return "P2P / Split";
  return "Other";
}

function buildTransaction(row, index, merchantOverrides = {}) {
  const rawDescription = cleanSpaces(row.rawDescription);
  const rawMerchant = extractRawMerchant(row.bank, rawDescription);
  const merchantKey = buildMerchantKey(rawMerchant);
  const inferredMerchant = normalizeMerchant(rawMerchant, rawDescription);
  const isSelfTransfer = SELF_TRANSFER_HINT.test(rawDescription);
  const inferredCategory = deriveCategory({
    merchant: inferredMerchant,
    rawDescription,
    debit: row.debit,
    credit: row.credit,
    isSelfTransfer,
  });
  const manual = merchantOverrides[merchantKey];
  const merchant = manual?.merchant || inferredMerchant;
  const category = CASHBACK_MERCHANTS.has(merchant) ? "Cashback" : manual?.category || inferredCategory;
  const isoDate = toDateKey(row.date);
  const amount = row.debit > 0 ? row.debit : row.credit;
  const isRefund =
    (!isSelfTransfer && row.credit > 0 && (/refund/i.test(rawDescription) || /UPI\/REF\//i.test(rawDescription))) ||
    CASHBACK_MERCHANTS.has(merchant);

  return {
    id: `${row.bank}-${index}-${merchantKey}-${amount}`,
    bank: row.bank,
    date: isoDate,
    statementDate: row.date,
    description: rawDescription,
    rawDescription,
    rawMerchant,
    merchant,
    merchantKey,
    debit: toIndianAmount(row.debit),
    credit: toIndianAmount(row.credit),
    balance: toIndianAmount(row.balance),
    amount,
    category,
    isManual: Boolean(manual),
    notes: manual?.notes || "",
    isSelfTransfer,
    isRefund,
    sequence: index,
  };
}

function buildDemoTransactions(merchantOverrides = {}) {
  return [...DEMO_SEED.sbi, ...DEMO_SEED.iob].map((row, index) => buildTransaction(row, index, merchantOverrides));
}

function groupSum(items, keyFn, valueFn) {
  return items.reduce((accumulator, item) => {
    const key = keyFn(item);
    accumulator[key] = (accumulator[key] || 0) + valueFn(item);
    return accumulator;
  }, {});
}

function roundBudget(value) {
  return value < 500 ? Math.ceil(value / 50) * 50 : Math.ceil(value / 100) * 100;
}

function getDefaultBudgets(transactions) {
  const spendByCategory = groupSum(
    transactions.filter((transaction) => transaction.debit > 0 && !transaction.isSelfTransfer),
    (transaction) => transaction.category,
    (transaction) => transaction.debit
  );
  return Object.fromEntries(
    Object.entries(spendByCategory)
      .filter(([category]) => !["Self Transfer", "Cashback", "Interest Income", "Income"].includes(category))
      .map(([category, total]) => [category, roundBudget(total * 1.2)])
  );
}

function transactionSignature(transaction) {
  return [transaction.bank, transaction.date, transaction.rawDescription, transaction.debit, transaction.credit, transaction.balance].join("|");
}

function dedupeTransactions(transactions) {
  const seen = new Set();
  return transactions.filter((transaction) => {
    const signature = transactionSignature(transaction);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function getTypeLabel(transaction) {
  if (transaction.isSelfTransfer) return "Self Transfer";
  if (transaction.isRefund) return transaction.category === "Cashback" ? "Cashback" : "Refund";
  return transaction.debit > 0 ? "Debit" : "Credit";
}

function parseNumericValue(value) {
  if (value == null) return 0;
  const cleaned = `${value}`.replace(/[₹,]/g, "").trim();
  if (!cleaned || cleaned === "-") return 0;
  return Number.parseFloat(cleaned);
}

function splitDelimitedLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (character === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(headerLine) {
  const candidates = ["|", ",", "\t"];
  return candidates.sort((left, right) => headerLine.split(right).length - headerLine.split(left).length)[0];
}

function parseDelimitedStatement(text, bank) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headerLine = lines.find((line) => /Value Date|Date\(Value Date\)|Particulars/i.test(line));
  if (!headerLine) return { rows: [], reviewRows: [] };
  const delimiter = detectDelimiter(headerLine);
  const headers = splitDelimitedLine(headerLine, delimiter);
  const headerMap = Object.fromEntries(headers.map((header, index) => [header.toLowerCase(), index]));
  const rows = [];
  const reviewRows = [];
  for (const line of lines.slice(lines.indexOf(headerLine) + 1)) {
    if (/^(Page|Report Generation|STATEMENT OF THE ACCOUNT|Effective available balance)/i.test(line)) continue;
    const columns = splitDelimitedLine(line, delimiter);
    try {
      if (bank === "SBI") {
        rows.push({
          bank,
          date: columns[headerMap["value date"]],
          rawDescription: columns[headerMap["details"]],
          debit: parseNumericValue(columns[headerMap["₹ debit"]]),
          credit: parseNumericValue(columns[headerMap["₹ credit"]]),
          balance: parseNumericValue(columns[headerMap["balance"]]),
        });
      } else if (bank === "CANARA") {
        rows.push({
          bank,
          date: columns[headerMap.date],
          rawDescription: columns[headerMap.particulars],
          debit: parseNumericValue(columns[headerMap.withdrawals]),
          credit: parseNumericValue(columns[headerMap.deposits]),
          balance: parseNumericValue(columns[headerMap.balance]),
        });
      } else {
        rows.push({
          bank,
          date: columns[headerMap["date(value date)"]],
          rawDescription: columns[headerMap["particulars"]],
          debit: parseNumericValue(columns[headerMap["debit(rs)"]]),
          credit: parseNumericValue(columns[headerMap["credit(rs)"]]),
          balance: parseNumericValue(columns[headerMap["balance(rs)"]]),
        });
      }
    } catch {
      reviewRows.push({ line, reason: "Column mismatch" });
    }
  }
  return { rows, reviewRows };
}

function parseSbiRawText(text) {
  const lines = text.replace(/\f/g, "\n").split(/\r?\n/);
  const rows = [];
  const reviewRows = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    const interestMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+\d{2}\/\d{2}\/\d{4}\s+INTEREST CREDIT\s+-\s+-\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/);
    if (interestMatch) {
      rows.push({
        bank: "SBI",
        date: interestMatch[1],
        rawDescription: "INTEREST CREDIT",
        debit: 0,
        credit: parseNumericValue(interestMatch[2]),
        balance: parseNumericValue(interestMatch[3]),
      });
      index += 1;
      continue;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}\s+\d{2}\/\d{2}\/\d{4}$/.test(line)) {
      index += 1;
      continue;
    }
    const date = line.split(" ")[0];
    index += 1;
    const typeLine = cleanSpaces(lines[index]);
    index += 1;
    const descriptionParts = [];
    const prefix = typeLine.startsWith("POS ATM PURCH") ? [typeLine] : [];
    let amountLine = "";
    while (index < lines.length) {
      const current = cleanSpaces(lines[index]);
      if (!current || current === "Balance" || current === "Page no.") {
        index += 1;
        continue;
      }
      if (/^\d+$/.test(current)) {
        index += 1;
        continue;
      }
      if (current.startsWith("- ")) {
        amountLine = current;
        index += 1;
        break;
      }
      if (current.includes("AT 07948") || current === "SELAIYUR, CHENNAI") {
        index += 1;
        continue;
      }
      descriptionParts.push(current);
      index += 1;
    }
    const amounts = amountLine.match(/[\d,]+\.\d{2}/g) || [];
    if (amounts.length < 2) {
      reviewRows.push({ line: [line, typeLine, ...descriptionParts].join(" "), reason: "Could not read SBI amount row" });
      continue;
    }
    rows.push({
      bank: "SBI",
      date,
      rawDescription: cleanSpaces([...prefix, ...descriptionParts].join(" ")),
      debit: amountLine.startsWith("- - ") ? 0 : parseNumericValue(amounts[0]),
      credit: amountLine.startsWith("- - ") ? parseNumericValue(amounts[0]) : 0,
      balance: parseNumericValue(amounts[1]),
    });
  }
  return { rows, reviewRows };
}

function parseIobRawText(text) {
  const lines = text.replace(/\f/g, "\n").split(/\r?\n/);
  const rows = [];
  const reviewRows = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!/^\d{2}-[A-Za-z]{3}-\d{2}$/.test(line)) {
      index += 1;
      continue;
    }
    const date = line;
    index += 1;
    if (/^\(\d{2}-[A-Za-z]{3}-\d{2}\)$/.test(cleanSpaces(lines[index] || ""))) index += 1;
    const descriptionParts = [];
    let detailLine = "";
    while (index < lines.length) {
      const current = cleanSpaces(lines[index]);
      if (!current) {
        index += 1;
        continue;
      }
      const inlineMatch = current.match(/^(.+?)\s+(S\d+)\s+Transfer\s+(-|[\d,]+\.\d{2})\s+(-|[\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/);
      if (inlineMatch) {
        descriptionParts.push(inlineMatch[1]);
        detailLine = `${inlineMatch[2]} Transfer ${inlineMatch[3]} ${inlineMatch[4]} ${inlineMatch[5]}`;
        index += 1;
        break;
      }
      if (/^S\d+/.test(current)) {
        detailLine = current;
        index += 1;
        break;
      }
      descriptionParts.push(current);
      index += 1;
    }
    const amounts = detailLine.match(/[\d,]+\.\d{2}/g) || [];
    if (amounts.length < 2) {
      reviewRows.push({ line: [date, ...descriptionParts].join(" "), reason: "Could not read IOB amount row" });
      continue;
    }
    rows.push({
      bank: "IOB",
      date,
      rawDescription: cleanSpaces(descriptionParts.join(" ")),
      debit: detailLine.includes("Transfer - ") ? 0 : parseNumericValue(amounts[0]),
      credit: detailLine.includes("Transfer - ") ? parseNumericValue(amounts[0]) : 0,
      balance: parseNumericValue(amounts[1]),
    });
  }
  return { rows, reviewRows };
}

function parseCanaraRawText(text) {
  const lines = text.replace(/\f/g, "\n").split(/\r?\n/).map(cleanSpaces);
  const rows = [];
  const reviewRows = [];
  let previousBalance = null;
  let index = 0;

  const isDateLine = (value) => /^\d{2}-\d{2}-\d{4}$/.test(value);
  const isCanaraMetaLine = (value) =>
    /^Chq:/i.test(value) ||
    /^page \d+/i.test(value) ||
    /^[A-Z0-9]{6,}\/\d{2}\/\d{2}\/\d{4}/i.test(value) ||
    /^\/{0,2}[A-Z0-9]{6,}\/\d{2}\/\d{2}\/\d{4}/i.test(value) ||
    /^\d{1,2}:\d{2}:\d{2}(?:\/\d+)?$/i.test(value);

  const inferCredit = (description, amount, balance) => {
    const delta = previousBalance == null ? 0 : Number((balance - previousBalance).toFixed(2));
    if (previousBalance != null && Math.abs(Math.abs(delta) - amount) <= 1.5) return delta >= 0;
    if (/UPI\/(?:CR|REF)\//i.test(description)) return true;
    if (/MDU POS\/.+\/CR\b/i.test(description)) return true;
    if (/SBINT|INTEREST|DISBURSEMENT TO CASA|REVERSAL|REFUND/i.test(description)) return true;
    if (/UPI\/DR\//i.test(description)) return false;
    if (/DEBIT CARD|SMS CHARGES|ONLINE TRANSACTION|MANDATE|TEMPORARYAUTH|PAY TO/i.test(description)) return false;
    return delta >= 0;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line || /^--- PAGE/.test(line) || /^Date Particulars Deposits Withdrawals Balance$/i.test(line) || /^DISCLAIMER$/i.test(line)) {
      index += 1;
      continue;
    }

    const openingMatch = line.match(/^Opening Balance\s+([\d,]+\.\d{2})$/i);
    if (openingMatch) {
      previousBalance = parseNumericValue(openingMatch[1]);
      index += 1;
      continue;
    }

    if (!isDateLine(line)) {
      index += 1;
      continue;
    }

    const date = line;
    index += 1;
    const block = [];
    while (index < lines.length && !isDateLine(lines[index]) && !/^--- PAGE/.test(lines[index]) && !/^Date Particulars Deposits Withdrawals Balance$/i.test(lines[index]) && !/^DISCLAIMER$/i.test(lines[index])) {
      if (lines[index]) block.push(lines[index]);
      index += 1;
    }

    const amountLineIndex = [...block].reverse().findIndex((entry) => (entry.match(/[\d,]+\.\d{2}/g) || []).length >= 2);
    if (amountLineIndex === -1) {
      reviewRows.push({ line: [date, ...block].join(" "), reason: "Could not read Canara amount row" });
      continue;
    }

    const targetIndex = block.length - amountLineIndex - 1;
    const amounts = block[targetIndex].match(/[\d,]+\.\d{2}/g) || [];
    const amount = parseNumericValue(amounts[0]);
    const balance = parseNumericValue(amounts[1]);
    const descriptionParts = [];
    for (const part of block.slice(0, targetIndex)) {
      if (isCanaraMetaLine(part)) break;
      descriptionParts.push(part);
    }
    const rawDescription = cleanSpaces(descriptionParts.join(" "));
    const isCredit = inferCredit(rawDescription, amount, balance);

    rows.push({
      bank: "CANARA",
      date,
      rawDescription,
      debit: isCredit ? 0 : amount,
      credit: isCredit ? amount : 0,
      balance,
    });
    previousBalance = balance;
  }

  return { rows, reviewRows };
}

function detectBankAndParse(text) {
  if (/Date\s*[|,\t]\s*Particulars\s*[|,\t]\s*Deposits\s*[|,\t]\s*Withdrawals\s*[|,\t]\s*Balance/i.test(text)) return parseDelimitedStatement(text, "CANARA");
  if (/Value Date/i.test(text) && /Post Date/i.test(text) && /Details/i.test(text)) return parseDelimitedStatement(text, "SBI");
  if (/Date\(Value Date\)/i.test(text) && /Particulars/i.test(text) && /Debit\(Rs\)/i.test(text)) return parseDelimitedStatement(text, "IOB");
  if (/State Bank of India/i.test(text) || /WDL TFR|DEP TFR|POS ATM PURCH/i.test(text)) return parseSbiRawText(text);
  if (/Statement for A\/c/i.test(text) && /Date Particulars Deposits Withdrawals Balance/i.test(text)) return parseCanaraRawText(text);
  if (/STATEMENT OF THE ACCOUNT/i.test(text) && /Transfer/i.test(text) && /UPI\//i.test(text)) return parseIobRawText(text);
  throw new Error("Unsupported file format. Use SBI, IOB, or Canara CSV/TXT/PDF exports.");
}

function pdfItemsToStructuredText(items) {
  const lines = [];
  let currentLine = [];
  let currentY = null;

  const flush = () => {
    const line = currentLine.join(" ").replace(/\s+/g, " ").trim();
    if (line) lines.push(line);
    currentLine = [];
    currentY = null;
  };

  for (const item of items) {
    const text = cleanSpaces(item?.str || "");
    const y = item?.transform?.[5] ?? currentY ?? 0;

    if (currentY !== null && Math.abs(y - currentY) > 2.5) {
      flush();
    }

    if (text) {
      currentLine.push(text);
    }

    currentY = y;

    if (item?.hasEOL) {
      flush();
    }
  }

  flush();
  return lines.join("\n");
}

async function extractTextFromPDF(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(pdfItemsToStructuredText(content.items));
  }
  const text = pages.join("\n");
  if (!text.trim()) {
    throw new Error("This PDF did not expose readable text. Try an unlocked text-based statement export or paste the PDF text into a .txt file.");
  }
  return text;
}

function getKnownPdfFallbackTransactions(fileName, startIndex, merchantOverrides = {}) {
  return [];
}

function getOrderedBanks(bankCounts) {
  const preferred = ["SBI", "IOB", "CANARA"];
  return Object.keys(bankCounts)
    .filter((bank) => (bankCounts[bank] || 0) > 0)
    .sort((left, right) => {
      const leftIndex = preferred.indexOf(left);
      const rightIndex = preferred.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right);
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
}

function buildAnalytics(transactions) {
  const sorted = [...transactions].sort((left, right) => (left.date === right.date ? left.sequence - right.sequence : left.date.localeCompare(right.date)));
  const spendTransactions = sorted.filter((transaction) => transaction.debit > 0 && !transaction.isSelfTransfer && !transaction.isReimbursable);
  const grossCredits = sorted.reduce((sum, transaction) => sum + transaction.credit, 0);
  const adjustedCredits = sorted.filter((transaction) => transaction.credit > 0 && !transaction.isSelfTransfer).reduce((sum, transaction) => sum + transaction.credit, 0);
  const totalSpent = spendTransactions.reduce((sum, transaction) => sum + transaction.debit, 0);
  const selfTransferTotal = sorted.filter((transaction) => transaction.isSelfTransfer).reduce((sum, transaction) => sum + transaction.amount, 0);
  const spendByCategoryMap = groupSum(spendTransactions, (transaction) => transaction.category, (transaction) => transaction.debit);
  const spendByCategory = Object.entries(spendByCategoryMap)
    .map(([name, value]) => ({ name, value, color: CATEGORY_META[name]?.color || CATEGORY_META.Other.color }))
    .sort((left, right) => right.value - left.value);
  const topCategory = spendByCategory[0] || null;
  const merchantSpend = Object.entries(groupSum(spendTransactions, (transaction) => transaction.merchant, (transaction) => transaction.debit))
    .map(([merchant, value]) => ({ merchant, value }))
    .sort((left, right) => right.value - left.value);
  const recentTransactions = [...transactions]
    .sort((left, right) => (left.date === right.date ? right.sequence - left.sequence : right.date.localeCompare(left.date)))
    .slice(0, 10);

  const bankCounts = transactions.reduce(
    (accumulator, transaction) => ({
      ...accumulator,
      [transaction.bank]: (accumulator[transaction.bank] || 0) + 1,
    }),
    { SBI: 0, IOB: 0, CANARA: 0 }
  );
  const banks = getOrderedBanks(bankCounts);
  const runningBalances = Object.fromEntries(banks.map((bank) => [bank, 0]));
  const balanceByDate = {};
  for (const transaction of sorted) {
    const key = transaction.date;
    if (!balanceByDate[key]) {
      balanceByDate[key] = { date: key, label: formatShortDate(transaction.statementDate) };
      for (const bank of banks) {
        balanceByDate[key][bank] = runningBalances[bank] || 0;
      }
    }
    runningBalances[transaction.bank] = transaction.balance;
    balanceByDate[key][transaction.bank] = transaction.balance;
  }

  const weeklyMap = {};
  for (const transaction of spendTransactions) {
    const day = Number(transaction.date.slice(-2));
    const week = day <= 7 ? "Week 1" : day <= 14 ? "Week 2" : day <= 21 ? "Week 3" : "Week 4";
    weeklyMap[week] ||= { week };
    weeklyMap[week][transaction.category] = (weeklyMap[week][transaction.category] || 0) + transaction.debit;
  }

  const foodDeepDiveBase = { Zomato: 0, Swiggy: 0, "McDonald's": 0, KFC: 0, Restaurants: 0 };
  for (const transaction of spendTransactions.filter((item) => item.category === "Food & Dining")) {
    if (transaction.merchant === "Zomato") foodDeepDiveBase.Zomato += transaction.debit;
    else if (["Swiggy", "Swiggy Diners"].includes(transaction.merchant)) foodDeepDiveBase.Swiggy += transaction.debit;
    else if (transaction.merchant === "McDonald's") foodDeepDiveBase["McDonald's"] += transaction.debit;
    else if (transaction.merchant === "KFC") foodDeepDiveBase.KFC += transaction.debit;
    else foodDeepDiveBase.Restaurants += transaction.debit;
  }

  const p2pSpendMap = groupSum(
    spendTransactions.filter((transaction) => transaction.category === "P2P / Split"),
    (transaction) => transaction.merchant,
    (transaction) => transaction.debit
  );
  const p2pCountMap = groupSum(
    spendTransactions.filter((transaction) => transaction.category === "P2P / Split"),
    (transaction) => transaction.merchant,
    () => 1
  );
  const maxP2P = Math.max(...Object.values(p2pSpendMap), 1);
  const p2pHeatmap = Object.entries(p2pSpendMap)
    .map(([merchant, total]) => ({ merchant, total, count: p2pCountMap[merchant] || 0, intensity: total / maxP2P }))
    .sort((left, right) => right.total - left.total);

  const subscriptionTransactions = sorted.filter(
    (transaction) =>
      transaction.debit > 0 &&
      (SUBSCRIPTION_MERCHANTS.has(transaction.merchant) ||
        (["SprintPro", "Velocity Stack"].includes(transaction.merchant) && transaction.debit < 100))
  );
  const subscriptionCountMap = groupSum(
    subscriptionTransactions,
    (transaction) => transaction.merchant,
    () => 1
  );
  const subscriptions = Object.entries(
    groupSum(
      subscriptionTransactions,
      (transaction) => transaction.merchant,
      (transaction) => transaction.debit
    )
  )
    .map(([merchant, total]) => ({ merchant, total, count: subscriptionCountMap[merchant] || 0, flagged: total > 200 }))
    .sort((left, right) => right.total - left.total);

  const selfTransferDebits = sorted.filter((transaction) => transaction.isSelfTransfer && transaction.debit > 0);
  const selfTransferCredits = sorted.filter((transaction) => transaction.isSelfTransfer && transaction.credit > 0);
  const selfTransferPairs = selfTransferDebits
    .map((debitTransaction) => {
      const match = selfTransferCredits.find((creditTransaction) => {
        if (creditTransaction.amount !== debitTransaction.amount) return false;
        const debitDate = new Date(debitTransaction.date);
        const creditDate = new Date(creditTransaction.date);
        const daysDiff = Math.abs(debitDate - creditDate) / (1000 * 60 * 60 * 24);
        return daysDiff <= 2;
      });
      return match
        ? {
            amount: debitTransaction.amount,
            debitDate: debitTransaction.statementDate,
            creditDate: match.statementDate,
            from: debitTransaction.bank,
            to: match.bank,
          }
        : null;
    })
    .filter(Boolean);

  const categoryAverages = {};
  for (const [category, total] of Object.entries(spendByCategoryMap)) {
    const count = spendTransactions.filter((transaction) => transaction.category === category).length || 1;
    categoryAverages[category] = total / count;
  }
  const anomalies = spendTransactions
    .filter((transaction) => transaction.debit > Math.max((categoryAverages[transaction.category] || 0) * 2.2, transaction.category === "Rent" ? 15000 : 900))
    .sort((left, right) => right.debit - left.debit);

  const emotionalSpends = [];
  const dateCounts = {};
  spendTransactions.forEach(t => {
      if (t.category === "Food & Dining" || t.category === "Shopping / Electronics" || t.category === "Entertainment") {
          dateCounts[t.date] = dateCounts[t.date] || { count: 0, items: [] };
          dateCounts[t.date].count++;
          dateCounts[t.date].items.push(t);
      }
  });
  for (const [date, data] of Object.entries(dateCounts)) {
     if (data.count >= 3) {
         const total = data.items.reduce((s, t) => s + t.debit, 0);
         emotionalSpends.push({ 
           date, 
           statementDate: data.items[0].statementDate,
           count: data.count, 
           total, 
           categories: Array.from(new Set(data.items.map(t => t.category))) 
         });
     }
  }
  emotionalSpends.sort((a, b) => b.date.localeCompare(a.date));

  const rentMerchant = spendTransactions
    .filter((transaction) => transaction.category === "Rent")
    .sort((left, right) => right.debit - left.debit)[0]?.merchant || null;
  const sportsMerchants = Object.entries(
    groupSum(
      spendTransactions.filter((transaction) => transaction.category === "Sports & Recreation"),
      (transaction) => transaction.merchant,
      (transaction) => transaction.debit
    )
  )
    .sort((left, right) => right[1] - left[1])
    .map(([merchant]) => merchant);
  const refundLoops = Object.entries(
    groupSum(
      sorted.filter((transaction) => transaction.isRefund && transaction.category !== "Cashback"),
      (transaction) => transaction.merchant,
      (transaction) => transaction.credit
    )
  )
    .map(([merchant, refunds]) => ({
      merchant,
      refunds,
      gross: spendTransactions.filter((transaction) => transaction.merchant === merchant).reduce((sum, transaction) => sum + transaction.debit, 0),
    }))
    .map((loop) => ({ ...loop, net: loop.gross - loop.refunds }))
    .filter((loop) => loop.gross > 0)
    .sort((left, right) => right.refunds - left.refunds);
  const topRecurringP2P = p2pHeatmap[0] || null;
  const cashbackTotal = sorted.filter((transaction) => transaction.isRefund && transaction.category === "Cashback").reduce((sum, transaction) => sum + transaction.credit, 0);
  const biggestExpense = spendTransactions.reduce((largest, transaction) => (transaction.debit > (largest?.debit || 0) ? transaction : largest), null);

  const monthlySpend = {};
  for (const trx of spendTransactions) {
      if (trx.date) {
          const monthKey = trx.date.substring(0, 7); // YYYY-MM
          monthlySpend[monthKey] = (monthlySpend[monthKey] || 0) + trx.debit;
      }
  }
  const sortedMonths = Object.keys(monthlySpend).sort();
  const currentMonthKey = sortedMonths[sortedMonths.length - 1] || null;
  const previousMonthKey = sortedMonths[sortedMonths.length - 2] || null;
  
  const momData = {
     currentMonth: currentMonthKey ? { month: currentMonthKey, spend: monthlySpend[currentMonthKey] } : null,
     previousMonth: previousMonthKey ? { month: previousMonthKey, spend: monthlySpend[previousMonthKey] } : null,
     difference: 0,
     percentChange: 0
  };
  
  if (momData.currentMonth && momData.previousMonth && momData.previousMonth.spend > 0) {
      momData.difference = momData.currentMonth.spend - momData.previousMonth.spend;
      momData.percentChange = (momData.difference / momData.previousMonth.spend) * 100;
  }

  return {
    monthlySpendMap: monthlySpend,
    allMonths: sortedMonths,
    grossCredits,
    adjustedCredits,
    totalSpent,
    selfTransferTotal,
    spendByCategory,
    topCategory,
    merchantSpend,
    recentTransactions,
    balanceSeries: Object.values(balanceByDate),
    weeklyBreakdown: Object.values(weeklyMap),
    foodDeepDive: Object.entries(foodDeepDiveBase).map(([name, value]) => ({ name, value })),
    p2pHeatmap,
    subscriptions,
    selfTransferPairs,
    anomalies,
    refundLoop: refundLoops[0] || null,
    cashbackTotal,
    cashFlow: {
      grossCredits,
      grossDebits: sorted.reduce((sum, transaction) => sum + transaction.debit, 0),
      adjustedNet: adjustedCredits - totalSpent,
    },
    rentSpend: spendByCategoryMap.Rent || 0,
    rentMerchant,
    foodSpend: spendByCategoryMap["Food & Dining"] || 0,
    subscriptionTotal: subscriptions.reduce((sum, subscription) => sum + subscription.total, 0),
    biggestExpense,
    sportsSpend: spendTransactions.filter((transaction) => transaction.category === "Sports & Recreation").reduce((sum, transaction) => sum + transaction.debit, 0),
    sportsMerchants,
    topRecurringP2P,
    banks,
    bankCounts,
    momData,
    emotionalSpends,
  };
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-strong)] px-3 py-2 text-xs text-[var(--text)] shadow-2xl backdrop-blur">
      {label ? <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-50)]">{label}</div> : null}
      {payload.map((item) => (
        <div key={item.dataKey || item.name} className="flex items-center justify-between gap-4 py-1">
          <span className="flex items-center gap-2 text-[var(--text-70)]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.payload?.color || "var(--accent)" }} />
            {item.name}
          </span>
          <span className="ledgr-mono text-[var(--text)]">{formatCurrency(item.value || 0)}</span>
        </div>
      ))}
    </div>
  );
}

function AnimatedCurrency({ value, className = "", minimumFractionDigits = 2 }) {
  const [display, setDisplay] = useState(0);
  const previousRef = useRef(0);

  useEffect(() => {
    const from = previousRef.current;
    const to = Number(value || 0);
    const startedAt = performance.now();
    let frame = 0;
    const duration = 900;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previousRef.current = to;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={`ledgr-mono ${className}`}>{formatCurrency(display, minimumFractionDigits)}</span>;
}

function IconShell({ children, accent = "var(--accent)" }) {
  return <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)]" style={{ color: accent }}>{children}</div>;
}

function BankBadge({ bank }) {
  const styles = BANK_META[bank]?.badge || BANK_META.DEFAULT.badge;
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ring-1 ${styles}`}>{bank}</span>;
}

function CategoryChip({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.Other;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line-10)] bg-[var(--surface-5)] px-2.5 py-1 text-[11px] text-[var(--text-75)]">
      <Icon size={12} style={{ color: meta.color }} />
      {category}
    </span>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="glass-card rounded-[1.75rem] px-6 py-10 text-center">
      <svg viewBox="0 0 240 140" className="mx-auto h-28 w-40 text-[var(--text-50)]">
        <defs>
          <linearGradient id="empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect x="28" y="26" width="184" height="88" rx="18" fill="rgba(255,255,255,0.04)" stroke="url(#empty-gradient)" strokeWidth="2" />
        <path d="M58 86C82 58 96 66 116 84C138 102 160 50 186 72" fill="none" stroke="url(#empty-gradient)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="84" cy="58" r="9" fill="#22C55E" fillOpacity="0.85" />
        <circle cx="162" cy="52" r="6" fill="#1E293B" fillOpacity="0.8" />
      </svg>
      <h3 className="ledgr-display mt-5 text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="glass-card pointer-events-auto rounded-2xl px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <IconShell accent={toast.type === "error" ? "var(--danger)" : "var(--accent)"}>
                {toast.type === "error" ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
              </IconShell>
              <div>
                <div className="text-[var(--text)]">{toast.title}</div>
                {toast.message ? <div className="mt-1 text-xs text-[var(--muted)]">{toast.message}</div> : null}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({ title, eyebrow, action, children, className = "" }) {
  return (
    <section className={`glass-card rounded-[1.75rem] p-5 sm:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">{eyebrow}</div> : null}
          <h2 className="ledgr-display text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ title, icon: Icon, value, note, accent = "var(--accent)", trend }) {
  return (
    <div className="glass-card rounded-[1.5rem] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">{title}</div>
          <div className="mt-4 text-2xl font-semibold sm:text-3xl">
            <AnimatedCurrency value={value} />
          </div>
          {note ? <div className="mt-2 text-sm text-[var(--muted)]">{note}</div> : null}
        </div>
        <IconShell accent={accent}>
          <Icon size={18} />
        </IconShell>
      </div>
      {trend ? <div className="mt-5 inline-flex items-center gap-2 text-xs text-[var(--text-70)]">{trend}</div> : null}
    </div>
  );
}

function GoalRing({ goal }) {
  const progress = Math.max(0, Math.min(100, ((goal.current || 0) / Math.max(goal.target || 1, 1)) * 100));
  const ringData = [{ name: goal.name, value: progress, fill: "var(--accent)" }];
  return (
    <div className="glass-card rounded-[1.5rem] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="ledgr-display text-xl">{goal.name}</div>
          <div className="mt-2 text-sm text-[var(--muted)]">{formatCurrency(goal.current || 0)} of {formatCurrency(goal.target || 0)}</div>
          {goal.targetDate ? <div className="mt-1 text-xs text-[var(--muted)]">Target: {goal.targetDate}</div> : null}
        </div>
        <div className="h-24 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="72%" outerRadius="100%" barSize={8} data={ringData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-2 text-right ledgr-mono text-sm text-[var(--accent)]">{progress.toFixed(0)}%</div>
    </div>
  );
}

function TransactionDrawer({ transaction, onClose, onSave }) {
  const [merchant, setMerchant] = useState(transaction?.merchant || "");
  const [category, setCategory] = useState(transaction?.category || "Other");
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [isReimbursable, setIsReimbursable] = useState(transaction?.isReimbursable || false);
  const [applyAll, setApplyAll] = useState(false);

  useEffect(() => {
    setMerchant(transaction?.merchant || "");
    setCategory(transaction?.category || "Other");
    setNotes(transaction?.notes || "");
    setIsReimbursable(transaction?.isReimbursable || false);
    setApplyAll(false);
  }, [transaction]);

  return (
    <AnimatePresence>
      {transaction ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--line-10)] bg-[var(--surface-strong)] p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--muted)]">Edit Transaction</div>
                <div className="ledgr-display mt-2 text-2xl">{transaction.merchant}</div>
                <div className="mt-2 flex items-center gap-2">
                  <BankBadge bank={transaction.bank} />
                  <CategoryChip category={transaction.category} />
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-2xl border border-[var(--line-10)] p-2 text-[var(--text-60)] transition hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Merchant Name</span>
                <input
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-[#13131A] text-[var(--text)]">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-[var(--muted)]">Notes</span>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text-80)]">
                <input type="checkbox" checked={applyAll} onChange={(event) => setApplyAll(event.target.checked)} className="range-input h-4 w-4" />
                Apply to all similar descriptions
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text-80)]">
                <input type="checkbox" checked={isReimbursable} onChange={(event) => setIsReimbursable(event.target.checked)} className="range-input h-4 w-4 accent-amber-500" />
                Mark as Reimbursable/Business (exclude from analytics)
              </label>
            </div>

            <div className="mt-auto flex gap-3 pt-6">
              <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-[var(--line-10)] px-4 py-3 text-sm text-[var(--text-70)] transition hover:bg-[var(--surface-5)]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave({ merchant, category, notes, applyAll, isReimbursable })}
                className="flex-1 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105"
              >
                Save Changes
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function UploadConsole({ onLoadDemo, onFileChange, reviewRows, transactionCount, bankCounts }) {
  const visibleBanks = getOrderedBanks(bankCounts);
  return (
    <SectionCard
      title="Import Console"
      eyebrow="Statement Parser"
      action={
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] transition hover:bg-[var(--surface-5)]">
            <Upload size={16} />
            Upload PDF / CSV / TXT
            <input type="file" accept=".txt,.csv,.pdf" multiple onChange={onFileChange} className="hidden" />
          </label>
          <button type="button" onClick={onLoadDemo} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105">
            <RefreshCcw size={16} />
            Load Demo Data
          </button>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.25fr,0.75fr]">
        <div className="soft-grid rounded-[1.5rem] border border-dashed border-[var(--line-10)] bg-[var(--surface-soft)] p-5">
          <div className="flex items-start gap-4">
            <IconShell>
              <Upload size={18} />
            </IconShell>
            <div>
              <div className="ledgr-display text-xl">Drop in SBI, IOB, or Canara exports</div>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Ledgr auto-detects SBI via <span className="ledgr-mono">Value Date / Post Date / Details</span> and IOB via
                <span className="ledgr-mono"> Date(Value Date) / Particulars / Debit(Rs)</span>, plus Canara via
                <span className="ledgr-mono"> Date / Particulars / Deposits / Withdrawals / Balance</span>. Support for PDFs, raw TXT, copied table exports, and simple CSV layouts.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-70)]">
                <span className="rounded-full border border-[var(--line-10)] bg-[var(--surface-5)] px-3 py-1">PDF passbook support</span>
                <span className="rounded-full border border-[var(--line-10)] bg-[var(--surface-5)] px-3 py-1">Merchant normalization</span>
                <span className="rounded-full border border-[var(--line-10)] bg-[var(--surface-5)] px-3 py-1">Refund + self-transfer reconciliation</span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Transactions</div>
            <div className="mt-3 ledgr-mono text-3xl">{transactionCount.toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Banks</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {(visibleBanks.length ? visibleBanks : ["SBI", "IOB", "CANARA"]).map((bank) => (
                <React.Fragment key={bank}>
                  <BankBadge bank={bank} />
                  <span className="ledgr-mono">{bankCounts[bank] || 0}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Review Queue</div>
            <div className="mt-3 ledgr-mono text-3xl">{reviewRows.length}</div>
          </div>
        </div>
      </div>
      {reviewRows.length ? (
        <div className="mt-5 rounded-[1.5rem] border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text)]">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            Review required for {reviewRows.length} unparsed rows
          </div>
          <div className="mt-3 grid gap-2">
            {reviewRows.slice(0, 4).map((row, index) => (
              <div key={`${row.line}-${index}`} className="rounded-xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-70)]">
                <div>{row.reason}</div>
                <div className="mt-1 ledgr-mono text-[11px] text-[var(--text-45)]">{row.line}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}


function SpendingHeatmap({ transactions, onDateClick }) {
  const tooltipRef = useRef(null);

  // Create a persistent tooltip container in document.body (outside glass-card)
  useEffect(() => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;z-index:99999;pointer-events:none;display:none;transform:translate(-50%,-100%);border-radius:8px;border:1px solid var(--line-10);background:#1A1A24;padding:8px 12px;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);';
    document.body.appendChild(el);
    tooltipRef.current = el;
    return () => { document.body.removeChild(el); };
  }, []);

  const { spendByDay, maxSpend, topMerchantByDay } = useMemo(() => {
    const sbd = {};
    let ms = 0;
    const tmbd = {};
    transactions.forEach(trx => {
      if (trx.debit > 0 && !trx.isSelfTransfer && trx.date) {
        sbd[trx.date] = (sbd[trx.date] || 0) + trx.debit;
        if (sbd[trx.date] > ms) ms = sbd[trx.date];
        if (!tmbd[trx.date] || trx.debit > tmbd[trx.date].amount) {
          tmbd[trx.date] = { merchant: trx.merchant, amount: trx.debit };
        }
      }
    });
    return { spendByDay: sbd, maxSpend: ms, topMerchantByDay: tmbd };
  }, [transactions]);

  const { weeks, monthName, hasData } = useMemo(() => {
    const dates = Object.keys(spendByDay).sort();
    if (!dates.length) return { weeks: [], monthName: '', hasData: false };

    const firstDate = new Date(dates[0]);
    const monthStart = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const monthEnd = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0);
    const startOffset = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;

    const days = [];
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: iso, spend: spendByDay[iso] || 0, day: d.getDate() });
    }

    const wks = [];
    let currentWeek = Array(startOffset).fill(null);
    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        wks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      wks.push(currentWeek);
    }

    const mn = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(firstDate);
    return { weeks: wks, monthName: mn, hasData: true };
  }, [spendByDay]);

  if (!hasData) return null;

  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const showTooltip = (e, d) => {
    const el = tooltipRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dateStr = new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' });
    const merchant = topMerchantByDay[d.date];
    el.style.display = 'block';
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top - 8}px`;
    el.innerHTML = `
      <div style="font-size:11px;font-weight:600;color:var(--text);white-space:nowrap">${dateStr}</div>
      <div style="color:var(--accent);font-family:'JetBrains Mono',monospace;font-weight:700;font-size:14px">${formatCurrency(d.spend, 0)}</div>
      ${merchant ? `<div style="font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap">Top: ${merchant.merchant}</div>` : ''}
    `;
  };

  const hideTooltip = () => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Spending Heatmap</div>
          <div className="mt-1 text-sm font-semibold text-[var(--text)]">{monthName}</div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
          <span>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{
              backgroundColor: i === 0 ? 'rgba(255,255,255,0.04)' : `rgba(200, 242, 46, ${0.15 + i * 0.65})`
            }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Row-based heatmap: each row = a day of the week */}
      <div className="space-y-1 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="min-w-[340px]">
          {DOW.map((dayName, dowIndex) => (
            <div key={dayName} className="flex items-center gap-1.5">
              <div className="w-8 text-[10px] text-[var(--muted)] shrink-0">{dayName}</div>
              <div className="flex gap-1 flex-1">
                {weeks.map((week, wi) => {
                  const d = week[dowIndex];
                  if (!d) return <div key={wi} className="h-7 rounded-sm flex-1" />;
                  const intensity = maxSpend > 0 ? d.spend / maxSpend : 0;
                  return (
                    <div
                      key={d.date}
                      className="h-7 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-[var(--accent)] hover:z-10 flex items-center justify-center flex-1"
                      style={{
                        backgroundColor: d.spend === 0
                          ? 'rgba(255,255,255,0.04)'
                          : `rgba(200, 242, 46, ${0.15 + intensity * 0.65})`,
                      }}
                      onMouseEnter={(e) => showTooltip(e, d)}
                      onMouseLeave={hideTooltip}
                      onClick={() => onDateClick && onDateClick(d.date)}
                    >
                      <span className="text-[9px] font-semibold text-[var(--text)] opacity-50 select-none pointer-events-none">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function BurnRateBar({ analytics, transactions, budgets }) {
  const dates = transactions.filter(t => t.debit > 0 && !t.isSelfTransfer).map(t => t.date).filter(Boolean).sort();
  if (dates.length < 2) return null;

  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  const daysElapsed = Math.max(1, Math.ceil((last - first) / (1000 * 60 * 60 * 24)));
  const dailyBurn = analytics.totalSpent / daysElapsed;
  const projected = dailyBurn * 30;
  const totalBudget = Object.values(budgets || {}).reduce((s, v) => s + v, 0);
  const pacePercent = totalBudget > 0 ? Math.min(150, (projected / totalBudget) * 100) : 0;
  const onTrack = totalBudget > 0 && projected <= totalBudget;
  const paceLabel = totalBudget === 0 ? "No budget set" : onTrack ? "On track" : "Overspending";

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${onTrack ? "bg-[var(--accent)]/10 border border-[var(--accent)]/25" : "bg-[var(--danger)]/10 border border-[var(--danger)]/25"}`}>
            <Flame size={14} className={onTrack ? "text-[var(--accent)]" : "text-[var(--danger)]"} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Burn Rate</div>
            <div className="text-xs text-[var(--muted)]">{daysElapsed} days tracked</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-0">
          <div className="text-left sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Daily avg</div>
            <div className="ledgr-mono text-sm font-bold text-[var(--text)]">{formatCurrency(dailyBurn, 0)}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Projected /mo</div>
            <div className={`ledgr-mono text-sm font-bold ${onTrack ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>{formatCurrency(projected, 0)}</div>
          </div>
          {totalBudget > 0 && (
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Budget</div>
              <div className="ledgr-mono text-sm font-bold text-[var(--text)]">{formatCurrency(totalBudget, 0)}</div>
            </div>
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${onTrack ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/25" : "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25"}`}>{paceLabel}</span>
        </div>
      </div>
      {totalBudget > 0 && (
        <div className="h-2 rounded-full bg-[var(--surface-5)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pacePercent, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${onTrack ? "bg-[var(--accent)]" : "bg-[var(--danger)]"}`}
          />
        </div>
      )}
    </div>
  );
}

function CommandPalette({ open, onClose, transactions, onNavigate, onAction }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const staticCommands = [
    { type: "nav", label: "Go to Dashboard", icon: LayoutGrid, action: () => onNavigate("overview") },
    { type: "nav", label: "Go to Transactions", icon: WalletCards, action: () => onNavigate("transactions") },
    { type: "nav", label: "Go to Analytics", icon: ChartColumnBig, action: () => onNavigate("analysis") },
    { type: "nav", label: "Go to Insights", icon: BrainCircuit, action: () => onNavigate("insights") },
    { type: "nav", label: "Go to Subscriptions", icon: RefreshCcw, action: () => onNavigate("subscriptions") },
    { type: "nav", label: "Go to Budgets & Goals", icon: Target, action: () => onNavigate("budget") },
    { type: "action", label: "Load demo data", icon: RefreshCcw, action: () => onAction("demo") },
    { type: "action", label: "Export CSV", icon: Download, action: () => onAction("export") },
    { type: "action", label: "Clear all data", icon: X, action: () => onAction("clear") },
  ];

  const lowerQuery = query.toLowerCase().trim();

  const filteredCommands = lowerQuery
    ? staticCommands.filter(c => c.label.toLowerCase().includes(lowerQuery))
    : staticCommands;

  const merchantResults = lowerQuery.length >= 2
    ? [...new Map(
        transactions
          .filter(t => t.merchant.toLowerCase().includes(lowerQuery))
          .map(t => [t.merchant, t])
      ).values()].slice(0, 5)
    : [];

  const allResults = [
    ...filteredCommands.map(c => ({ ...c, id: c.label })),
    ...merchantResults.map(t => ({
      type: "merchant",
      label: t.merchant,
      sublabel: `${t.category} · ${formatCurrency(t.amount)}`,
      icon: Search,
      id: `m-${t.merchant}`,
      action: () => { onNavigate("transactions"); onAction("search", t.merchant); }
    }))
  ];

  useEffect(() => { setSelectedIndex(0); }, [query]);

  const executeSelected = () => {
    if (allResults[selectedIndex]) {
      allResults[selectedIndex].action();
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      executeSelected();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-lg rounded-xl border border-[var(--line-10)] bg-[var(--surface)] shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line-10)]">
            <Search size={16} className="text-[var(--muted)] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search merchants…"
              className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[var(--line-10)] bg-[var(--surface-5)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)]">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto py-1">
            {allResults.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-[var(--muted)]">No results found</div>
            )}
            {allResults.map((item, i) => {
              const Icon = item.icon;
              const active = i === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                    active ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text)] hover:bg-[var(--surface-5)]"
                  }`}
                  onClick={() => { item.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <Icon size={15} className={active ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
                  <div className="flex-1 min-w-0">
                    <div className={`truncate ${active ? "font-semibold" : ""}`}>{item.label}</div>
                    {item.sublabel && <div className="text-[11px] text-[var(--muted)] truncate">{item.sublabel}</div>}
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold ${
                    item.type === "nav" ? "bg-[var(--surface-5)] text-[var(--muted)]" :
                    item.type === "action" ? "bg-[var(--accent)]/10 text-[var(--accent)]" :
                    "bg-[var(--surface-5)] text-[var(--muted)]"
                  }`}>{item.type === "nav" ? "Navigate" : item.type === "action" ? "Action" : "Merchant"}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-[var(--line-10)] text-[10px] text-[var(--muted)]">
            <span><kbd className="text-[var(--text)]">↑↓</kbd> navigate</span>
            <span><kbd className="text-[var(--text)]">↵</kbd> select</span>
            <span><kbd className="text-[var(--text)]">esc</kbd> close</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 1: Top Merchants Widget
   ═══════════════════════════════════════════════════════════════════════════ */
function TopMerchantsWidget({ analytics }) {
  const top5 = analytics.merchantSpend.slice(0, 5);
  if (!top5.length) return null;
  const maxVal = top5[0]?.value || 1;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Top Merchants</div>
          <div className="mt-1 text-sm font-semibold text-[var(--text)]">Where money went</div>
        </div>
      </div>
      <div className="space-y-3">
        {top5.map((m, i) => {
          const pct = (m.value / maxVal) * 100;
          const colors = ['#C8F22E', '#A3E635', '#6EE7B7', '#34D399', '#10B981'];
          return (
            <div key={m.merchant}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[var(--text)] truncate max-w-[60%]">{m.merchant}</span>
                <span className="ledgr-mono text-xs font-bold text-[var(--text)]">{formatCurrency(m.value, 0)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-5)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: colors[i % 5] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 2: Spending by Day-of-Week
   ═══════════════════════════════════════════════════════════════════════════ */
function DayOfWeekChart({ transactions }) {
  const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];

  transactions.forEach(trx => {
    if (trx.debit > 0 && !trx.isSelfTransfer && trx.date) {
      const dow = new Date(trx.date).getDay();
      totals[dow] += trx.debit;
      counts[dow]++;
    }
  });

  const data = DOW_NAMES.map((name, i) => ({
    name,
    total: Math.round(totals[i]),
    avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
  }));

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  if (maxTotal <= 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Day of Week</div>
        <div className="mt-1 text-sm font-semibold text-[var(--text)]">When you spend most</div>
      </div>
      <div className="flex items-end gap-2" style={{ height: '120px' }}>
        {data.map((d) => {
          const height = Math.max((d.total / maxTotal) * 100, 4);
          const isWeekend = d.name === 'Sat' || d.name === 'Sun';
          return (
            <div key={d.name} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="text-[9px] ledgr-mono font-bold text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity mb-1">{formatCurrency(d.total, 0)}</div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5 }}
                className="w-full rounded-t-md"
                style={{ backgroundColor: isWeekend ? 'rgba(239,68,68,0.6)' : 'rgba(200,242,46,0.45)' }}
              />
              <div className={`text-[10px] font-medium mt-1 ${isWeekend ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>{d.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 3: Smart Alerts Bar
   ═══════════════════════════════════════════════════════════════════════════ */
function SmartAlerts({ analytics, transactions }) {
  const alerts = [];

  // High rent ratio
  const rentEntry = analytics.spendByCategory.find(c => c.name === 'Rent');
  const rentSpend = rentEntry?.value || 0;
  if (analytics.adjustedCredits > 0 && rentSpend > 0) {
    const rentPct = (rentSpend / analytics.adjustedCredits) * 100;
    if (rentPct > 30) alerts.push({ type: 'warning', text: `Rent is ${rentPct.toFixed(0)}% of your income — financial advisors recommend under 30%` });
  }

  // Top category dominance
  if (analytics.topCategory && analytics.totalSpent > 0) {
    const dominance = (analytics.topCategory.value / analytics.totalSpent) * 100;
    if (dominance > 25) alerts.push({ type: 'info', text: `${analytics.topCategory.name} accounts for ${dominance.toFixed(0)}% of all spending` });
  }

  // Large single transaction
  const debits = transactions.filter(t => t.debit > 0 && !t.isSelfTransfer);
  if (debits.length > 3) {
    const avg = debits.reduce((s, t) => s + t.debit, 0) / debits.length;
    const outliers = debits.filter(t => t.debit > avg * 3);
    if (outliers.length) {
      const biggest = outliers.sort((a, b) => b.debit - a.debit)[0];
      alerts.push({ type: 'alert', text: `${biggest.merchant} charged ${formatCurrency(biggest.debit, 0)} — ${(biggest.debit / avg).toFixed(1)}× your average transaction` });
    }
  }

  // Subscription burn
  const subTotal = (analytics.subscriptions || []).reduce((s, sub) => s + sub.total, 0);
  if (subTotal > 0 && analytics.adjustedCredits > 0) {
    const subPct = (subTotal / analytics.adjustedCredits) * 100;
    if (subPct > 5) alerts.push({ type: 'info', text: `Subscriptions eat ${formatCurrency(subTotal, 0)}/mo — that's ${formatCurrency(subTotal * 12, 0)}/year` });
  }

  // Weekend spending
  const weekendSpend = debits.filter(t => { const d = new Date(t.date).getDay(); return d === 0 || d === 6; }).reduce((s, t) => s + t.debit, 0);
  const weekdaySpend = debits.filter(t => { const d = new Date(t.date).getDay(); return d > 0 && d < 6; }).reduce((s, t) => s + t.debit, 0);
  if (weekendSpend > 0 && weekdaySpend > 0) {
    const weekendDailyAvg = weekendSpend / 8; // ~8 weekend days
    const weekdayDailyAvg = weekdaySpend / 22; // ~22 weekdays
    if (weekendDailyAvg > weekdayDailyAvg * 1.5) {
      alerts.push({ type: 'warning', text: `Weekend daily spending is ${(weekendDailyAvg / weekdayDailyAvg).toFixed(1)}× higher than weekdays` });
    }
  }

  if (!alerts.length) return null;

  const icons = { warning: AlertTriangle, info: BrainCircuit, alert: Flame };
  const colors = { warning: 'var(--danger)', info: 'var(--accent)', alert: '#F97316' };

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert, i) => {
        const Icon = icons[alert.type];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 rounded-lg border border-[var(--line-10)] bg-[var(--surface)] px-4 py-3"
          >
            <Icon size={14} style={{ color: colors[alert.type] }} className="shrink-0" />
            <span className="text-xs text-[var(--text-75)] leading-relaxed">{alert.text}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 4: Quick Category Budget Progress (Overview)
   ═══════════════════════════════════════════════════════════════════════════ */
function QuickBudgetProgress({ analytics, budgets, onTabChange }) {
  if (!Object.keys(budgets || {}).length) return null;

  const spendMap = Object.fromEntries(analytics.spendByCategory.map(c => [c.name, c.value]));
  const rows = Object.entries(budgets)
    .filter(([cat]) => !['Self Transfer', 'Cashback', 'Interest Income', 'Income'].includes(cat))
    .map(([category, budget]) => ({
      category,
      budget,
      actual: spendMap[category] || 0,
      pct: budget > 0 ? Math.min(((spendMap[category] || 0) / budget) * 100, 150) : 0,
    }))
    .filter(r => r.actual > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  if (!rows.length) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Budget Progress</div>
          <div className="mt-1 text-sm font-semibold text-[var(--text)]">Top 5 categories</div>
        </div>
        <button type="button" onClick={() => onTabChange && onTabChange("budget")} className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1 rounded hover:bg-[var(--accent)]/15 transition-colors cursor-pointer">
          Manage →
        </button>
      </div>
      <div className="space-y-3">
        {rows.map(r => {
          const over = r.pct > 100;
          const meta = CATEGORY_META[r.category] || CATEGORY_META.Other;
          const Icon = meta.icon;
          return (
            <div key={r.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={12} style={{ color: meta.color }} />
                  <span className="text-xs text-[var(--text)] truncate">{r.category}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="ledgr-mono text-[10px] text-[var(--muted)]">{formatCurrency(r.actual, 0)}</span>
                  <span className="text-[10px] text-[var(--muted)]">/</span>
                  <span className="ledgr-mono text-[10px] text-[var(--muted)]">{formatCurrency(r.budget, 0)}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-5)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(r.pct, 100)}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full ${over ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 5: Spending Streaks / Gamification
   ═══════════════════════════════════════════════════════════════════════════ */
function SpendingStreaks({ transactions }) {
  const debits = transactions.filter(t => t.debit > 0 && !t.isSelfTransfer && t.date);
  if (debits.length < 3) return null;

  const spendDays = new Set(debits.map(t => t.date));
  const allDates = [...spendDays].sort();
  const first = new Date(allDates[0]);
  const last = new Date(allDates[allDates.length - 1]);

  // Count no-spend days
  let noSpendDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    if (!spendDays.has(iso)) {
      noSpendDays++;
      currentStreak++;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Average transaction count per active day
  const txPerDay = debits.length / Math.max(spendDays.size, 1);

  // Unique merchants
  const uniqueMerchants = new Set(debits.map(t => t.merchant)).size;

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Spending Patterns</div>
        <div className="mt-1 text-sm font-semibold text-[var(--text)]">Activity insights</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] p-3 text-center">
          <div className="ledgr-mono text-xl font-bold text-[var(--accent)]">{noSpendDays}</div>
          <div className="text-[10px] text-[var(--muted)] mt-1">No-spend days</div>
        </div>
        <div className="rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] p-3 text-center">
          <div className="ledgr-mono text-xl font-bold text-[var(--accent)]">{longestStreak}</div>
          <div className="text-[10px] text-[var(--muted)] mt-1">Best streak</div>
        </div>
        <div className="rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] p-3 text-center">
          <div className="ledgr-mono text-xl font-bold text-[var(--text)]">{txPerDay.toFixed(1)}</div>
          <div className="text-[10px] text-[var(--muted)] mt-1">Avg tx/day</div>
        </div>
        <div className="rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] p-3 text-center">
          <div className="ledgr-mono text-xl font-bold text-[var(--text)]">{uniqueMerchants}</div>
          <div className="text-[10px] text-[var(--muted)] mt-1">Merchants</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 6: Keyboard Shortcuts Help Modal
   ═══════════════════════════════════════════════════════════════════════════ */
function KeyboardShortcutsModal({ open, onClose }) {
  if (!open) return null;
  const shortcuts = [
    { keys: ['Ctrl', 'K'], desc: 'Open command palette' },
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['1-6'], desc: 'Switch to tab by number' },
    { keys: ['Esc'], desc: 'Close dialogs' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm rounded-xl border border-[var(--line-10)] bg-[var(--surface)] shadow-2xl p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="ledgr-display text-lg text-[var(--text)]">Keyboard Shortcuts</h3>
            <button type="button" onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-75)]">{s.desc}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map(k => (
                    <kbd key={k} className="rounded border border-[var(--line-10)] bg-[var(--surface-5)] px-2 py-1 text-[11px] font-mono text-[var(--text)]">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--line-10)] text-xs text-[var(--muted)] text-center">
            Press <kbd className="rounded border border-[var(--line-10)] bg-[var(--surface-5)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--text)]">?</kbd> anywhere to toggle this
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 7: Transaction Quick Stats (inline mini metrics)
   ═══════════════════════════════════════════════════════════════════════════ */
function QuickStats({ transactions }) {
  const debits = transactions.filter(t => t.debit > 0 && !t.isSelfTransfer);
  if (debits.length < 2) return null;

  const amounts = debits.map(t => t.debit).sort((a, b) => a - b);
  const total = amounts.reduce((s, v) => s + v, 0);
  const avg = total / amounts.length;
  const median = amounts.length % 2 === 0
    ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
    : amounts[Math.floor(amounts.length / 2)];
  const largest = amounts[amounts.length - 1];
  const smallest = amounts[0];

  const stats = [
    { label: 'Average', value: formatCurrency(avg, 0), accent: false },
    { label: 'Median', value: formatCurrency(median, 0), accent: false },
    { label: 'Largest', value: formatCurrency(largest, 0), accent: true },
    { label: 'Smallest', value: formatCurrency(smallest, 0), accent: false },
  ];

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Transaction Stats</div>
        <div className="mt-1 text-sm font-semibold text-[var(--text)]">{debits.length} debits analyzed</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{s.label}</div>
            <div className={`ledgr-mono text-sm font-bold mt-1 ${s.accent ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function TimeSelector({ transactions, timeMode, setTimeMode, selectedMonth, setSelectedMonth }) {
  const months = useMemo(() => Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))).sort().reverse(), [transactions]);
  
  useEffect(() => {
     if (timeMode === "Monthly" && !selectedMonth && months.length > 0) {
        setSelectedMonth(months[0]);
     }
  }, [timeMode, selectedMonth, months]);

  if (months.length <= 1) return null;
  
  return (
    <div className="flex items-center gap-2 mb-6">
       <button onClick={() => setTimeMode("Cumulative")} className={`px-4 py-1.5 rounded-full text-xs font-semibold xl:cursor-pointer transition-colors ${timeMode === "Cumulative" ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-5)] text-[var(--muted)] border border-[var(--line-10)]"}`}>Cumulative View</button>
       <button onClick={() => setTimeMode("Monthly")} className={`px-4 py-1.5 rounded-full text-xs font-semibold xl:cursor-pointer transition-colors ${timeMode === "Monthly" ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-5)] text-[var(--muted)] border border-[var(--line-10)]"}`}>Monthly Slice</button>
       
       {timeMode === "Monthly" && (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-[var(--surface-soft)] border border-[var(--line-10)] rounded-full px-3 py-1.5 text-xs text-[var(--text)] outline-none xl:cursor-pointer">
             {months.map(m => {
                const date = new Date(m + "-01");
                return <option key={m} value={m}>{date.toLocaleString("default", { month: "short", year: "numeric" })}</option>;
             })}
          </select>
       )}
    </div>
  );
}

function OverviewTab({ analytics: globalAnalytics, transactions, onOpenTransaction, onTabChange, budgets }) {
  const [timeMode, setTimeMode] = useState("Cumulative");
  const [selectedMonth, setSelectedMonth] = useState("");

  const { analytics, filteredTransactions } = useMemo(() => {
      if (timeMode === "Cumulative") return { analytics: globalAnalytics, filteredTransactions: transactions };
      const filtered = transactions.filter(t => t.date.startsWith(selectedMonth));
      if (!filtered.length) return { analytics: globalAnalytics, filteredTransactions: transactions };
      return { analytics: buildAnalytics(filtered), filteredTransactions: filtered };
  }, [transactions, timeMode, selectedMonth, globalAnalytics]);

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center mb-6">
          <UploadCloud size={28} className="text-[var(--accent)]" />
        </div>
        <h2 className="ledgr-display text-2xl text-[var(--text)]">No transactions yet</h2>
        <p className="mt-3 max-w-sm text-sm text-[var(--muted)] leading-relaxed">Upload a real bank statement (SBI, IOB, Canara) or hit <span className="text-[var(--accent)] font-medium">Load Demo Data</span> in the sidebar to populate the dashboard.</p>
      </div>
    );
  }

  const latest = [...transactions].sort((a,b) => b.sequence - a.sequence).slice(0, 8);
  const netPositive = analytics.cashFlow.adjustedNet >= 0;
  const CHART_COLORS = ['#C8F22E','#A3E635','#6EE7B7','#34D399','#10B981','#059669'];

  return (
    <div className="space-y-5">
      <TimeSelector transactions={transactions} timeMode={timeMode} setTimeMode={setTimeMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Total Spent</div>
              <div className="mt-2 ledgr-mono text-2xl font-bold text-[var(--text)]">{formatCurrency(analytics.totalSpent, 0)}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">Excl. self-transfers</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/25 flex items-center justify-center shrink-0">
              <ArrowDownRight size={16} className="text-[var(--danger)]" />
            </div>
          </div>
        </div>

        {/* Credits In */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Credits In</div>
              <div className="mt-2 ledgr-mono text-2xl font-bold text-[var(--text)]">{formatCurrency(analytics.adjustedCredits, 0)}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">Non-self credits</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
              <ArrowUpRight size={16} className="text-[var(--accent)]" />
            </div>
          </div>
        </div>

        {/* Net Flow */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Net Flow</div>
              <div className={`mt-2 ledgr-mono text-2xl font-bold ${netPositive ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>{formatAmountDisplay(analytics.cashFlow.adjustedNet)}</div>
              <div className="mt-1 text-xs text-[var(--muted)]">{netPositive ? "Positive month" : "Deficit month"}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${netPositive ? "bg-[var(--accent)]/10 border border-[var(--accent)]/25" : "bg-[var(--danger)]/10 border border-[var(--danger)]/25"}`}>
              <TrendingUp size={16} className={netPositive ? "text-[var(--accent)]" : "text-[var(--danger)]"} />
            </div>
          </div>
        </div>

        {/* Top Category */}
        <div className="glass-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Top Category</div>
              <div className="mt-2 ledgr-mono text-2xl font-bold text-[var(--text)]">{formatCurrency(analytics.topCategory?.value || 0, 0)}</div>
              <div className="mt-1 text-xs text-[var(--muted)] truncate">{analytics.topCategory?.name || "No spend yet"}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
              <ChartColumnBig size={16} style={{ color: analytics.topCategory?.color || "var(--accent)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Burn Rate ── */}
      <BurnRateBar analytics={analytics} transactions={filteredTransactions} budgets={budgets} />

      {/* ── Heatmap ── */}
      <SpendingHeatmap
        transactions={filteredTransactions}
        onDateClick={(date) => {
          if (onTabChange) {
            onTabChange("transactions");
          }
        }}
      />

      {/* ── Charts Row ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Balance timeline */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Balance Over Time</div>
              <div className="mt-1 text-sm font-semibold text-[var(--text)]">{analytics.banks.length}-Account Curve</div>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.balanceSeries} margin={{left:-10}}>
                <defs>
                  {analytics.banks.map((bank, i) => {
                    const color = BANK_META[bank]?.color || BANK_META.DEFAULT.color;
                    return (
                      <linearGradient key={bank} id={`bal-${bank}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill:"#A1A1AA", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"#A1A1AA", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                {analytics.banks.map((bank) => {
                  const color = BANK_META[bank]?.color || BANK_META.DEFAULT.color;
                  return <Area key={bank} type="monotone" dataKey={bank} stroke={color} fill={`url(#bal-${bank})`} strokeWidth={2} dot={false} />;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category donut */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Spend by Category</div>
              <div className="mt-1 text-sm font-semibold text-[var(--text)]">Current period</div>
            </div>
            <button type="button" onClick={() => onTabChange("analysis")} className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1 rounded hover:bg-[var(--accent)]/15 transition-colors cursor-pointer">
              Full breakdown →
            </button>
          </div>
          <div className="flex items-center gap-4 h-52">
            <div className="w-[120px] h-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics.spendByCategory.slice(0,6)} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={4} stroke="transparent">
                    {analytics.spendByCategory.slice(0,6).map((entry, i) => (
                      <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:"0.5rem", backgroundColor:"var(--surface-strong)", borderColor:"var(--line-10)", color:"var(--text)", fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 overflow-hidden">
              {analytics.spendByCategory.slice(0,6).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-xs text-[var(--text-75)] truncate">{cat.name}</span>
                  </div>
                  <span className="ledgr-mono text-xs font-semibold text-[var(--text)] shrink-0">₹{(cat.value/1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Smart Insights ── */}
      <SmartAlerts analytics={analytics} transactions={filteredTransactions} />

      {/* ── Bottom Row ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

        {/* Recent Transactions */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-[var(--text)]">Recent Transactions</div>
            <button type="button" onClick={() => onTabChange("transactions")} className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1 rounded hover:bg-[var(--accent)]/15 transition-colors cursor-pointer">
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line-10)]">
                  <th className="pb-2 px-1 text-[var(--muted)] font-medium uppercase tracking-wider">#</th>
                  <th className="pb-2 px-1 text-[var(--muted)] font-medium uppercase tracking-wider">Merchant</th>
                  <th className="pb-2 px-1 text-[var(--muted)] font-medium uppercase tracking-wider">Category</th>
                  <th className="pb-2 px-1 text-[var(--muted)] font-medium uppercase tracking-wider">Date</th>
                  <th className="pb-2 px-1 text-[var(--muted)] font-medium uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((trx, idx) => (
                  <tr key={trx.id} className="border-b border-[var(--line-10)] last:border-0 hover:bg-[var(--surface-5)] cursor-pointer transition-colors" onClick={() => onOpenTransaction(trx)}>
                    <td className="py-3 px-1 text-[var(--muted)]">{idx + 1}</td>
                    <td className="py-3 px-1 font-medium text-[var(--text)] max-w-[140px] truncate">{trx.merchant}</td>
                    <td className="py-3 px-1">
                      <CategoryChip category={trx.category} />
                    </td>
                    <td className="py-3 px-1 text-[var(--muted)]">{formatShortDate(trx.statementDate)}</td>
                    <td className={`py-3 px-1 ledgr-mono font-bold text-right ${trx.credit > 0 ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                      {trx.credit > 0 ? "+" : "−"}{formatCurrency(trx.amount, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscriptions panel */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-[var(--text)]">Subscriptions</div>
            <button type="button" onClick={() => onTabChange("subscriptions")} className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1 rounded hover:bg-[var(--accent)]/15 transition-colors cursor-pointer">
              Manage →
            </button>
          </div>
          {analytics.subscriptions.length === 0 ? (
            <div className="text-xs text-[var(--muted)] mt-4">No recurring charges detected.</div>
          ) : (
            <div className="space-y-3">
              {analytics.subscriptions.slice(0,6).map((sub) => {
                const meta = CATEGORY_META["Entertainment / Gaming"] || CATEGORY_META.Other;
                const IconEl = meta.icon;
                return (
                  <div key={sub.merchant} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${sub.flagged ? "border-[var(--danger)]/30 bg-[var(--danger)]/8" : "border-[var(--line-10)] bg-[var(--surface-5)]"}`}>
                      <IconEl size={14} className={sub.flagged ? "text-[var(--danger)]" : "text-[var(--muted)]"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--text)] truncate">{sub.merchant}</div>
                      <div className="text-[10px] text-[var(--muted)]">{sub.count} charge{sub.count > 1 ? "s" : ""}</div>
                    </div>
                    <div className={`ledgr-mono text-sm font-bold shrink-0 ${sub.flagged ? "text-[var(--danger)]" : "text-[var(--text)]"}`}>
                      {formatCurrency(sub.total, 0)}
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-[var(--line-10)] flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">Monthly total</span>
                <span className="ledgr-mono font-bold text-[var(--accent)]">{formatCurrency(analytics.subscriptionTotal, 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* ── Insights Grid ── */}
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <TopMerchantsWidget analytics={analytics} />
        <DayOfWeekChart transactions={filteredTransactions} />
        <SpendingStreaks transactions={filteredTransactions} />
        <QuickStats transactions={filteredTransactions} />
      </div>

      {/* ── Budget Progress ── */}
      <QuickBudgetProgress analytics={analytics} budgets={budgets} onTabChange={onTabChange} />

    </div>
  );
}

function AnalysisTab({ analytics: globalAnalytics, transactions }) {
  const [timeMode, setTimeMode] = useState("Cumulative");
  const [selectedMonth, setSelectedMonth] = useState("");

  const { analytics, filteredTransactions } = useMemo(() => {
      if (timeMode === "Cumulative") return { analytics: globalAnalytics, filteredTransactions: transactions };
      const filtered = transactions.filter(t => t.date.startsWith(selectedMonth));
      if (!filtered.length) return { analytics: globalAnalytics, filteredTransactions: transactions };
      return { analytics: buildAnalytics(filtered), filteredTransactions: filtered };
  }, [transactions, timeMode, selectedMonth, globalAnalytics]);

  if (!analytics.merchantSpend.length) {
    return <EmptyState title="Nothing to analyze yet" message="Spend categories, merchant ranking, subscriptions, and P2P heatmaps appear once debit transactions are available." />;
  }

  return (
    <div className="grid gap-6">
      <TimeSelector transactions={transactions} timeMode={timeMode} setTimeMode={setTimeMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Category Breakdown by Week" eyebrow="Stacked Flow">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyBreakdown}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip content={<ChartTooltip />} />
                {analytics.spendByCategory.slice(0, 6).map((category) => (
                  <Bar key={category.name} dataKey={category.name} stackId="spend" fill={category.color} radius={[8, 8, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Food Deep-Dive" eyebrow="Delivery vs Restaurant">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.foodDeepDive} dataKey="value" nameKey="name" innerRadius={74} outerRadius={118}>
                  {analytics.foodDeepDive.map((slice, index) => (
                    <Cell key={slice.name} fill={["#F97316", "#EF4444", "#F59E0B", "#FACC15", "#10B981"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <SectionCard title="Top 10 Merchants" eyebrow="Where the money went">
          <div className="h-[26rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.merchantSpend.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <YAxis type="category" dataKey="merchant" width={120} stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Spend" fill="url(#merchant-gradient)" radius={[0, 12, 12, 0]} />
                <defs>
                  <linearGradient id="merchant-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#22C55E" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="P2P Heatmap" eyebrow="Recurring splits">
          <div className="grid gap-3 sm:grid-cols-2">
            {analytics.p2pHeatmap.slice(0, 8).map((item) => (
              <div
                key={item.merchant}
                className="rounded-[1.5rem] border border-[var(--line-10)] p-4"
                style={{ background: `linear-gradient(135deg, rgba(34,197,94,${0.1 + item.intensity * 0.35}), rgba(15,23,42,${0.2 + item.intensity * 0.22}))` }}
              >
                <div className="text-sm font-medium text-[var(--text)]">{item.merchant}</div>
                <div className="mt-2 ledgr-mono text-xl">{formatCurrency(item.total)}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{item.count} payments{item.count >= 3 ? " • recurring" : ""}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4 text-sm text-[var(--muted)]">
            {analytics.topRecurringP2P
              ? `${analytics.topRecurringP2P.merchant} is automatically highlighted as a recurring P2P payee when similar split-style transfers repeat through the month.`
              : "Recurring peer-to-peer transfers are surfaced here once the ledger sees repeat split-style payments."}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Subscription Audit" eyebrow="Recurring Charges">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {analytics.subscriptions.map((subscription) => (
            <div key={subscription.merchant} className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-[var(--text)]">{subscription.merchant}</div>
                {subscription.flagged ? <span className="rounded-full bg-[var(--danger)]/20 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-rose-200">High</span> : null}
              </div>
              <div className="mt-3 ledgr-mono text-2xl">{formatCurrency(subscription.total)}</div>
              <div className="mt-2 text-sm text-[var(--muted)]">Detected as a monthly or recurring cost.</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function BudgetTab({ budgets, setBudgets, analytics, goals, setGoals }) {
  const [draftGoal, setDraftGoal] = useState({ name: "", target: "", current: "", targetDate: "" });
  const [simReductions, setSimReductions] = useState({ "Food & Dining": 0, "Shopping / Electronics": 0, "Transport": 0 });
  const simAnnualSavings = Object.values(simReductions).reduce((s, v) => s + v, 0) * 12;

  const spendMap = Object.fromEntries(analytics.spendByCategory.map((item) => [item.name, item.value]));
  const budgetRows = Object.keys({ ...budgets, ...spendMap })
    .filter((category) => !["Self Transfer", "Cashback", "Interest Income", "Income"].includes(category))
    .map((category) => ({
      category,
      budget: budgets[category] || 0,
      actual: spendMap[category] || 0,
      percent: budgets[category] ? Math.min(100, ((spendMap[category] || 0) / budgets[category]) * 100) : 0,
    }))
    .sort((left, right) => right.actual - left.actual);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
      <SectionCard title="Monthly Budgets" eyebrow="Suggested actual + 20%">
        <div className="space-y-4">
          {budgetRows.map((row) => (
            <div key={row.category} className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CategoryChip category={row.category} />
                <input
                  type="number"
                  min="0"
                  value={row.budget}
                  onChange={(event) => setBudgets((current) => ({ ...current, [row.category]: Number(event.target.value || 0) }))}
                  className="ledgr-mono w-36 rounded-2xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]"
                />
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                <div className="h-full rounded-full bg-[var(--text)] transition-all" style={{ width: `${Math.min(row.percent, 100)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[var(--text-60)]">Actual: {formatCurrency(row.actual)}</span>
                <span className={`ledgr-mono ${row.actual > row.budget && row.budget > 0 ? "text-rose-400 font-bold" : "text-[var(--text)]"}`}>{row.percent.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6">
        <SectionCard title="Scenario Simulator" eyebrow="Decision Tool">
          <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-strong)] p-5">
            <h3 className="text-lg ledgr-display text-[var(--text)] mb-2">What if you cut back?</h3>
            <p className="text-sm text-[var(--muted)] mb-5">Slide to simulate monthly reductions in your flexible categories.</p>
            
            <div className="space-y-6">
              {Object.keys(simReductions).map(cat => {
                const actualSpend = spendMap[cat] || 0;
                const active = actualSpend > 0;
                const reduction = simReductions[cat];
                return (
                  <div key={cat} className={active ? "opacity-100" : "opacity-40 pointer-events-none"}>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-[var(--text-80)]">{cat}</span>
                       <span className="ledgr-mono text-[var(--accent)] hover:scale-105 transition-transform cursor-default font-medium">- {formatCurrency(reduction)} / mo</span>
                    </div>
                    <input 
                      type="range" 
                      className="w-full h-1.5 bg-[var(--line-10)] rounded-lg appearance-none cursor-pointer range-input accent-[var(--accent)]" 
                      min="0" 
                      max={Math.max(1000, actualSpend)} 
                      step="500"
                      value={reduction} 
                      onChange={e => setSimReductions(prev => ({...prev, [cat]: Number(e.target.value)}))} 
                    />
                  </div>
                )
              })}
            </div>
            
            <div className="mt-6 p-5 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 flex gap-4 items-center">
              <div className="p-3 bg-[var(--accent)]/10 rounded-xl text-[var(--accent)]">
                 <TrendingDown size={20} />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Projected Annual Savings</div>
                <div className="ledgr-mono text-2xl text-[var(--accent)] font-medium">+{formatCurrency(simAnnualSavings)}</div>
              </div>
            </div>
            {simAnnualSavings > 0 && <div className="mt-4 text-xs text-[var(--muted)] text-center">That's {formatCurrency(simAnnualSavings)} extra you could put towards your goals every year.</div>}
          </div>
        </SectionCard>

        <SectionCard title="Savings Goals" eyebrow="Progress Rings">
          <div className="grid gap-4">
            {goals.length ? goals.map((goal) => <GoalRing key={goal.id} goal={goal} />) : <EmptyState title="No goals yet" message="Add a savings target to track progress against your March cash flow." />}
          </div>
          <div className="mt-5 grid gap-3 rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
            <input value={draftGoal.name} onChange={(event) => setDraftGoal((current) => ({ ...current, name: event.target.value }))} placeholder="Goal name" className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="number" value={draftGoal.target} onChange={(event) => setDraftGoal((current) => ({ ...current, target: event.target.value }))} placeholder="Target amount" className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" />
              <input type="number" value={draftGoal.current} onChange={(event) => setDraftGoal((current) => ({ ...current, current: event.target.value }))} placeholder="Current saved" className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" />
            </div>
            <input type="date" value={draftGoal.targetDate} onChange={(event) => setDraftGoal((current) => ({ ...current, targetDate: event.target.value }))} className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none" />
            <button
              type="button"
              onClick={() => {
                if (!draftGoal.name || !draftGoal.target) return;
                setGoals((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    name: draftGoal.name,
                    target: Number(draftGoal.target),
                    current: Number(draftGoal.current || 0),
                    targetDate: draftGoal.targetDate,
                  },
                ]);
                setDraftGoal({ name: "", target: "", current: "", targetDate: "" });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:brightness-105"
            >
              <Plus size={16} />
              Add Goal
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Budget Signals" eyebrow="March Snapshot">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Rent % of Credits</div>
              <div className="mt-3 ledgr-mono text-3xl">{analytics.adjustedCredits ? `${((analytics.rentSpend / analytics.adjustedCredits) * 100).toFixed(1)}%` : "0%"}</div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Food Spend</div>
              <div className="mt-3 ledgr-mono text-3xl">{formatCurrency(analytics.foodSpend)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Subscriptions</div>
              <div className="mt-3 ledgr-mono text-3xl">{formatCurrency(analytics.subscriptionTotal)}</div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function InsightsTab({ analytics, transactions }) {
  const [mom1, setMom1] = useState(analytics.allMonths?.[analytics.allMonths.length - 1] || "");
  const [mom2, setMom2] = useState(analytics.allMonths?.[analytics.allMonths.length - 2] || "");

  const customMomData = useMemo(() => {
     if (!mom1 || !mom2) return null;
     const currentSpend = analytics.monthlySpendMap[mom1] || 0;
     const previousSpend = analytics.monthlySpendMap[mom2] || 0;
     const difference = currentSpend - previousSpend;
     const percentChange = previousSpend > 0 ? (difference / previousSpend) * 100 : 0;
     return { currentMonth: mom1, currentSpend, previousMonth: mom2, previousSpend, difference, percentChange };
  }, [mom1, mom2, analytics.monthlySpendMap]);

  if (!analytics.spendByCategory.length) {
    return <EmptyState title="Insights will appear here" message="Ledgr watches for rent, subscriptions, self-transfers, large anomalies, and refund loops once transactions are loaded." />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Rent Alert" eyebrow="Large Fixed Cost">
          <div className="rounded-[1.5rem] border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-5">
            <div className="flex items-center gap-3 text-[var(--text)]">
              <AlertTriangle size={18} className="text-[var(--danger)]" />
              {analytics.rentMerchant ? `${analytics.rentMerchant} is auto-classified as Rent` : "Recurring housing spend detected and classified as Rent"}
            </div>
            <div className="mt-4 ledgr-mono text-3xl">{formatCurrency(analytics.rentSpend)}</div>
            <div className="mt-2 text-sm text-[var(--muted)]">{analytics.adjustedCredits ? `${((analytics.rentSpend / analytics.adjustedCredits) * 100).toFixed(1)}% of adjusted credits` : "No credits detected yet"}</div>
          </div>
        </SectionCard>

        <SectionCard title="Month Cash Flow" eyebrow="Adjusted for self-transfer spend">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Credits In</div>
              <div className="mt-3 ledgr-mono text-2xl">{formatCurrency(analytics.cashFlow.grossCredits)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Debits Out</div>
              <div className="mt-3 ledgr-mono text-2xl">{formatCurrency(analytics.cashFlow.grossDebits)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">Adjusted Net</div>
              <div className={`mt-3 ledgr-mono text-2xl ${analytics.cashFlow.adjustedNet >= 0 ? "text-[var(--accent)]" : "text-rose-300"}`}>{formatAmountDisplay(analytics.cashFlow.adjustedNet)}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {customMomData && analytics.allMonths.length >= 2 ? (
        <SectionCard title="Comparison View" eyebrow="Custom Timeframe Diff">
          <div className="flex items-center gap-3 mb-4">
            <select value={mom2} onChange={e => setMom2(e.target.value)} className="bg-[var(--surface-5)] border border-[var(--line-10)] rounded-xl px-4 py-2 text-sm text-[var(--muted)] outline-none hover:border-[var(--line-20)] cursor-pointer">
                 {analytics.allMonths.map(m => <option key={m} value={m}>{new Date(m + "-01").toLocaleString("default", { month: "short", year: "numeric" })}</option>)}
            </select>
            <span className="text-[var(--text-60)] text-xs uppercase tracking-widest font-bold px-2">vs</span>
            <select value={mom1} onChange={e => setMom1(e.target.value)} className="bg-[var(--surface-5)] border border-[var(--accent)]/30 rounded-xl px-4 py-2 text-sm text-[var(--accent)] font-semibold outline-none hover:border-[var(--accent)]/60 cursor-pointer">
                 {analytics.allMonths.map(m => <option key={m} value={m}>{new Date(m + "-01").toLocaleString("default", { month: "short", year: "numeric" })}</option>)}
            </select>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-5 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-strong)] to-transparent pointer-events-none z-0 opacity-50" />
             <div className="relative z-10">
               <div className="flex items-start justify-between gap-4 mb-6">
                 <div>
                   <h3 className="text-xl ledgr-display text-[var(--text)]">
                     {customMomData.difference <= 0 ? "Excellent constraint." : "You spent more in this period."}
                   </h3>
                   <p className="text-sm text-[var(--muted)] mt-1 max-w-lg leading-relaxed">
                     Compared to {new Date(customMomData.previousMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })}, your overall personal spend has {customMomData.difference <= 0 ? "decreased" : "increased"} by {formatCurrency(Math.abs(customMomData.difference))}.
                     This is a {Math.abs(customMomData.percentChange).toFixed(1)}% {customMomData.percentChange <= 0 ? "drop" : "rise"} in expenditures.
                   </p>
                 </div>
                 <div className={`shrink-0 flex items-center justify-center p-3 rounded-2xl ${customMomData.percentChange <= 0 ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-rose-500/10 text-rose-400"}`}>
                    {customMomData.percentChange <= 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-[var(--surface-strong)] rounded-xl border border-[var(--line-5)]">
                   <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Base ({new Date(customMomData.previousMonth + "-01").toLocaleString("default", { month: "short", year: "numeric" })})</div>
                   <div className="ledgr-mono text-xl">{formatCurrency(customMomData.previousSpend)}</div>
                 </div>
                 <div className="p-4 bg-[var(--surface-strong)] rounded-xl border border-[var(--line-5)]">
                   <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Target ({new Date(customMomData.currentMonth + "-01").toLocaleString("default", { month: "short", year: "numeric" })})</div>
                   <div className="ledgr-mono text-xl">{formatCurrency(customMomData.currentSpend)}</div>
                 </div>
               </div>
             </div>
          </div>
        </SectionCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Subscription Audit" eyebrow="Recurring Ledger">
          <div className="space-y-3">
            {analytics.subscriptions.map((subscription) => (
              <div key={subscription.merchant} className="flex items-center justify-between rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-4">
                <div>
                  <div className="font-medium text-[var(--text)]">{subscription.merchant}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">{subscription.flagged ? "Above ₹200/month" : "Within acceptable monthly range"}</div>
                </div>
                <div className="text-right">
                  <div className="ledgr-mono text-xl">{formatCurrency(subscription.total)}</div>
                  {subscription.flagged ? <div className="mt-1 text-xs uppercase tracking-[0.24em] text-rose-200">Audit me</div> : null}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Self-Transfer Reconciliation" eyebrow="Cross-Account Mirror Pairs">
          <div className="space-y-3">
            {analytics.selfTransferPairs.map((pair, index) => (
              <div key={`${pair.amount}-${index}`} className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--text)]">{pair.from} to {pair.to}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{pair.debitDate} mirrored by {pair.creditDate}</div>
                  </div>
                  <div className="ledgr-mono text-xl">{formatCurrency(pair.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Anomaly Detection" eyebrow="Outlier Spend">
          <div className="space-y-3">
            {analytics.anomalies.map((transaction) => (
              <div key={transaction.id} className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-[var(--text)]">{transaction.merchant}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{transaction.category} • {formatLongDate(transaction.statementDate)}</div>
                  </div>
                  <div className="ledgr-mono text-xl text-rose-200">{formatCurrency(transaction.debit)}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Pattern Notes" eyebrow="Auto-generated">
          <div className="space-y-4 text-sm text-[var(--text-80)]">
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="font-medium text-[var(--text)]">Sports & Recreation</div>
              <div className="mt-2 text-[var(--muted)]">
                {analytics.sportsMerchants.length
                  ? `${analytics.sportsMerchants.slice(0, 2).join(" + ")} rolled into the sports bucket for a total of ${formatCurrency(analytics.sportsSpend)}.`
                  : `Sports merchants are grouped automatically for a total of ${formatCurrency(analytics.sportsSpend)}.`}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="font-medium text-[var(--text)]">{analytics.refundLoop ? `${analytics.refundLoop.merchant} refund loop` : "Refund tracking"}</div>
              <div className="mt-2 text-[var(--muted)]">
                {analytics.refundLoop
                  ? `Gross spend ${formatCurrency(analytics.refundLoop.gross)}, refunds ${formatCurrency(analytics.refundLoop.refunds)}, net exposure ${formatCurrency(analytics.refundLoop.net)}. Cashback credits tracked separately: ${formatCurrency(analytics.cashbackTotal)}.`
                  : `Merchant refunds and cashbacks are netted automatically once a matching credit appears in the ledger.`}
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
              <div className="font-medium text-[var(--text)]">Statement integrity</div>
              <div className="mt-2 text-[var(--muted)]">Self transfers remain visible in the ledger, but they never inflate spending cards or category charts.</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {analytics.emotionalSpends && analytics.emotionalSpends.length > 0 && (
        <SectionCard title="Emotional Spend Layer" eyebrow="Behavioral Analysis">
          <div className="space-y-4">
            {analytics.emotionalSpends.map((binge, idx) => (
               <div key={idx} className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-5 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-[var(--danger)]/5 to-transparent pointer-events-none opacity-50 transition-opacity group-hover:opacity-100" />
                 <div className="relative z-10 flex items-start justify-between gap-4">
                   <div>
                     <h4 className="font-medium text-[var(--danger)] text-lg mb-1 flex items-center gap-2">
                       <Zap size={18} className="fill-[var(--danger)]/20" /> Stress Spend Pattern Detected
                     </h4>
                     <p className="text-sm text-[var(--muted)] max-w-md">
                        On <span className="text-[var(--text-80)]">{binge.statementDate ? formatLongDate(binge.statementDate) : binge.date}</span>, you made <span className="font-medium text-[var(--danger)]/80">{binge.count} separate transactions</span> in flexible categories ({binge.categories.join(', ')}). High-frequency clustering often correlates with emotional/stress-spending rather than planned budgeting.
                     </p>
                   </div>
                   <div className="shrink-0 text-right">
                     <div className="ledgr-mono text-2xl text-[var(--text)]">{formatCurrency(binge.total)}</div>
                     <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mt-1">Total Daily Outflow</div>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SubscriptionsTab({ analytics }) {
  if (!analytics.subscriptions.length) {
    return <EmptyState title="No subscriptions yet" message="Ledgr auto-detects recurring charges once you add transactions. Watch for patterns!" />;
  }

  const sortedBySpend = [...analytics.subscriptions].sort((a, b) => b.total - a.total);
  const totalMonthly = analytics.subscriptions.reduce((sum, s) => sum + s.total, 0);
  const flaggedCount = analytics.subscriptions.filter(s => s.flagged).length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SectionCard title="Total Monthly" eyebrow="All Subscriptions">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ledgr-mono text-3xl text-[var(--accent)]">
            {formatCurrency(totalMonthly)}
          </motion.div>
          <div className="mt-3 text-xs text-[var(--muted)]">{analytics.subscriptions.length} active subscriptions</div>
        </SectionCard>

        <SectionCard title="Flagged" eyebrow="Above ₹200/mo">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`ledgr-mono text-3xl ${flaggedCount > 0 ? "text-[var(--danger)]" : "text-emerald-400"}`}>
            {flaggedCount}
          </motion.div>
          <div className="mt-3 text-xs text-[var(--muted)]">Consider cancelling</div>
        </SectionCard>

        <SectionCard title="Savings Potential" eyebrow="If cancelled all">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ledgr-mono text-3xl text-lime-300">
            {formatCurrency(totalMonthly * 12)}
          </motion.div>
          <div className="mt-3 text-xs text-[var(--muted)]">Per year</div>
        </SectionCard>
      </div>

      <SectionCard title="Subscription Manager" eyebrow="Smart Recurring Tracker">
        <div className="space-y-2">
          {sortedBySpend.map((subscription, index) => (
            <motion.div key={subscription.merchant} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`flex items-center justify-between rounded-[1.25rem] border p-4 ${subscription.flagged ? "border-[var(--danger)]/40 bg-[var(--danger)]/5" : "border-[var(--line-10)] bg-[var(--surface-5)]"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-[var(--text)]">{subscription.merchant}</div>
                  {subscription.flagged && <span className="text-[10px] uppercase tracking-wider rounded-full bg-[var(--danger)]/20 text-[var(--danger)] px-2 py-0.5">Audit</span>}
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">{subscription.count} charge{subscription.count > 1 ? "s" : ""}</div>
              </div>
              <div className="text-right">
                <div className="ledgr-mono text-lg text-[var(--accent)]">{formatCurrency(subscription.total)}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{(subscription.total / subscription.count).toFixed(0)}/month avg</div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Account Breakdown" eyebrow="Multi-Account Aggregation">
        <div className="grid gap-3 sm:grid-cols-2">
          {analytics.banks.map((bank) => {
            const meta = BANK_META[bank] || BANK_META.DEFAULT;
            const [borderClass, bgClass, textClass] = meta.card.split(" ");
            return (
              <div key={bank} className={`rounded-[1.25rem] p-4 ${borderClass} ${bgClass}`}>
                <div className="text-sm font-medium text-[var(--text)]">{bank} Account</div>
                <div className="mt-3 flex items-end gap-2">
                  <span className={`ledgr-mono text-2xl ${textClass}`}>{analytics.bankCounts[bank]}</span>
                  <span className="text-xs text-[var(--muted)]">transactions</span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function TransactionsTab({ rows, filters, setFilters, page, setPage, totalPages, onExport, onOpenTransaction, maxAmount, reviewRows, bankOptions }) {
  return (
    <div className="grid gap-6">
      <SectionCard title="Transaction Explorer" eyebrow="Filters + Export" action={<button type="button" onClick={onExport} className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] transition hover:bg-[var(--surface-5)]"><Download size={16} /> Export CSV</button>}>
        <div className="grid gap-4 lg:grid-cols-6">
          <select value={filters.bank} onChange={(event) => setFilters((current) => ({ ...current, bank: event.target.value }))} className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none">
            {bankOptions.map((option) => <option key={option} value={option} className="bg-[var(--surface-strong)]">{option}</option>)}
          </select>
          <select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none">
            {["All", ...CATEGORY_OPTIONS].map((option) => <option key={option} value={option} className="bg-[var(--surface-strong)]">{option}</option>)}
          </select>
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none">
            {["All", "Debit", "Credit", "Refund", "Self Transfer"].map((option) => <option key={option} value={option} className="bg-[var(--surface-strong)]">{option}</option>)}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none" />
          <input type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} className="rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-sm text-[var(--text)] outline-none" />
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-40)]" />
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search merchant or notes" className="w-full rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] py-3 pl-11 pr-4 text-sm text-[var(--text)] outline-none" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="block rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
              <span>Min Amount</span>
              <span className="ledgr-mono">{formatCurrency(filters.amountMin)}</span>
            </div>
            <input type="range" min="0" max={maxAmount} step="10" value={filters.amountMin} onChange={(event) => setFilters((current) => ({ ...current, amountMin: Number(event.target.value) }))} className="range-input mt-4 w-full" />
          </label>
          <label className="block rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] p-4">
            <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
              <span>Max Amount</span>
              <span className="ledgr-mono">{formatCurrency(filters.amountMax)}</span>
            </div>
            <input type="range" min="0" max={maxAmount} step="10" value={filters.amountMax} onChange={(event) => setFilters((current) => ({ ...current, amountMax: Number(event.target.value) }))} className="range-input mt-4 w-full" />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Filtered Ledger" eyebrow={`Page ${page} of ${Math.max(totalPages, 1)}`}>
        {rows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  <tr>
                    <th className="px-4">Date</th>
                    <th className="px-4">Merchant</th>
                    <th className="px-4">Category</th>
                    <th className="px-4">Bank</th>
                    <th className="px-4">Type</th>
                    <th className="px-4">Amount</th>
                    <th className="px-4">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((transaction) => (
                    <tr key={transaction.id} className="cursor-pointer rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] transition hover:bg-[var(--surface-5)]" onClick={() => onOpenTransaction(transaction)}>
                      <td className="rounded-l-2xl px-4 py-4 text-[var(--text-80)]">{formatLongDate(transaction.statementDate)}</td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--text)]">{transaction.merchant}</div>
                        {transaction.notes ? <div className="mt-1 text-xs text-[var(--muted)]">{transaction.notes}</div> : null}
                      </td>
                      <td className="px-4 py-4"><CategoryChip category={transaction.category} /></td>
                      <td className="px-4 py-4"><BankBadge bank={transaction.bank} /></td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] ${transaction.isRefund ? "border border-emerald-400/30 text-emerald-200" : transaction.isSelfTransfer ? "border border-slate-400/30 text-slate-200" : "border border-[var(--line-10)] text-[var(--text-65)]"}`}>
                          {getTypeLabel(transaction)}
                        </span>
                      </td>
                      <td className={`px-4 py-4 ledgr-mono ${transaction.credit > 0 ? "text-emerald-300" : "text-[var(--text)]"}`}>{transaction.credit > 0 ? "+" : "-"}{formatCurrency(transaction.amount)}</td>
                      <td className="rounded-r-2xl px-4 py-4 text-[var(--text-55)]"><Pencil size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-2xl border border-[var(--line-10)] px-4 py-2 text-sm text-[var(--text-70)] transition hover:bg-[var(--surface-5)]">Previous</button>
              <div className="text-sm text-[var(--muted)]">{rows.length} rows on this page</div>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-2xl border border-[var(--line-10)] px-4 py-2 text-sm text-[var(--text-70)] transition hover:bg-[var(--surface-5)]">Next</button>
            </div>
          </>
        ) : (
          <EmptyState title="No matching transactions" message="Adjust your bank, category, date, or amount filters to widen the query." />
        )}
      </SectionCard>

      {reviewRows.length ? <EmptyState title="Review Section" message={`${reviewRows.length} rows were kept aside because they could not be parsed safely. They remain visible in the import console for manual review.`} /> : null}
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  return (
    <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] px-3 py-2 text-xs font-medium text-[var(--muted)] ledgr-mono select-none">
      <span className="text-[var(--text)]">{time}</span>
      <span>·</span>
      <span>{date}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURE 8: Split Bills / P2P Tracker (Bucket System)
   ═══════════════════════════════════════════════════════════════════════════ */
function SplitsTab({ transactions, splitGroups, setSplitGroups, onTabChange }) {
  const [dragHover, setDragHover] = useState(null);
  
  const ensureMigrated = (groups) => {
    let migrated = false;
    const next = { ...groups };
    for (const key in next) {
      if (Array.isArray(next[key])) {
        next[key] = { debits: [key], credits: next[key] };
        migrated = true;
      }
    }
    return { data: next, migrated };
  };

  useEffect(() => {
    const { data, migrated } = ensureMigrated(splitGroups);
    if (migrated) setSplitGroups(data);
  }, [splitGroups, setSplitGroups]);

  const groups = ensureMigrated(splitGroups).data;

  const handleDrop = (e, groupId) => {
    e.preventDefault();
    setDragHover(null);
    const rawData = e.dataTransfer.getData("application/json");
    if (!rawData) return;
    try {
      const payload = JSON.parse(rawData);
      // Older drag format just sent an ID string, new format sends { id, type }
      const creditId = typeof payload === 'string' ? payload : (payload.type === 'credit' ? payload.id : null);
      const debitId = typeof payload === 'object' && payload.type === 'debit' ? payload.id : null;
      
      setSplitGroups(prev => {
        const { data: next } = ensureMigrated(prev);
        
        // Remove from other groups
        for (const key in next) {
          if (creditId) next[key].credits = next[key].credits.filter(id => id !== creditId);
          if (debitId) next[key].debits = next[key].debits.filter(id => id !== debitId);
        }
        
        if (!next[groupId]) next[groupId] = { debits: [], credits: [] };
        if (creditId && !next[groupId].credits.includes(creditId)) next[groupId].credits.push(creditId);
        if (debitId && !next[groupId].debits.includes(debitId)) next[groupId].debits.push(debitId);
        
        return next;
      });
    } catch (err) {
       console.error("Invalid drop data");
    }
  };

  const createBucket = (debitId) => {
    setSplitGroups(prev => {
      const { data: next } = ensureMigrated(prev);
      if (!next[debitId]) next[debitId] = { debits: [debitId], credits: [] };
      return next;
    });
  };

  const removeBucket = (groupId) => {
    setSplitGroups(prev => {
      const { data: next } = ensureMigrated(prev);
      delete next[groupId];
      return next;
    });
  };

  const renameBucket = (groupId, newName) => {
    setSplitGroups(prev => {
      const { data: next } = ensureMigrated(prev);
      if (next[groupId]) next[groupId].name = newName;
      return next;
    });
  };

  const removeCredit = (groupId, creditId) => {
     setSplitGroups(prev => {
       const { data: next } = ensureMigrated(prev);
       if (next[groupId]) next[groupId].credits = next[groupId].credits.filter(id => id !== creditId);
       return next;
     });
  }

  const removeDebit = (groupId, debitId) => {
     setSplitGroups(prev => {
       const { data: next } = ensureMigrated(prev);
       if (next[groupId]) {
           next[groupId].debits = next[groupId].debits.filter(id => id !== debitId);
           if (next[groupId].debits.length === 0 && next[groupId].credits.length === 0) {
               delete next[groupId];
           }
       }
       return next;
     });
  }

  const handleMobileMove = (id, type, groupId) => {
    setSplitGroups(prev => {
      const { data: next } = ensureMigrated(prev);
      for (const key in next) {
        if (type === 'credit') next[key].credits = next[key].credits.filter(cId => cId !== id);
        if (type === 'debit') next[key].debits = next[key].debits.filter(dId => dId !== id);
      }
      if (!next[groupId]) next[groupId] = { debits: [], credits: [] };
      if (type === 'credit' && !next[groupId].credits.includes(id)) next[groupId].credits.push(id);
      if (type === 'debit' && !next[groupId].debits.includes(id)) next[groupId].debits.push(id);
      for (const key in next) {
          if (next[key].debits.length === 0 && next[key].credits.length === 0) delete next[key];
      }
      return next;
    });
  };

  const linkedCreditIds = new Set(Object.values(groups).flatMap(g => g.credits));
  const linkedDebitIds = new Set(Object.values(groups).flatMap(g => g.debits));

  const buckets = Object.entries(groups).map(([groupId, group]) => {
     const debs = group.debits.map(id => transactions.find(t => t.id === id)).filter(Boolean);
     const creds = group.credits.map(id => transactions.find(t => t.id === id)).filter(Boolean);
     return { groupId, name: group.name, debits: debs, credits: creds };
  }).filter(b => b.debits.length > 0 || b.credits.length > 0);
  
  const sortDesc = (a, b) => b.statementDate.localeCompare(a.statementDate) || b.sequence - a.sequence;
  
  const unlinkedCredits = transactions
    .filter(t => t.credit > 0 && !t.isSelfTransfer && t.category !== "Interest Income" && !linkedCreditIds.has(t.id))
    .sort(sortDesc).slice(0, 40);
    
  const potentialDebits = transactions
    .filter(t => t.debit >= 150 && !t.isSelfTransfer && !linkedDebitIds.has(t.id))
    .sort(sortDesc).slice(0, 40);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="ledgr-display text-2xl">Split Bills Tracker</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Drag and drop unlinked credits or debits into your groups to track clubbed recoveries.</p>
          </div>
        </div>

        {buckets.length === 0 ? (
          <EmptyState title="No active splits" message="Create a group from your recent expenses on the right to start tracking." />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {buckets.map(bucket => {
              const totalDebit = bucket.debits.reduce((s, d) => s + d.debit, 0);
              const totalRecovered = bucket.credits.reduce((s, c) => s + c.credit, 0);
              const progress = Math.min(100, totalDebit ? (totalRecovered / totalDebit) * 100 : 100);
              const complete = progress >= 100 && totalDebit > 0;
              const mainDebit = bucket.debits[0] || { merchant: 'Custom Group', statementDate: '' };
              const title = bucket.debits.length > 1 ? `${mainDebit.merchant} + ${bucket.debits.length - 1} more` : mainDebit.merchant;

              return (
                <div 
                  key={bucket.groupId} 
                  className={`glass-card p-5 relative overflow-hidden transition-all flex flex-col justify-between ${dragHover === bucket.groupId ? "ring-2 ring-[var(--accent)] bg-[var(--accent)]/5" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragHover(bucket.groupId); }}
                  onDragLeave={() => setDragHover(null)}
                  onDrop={(e) => handleDrop(e, bucket.groupId)}
                >
                  <div>
                    {complete && <div className="absolute top-4 right-4"><CheckCircle2 className="text-[var(--accent)]" size={20} /></div>}
                    <div className="flex justify-between items-start mb-4 pr-6">
                      <div className="min-w-0 pr-4 w-full">
                        <input
                          type="text"
                          value={bucket.name || ""}
                          placeholder={title}
                          onChange={(e) => renameBucket(bucket.groupId, e.target.value)}
                          className="text-lg ledgr-display font-medium w-full bg-transparent border-none outline-none placeholder:text-[var(--text)] transition focus:border-b focus:border-[var(--line-10)]"
                        />
                        <div className="text-xs text-[var(--muted)] mt-1">{mainDebit.statementDate ? formatLongDate(mainDebit.statementDate) : "Clubbed Group"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="ledgr-mono font-bold text-[var(--text)]">{formatCurrency(totalDebit, 0)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mt-0.5">Total Split</div>
                      </div>
                    </div>

                    <div className="h-2 bg-[var(--surface-5)] rounded-full overflow-hidden mb-2">
                      <div className={`h-full transition-all ${complete ? "bg-[var(--accent)]" : "bg-[var(--text)]"}`} style={{ width: `${progress}%` }} />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-[var(--muted)] mb-5">
                      <span className={complete ? "text-[var(--accent)]" : ""}>{formatCurrency(totalRecovered, 0)} recovered</span>
                      <span>{formatCurrency(Math.max(0, totalDebit - totalRecovered), 0)} left</span>
                    </div>

                    <div className="space-y-2">
                      {bucket.credits.length === 0 && bucket.debits.length <= 1 && (
                        <div className="text-center p-4 py-6 border border-dashed border-[var(--line-10)] rounded-xl text-xs text-[var(--text-50)]">
                          Drop recovered credits or extra debits here
                        </div>
                      )}
                      
                      {bucket.debits.length > 1 && (
                         <div className="mb-2">
                           <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Clubbed Expenses</div>
                           {bucket.debits.map(d => (
                              <div key={d.id} className="flex justify-between items-center bg-[var(--surface-strong)] rounded-lg px-3 py-1.5 text-xs mb-1">
                                <span className="truncate pr-2 text-[var(--text-80)]">{d.merchant}</span>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="ledgr-mono text-[var(--text)]">-{formatCurrency(d.debit, 0)}</span>
                                  <button type="button" onClick={() => removeDebit(bucket.groupId, d.id)} className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors"><X size={14}/></button>
                                </div>
                              </div>
                           ))}
                         </div>
                      )}

                      {bucket.credits.length > 0 && (
                         <div className="mt-2">
                           <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-1">Recovered</div>
                           {bucket.credits.map(c => (
                             <div key={c.id} className="flex justify-between items-center bg-[var(--surface-strong)] rounded-lg px-3 py-2 text-xs mb-1">
                               <span className="truncate pr-2 font-medium">{c.merchant !== "Unclassified" ? c.merchant : titleCase(c.rawDescription.slice(0,25))}</span>
                               <div className="flex items-center gap-3 shrink-0">
                                 <span className="ledgr-mono text-[var(--accent)]">+{formatCurrency(c.credit, 0)}</span>
                                 <button type="button" onClick={() => removeCredit(bucket.groupId, c.id)} className="text-[var(--muted)] hover:text-[var(--danger)] transition-colors"><X size={14}/></button>
                               </div>
                             </div>
                           ))}
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--line-10)] text-right">
                    <button type="button" onClick={() => removeBucket(bucket.groupId)} className="text-xs text-[var(--danger)]/70 hover:text-[var(--danger)] transition-colors cursor-pointer">
                      Delete Group
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        <div className="glass-card flex flex-col h-[calc(100vh-140px)] sticky top-6">
          <div className="p-4 border-b border-[var(--line-10)]">
            <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Pool</div>
            <div className="mt-1 text-sm font-semibold text-[var(--text)]">Unlinked Items</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium">Credits to Recover</div>
            {unlinkedCredits.length === 0 ? (
               <div className="p-4 text-center text-xs text-[var(--muted)]">No unlinked credits available.</div>
            ) : unlinkedCredits.map(credit => (
              <div
                key={credit.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify({ id: credit.id, type: 'credit' }));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="cursor-move p-3 rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] hover:border-[var(--accent)] hover:bg-[var(--surface-strong)] transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[var(--text)] truncate">{credit.merchant !== "Unclassified" ? credit.merchant : titleCase(credit.rawDescription)}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">{formatShortDate(credit.statementDate)}</div>
                  </div>
                  <div className="ledgr-mono text-sm font-bold text-[var(--accent)] flex shrink-0 items-center gap-2">
                    <span>+{formatCurrency(credit.credit, 0)}</span>
                    <div className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hidden lg:block">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                    </div>
                  </div>
                </div>
                {/* Mobile action */}
                <div className="block lg:hidden w-full">
                   <select 
                     value="" 
                     onChange={e => e.target.value && handleMobileMove(credit.id, 'credit', e.target.value)}
                     className="w-full bg-[var(--surface-strong)] border border-[var(--line-10)] text-[var(--text)] text-xs px-2 py-1.5 rounded-md outline-none"
                   >
                     <option value="" disabled hidden>Move to group...</option>
                     {buckets.map(b => (
                       <option key={b.groupId} value={b.groupId}>{b.name || b.debits[0]?.merchant || "Clubbed Group"}</option>
                     ))}
                   </select>
                </div>
              </div>
            ))}
            
            <div className="px-2 pt-4 pb-1 text-[10px] uppercase tracking-wider text-[var(--muted)] font-medium">Debits to Club (Drag into bucket)</div>
            {potentialDebits.map(debit => (
              <div
                key={debit.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify({ id: debit.id, type: 'debit' }));
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="cursor-move p-3 rounded-lg border border-[var(--line-5)] bg-[var(--surface-strong)] hover:border-[var(--text-30)] hover:bg-[var(--surface-5)] transition-all flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-[var(--text-80)] truncate">{debit.merchant}</div>
                    <div className="text-[9px] text-[var(--muted)] mt-0.5">{formatShortDate(debit.statementDate)}</div>
                  </div>
                  <div className="ledgr-mono text-xs font-bold text-[var(--text)] flex shrink-0 items-center gap-2">
                    <span>-{formatCurrency(debit.debit, 0)}</span>
                    <div className="opacity-0 group-hover:opacity-100 text-[var(--muted)] hidden lg:block">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
                    </div>
                  </div>
                </div>
                {/* Mobile action */}
                <div className="block lg:hidden w-full">
                   <select 
                     value="" 
                     onChange={e => {
                       if (e.target.value === 'NEW') createBucket(debit.id);
                       else if (e.target.value) handleMobileMove(debit.id, 'debit', e.target.value);
                     }}
                     className="w-full bg-[var(--surface)] border border-[var(--line-10)] text-[var(--text)] text-xs px-2 py-1.5 rounded-md outline-none"
                   >
                     <option value="" disabled hidden>Actions...</option>
                     <option value="NEW">+ Create New Group</option>
                     {buckets.map(b => (
                       <option key={b.groupId} value={b.groupId}>Add to: {b.name || b.debits[0]?.merchant || "Clubbed Group"}</option>
                     ))}
                   </select>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[var(--line-10)] bg-[var(--surface-strong)] rounded-b-xl">
             <div className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium mb-3">Create new Bucket</div>
             <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
               {potentialDebits.map(debit => (
                 <button
                   key={debit.id}
                   type="button"
                   onClick={() => createBucket(debit.id)}

                   className="w-full text-left p-2 rounded border border-[var(--line-5)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-5)] transition-all flex justify-between items-center cursor-pointer group"
                 >
                   <div className="min-w-0 pr-2">
                     <div className="text-[11px] font-medium text-[var(--text-80)] truncate group-hover:text-[var(--text)] transition-colors">{debit.merchant}</div>
                     <div className="text-[9px] text-[var(--muted)] mt-0.5">{formatShortDate(debit.statementDate)}</div>
                   </div>
                   <div className="ledgr-mono text-xs font-bold text-[var(--text)] whitespace-nowrap">
                     {formatCurrency(debit.debit, 0)}
                   </div>
                 </button>
               ))}
               {potentialDebits.length === 0 && <div className="text-xs text-[var(--muted)] text-center pb-2">No expenses available.</div>}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [merchantOverrides, setMerchantOverrides] = useState(() => storageGet(STORAGE_KEYS.merchantOverrides, {}));
  const [transactions, setTransactions] = useState(() => storageGet(STORAGE_KEYS.transactions, []));
  const [budgets, setBudgets] = useState(() => storageGet(STORAGE_KEYS.budgets, {}));
  const [goals, setGoals] = useState(() => storageGet(STORAGE_KEYS.goals, []));
  const [reviewRows, setReviewRows] = useState(() => storageGet(STORAGE_KEYS.reviewRows, []));
  const [splitGroups, setSplitGroups] = useState(() => storageGet(STORAGE_KEYS.splitGroups, {}));
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [filters, setFilters] = useState({
    bank: "Both",
    category: "All",
    type: "All",
    dateFrom: "",
    dateTo: "",
    amountMin: 0,
    amountMax: 25000,
    search: "",
  });

  const analytics = useMemo(() => buildAnalytics(transactions), [transactions]);
  const maxAmount = useMemo(() => Math.max(...transactions.map((transaction) => transaction.amount), 25000), [transactions]);
  const deferredSearch = useDeferredValue(filters.search.trim().toLowerCase());
  const bankOptions = useMemo(() => ["Both", ...analytics.banks], [analytics.banks]);

  useEffect(() => storageSet(STORAGE_KEYS.transactions, transactions), [transactions]);
  useEffect(() => storageSet(STORAGE_KEYS.budgets, budgets), [budgets]);
  useEffect(() => storageSet(STORAGE_KEYS.goals, goals), [goals]);
  useEffect(() => storageSet(STORAGE_KEYS.merchantOverrides, merchantOverrides), [merchantOverrides]);
  useEffect(() => storageSet(STORAGE_KEYS.reviewRows, reviewRows), [reviewRows]);
  useEffect(() => storageSet(STORAGE_KEYS.splitGroups, splitGroups), [splitGroups]);

  useEffect(() => {
    if (transactions.length && !Object.keys(budgets).length) {
      setBudgets(getDefaultBudgets(transactions));
    }
  }, [transactions, budgets]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      amountMax: Math.max(current.amountMax, maxAmount),
    }));
  }, [maxAmount]);

  useEffect(() => {
    setPage(1);
  }, [filters.bank, filters.category, filters.type, filters.dateFrom, filters.dateTo, filters.amountMin, filters.amountMax, deferredSearch]);

  // Keyboard shortcuts: Ctrl+K, ?, 1-6 for tabs
  useEffect(() => {
    const handler = (e) => {
      // Skip if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        return;
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
        return;
      }
      if (e.key === "Escape") {
        setShortcutsOpen(false);
        setCommandPaletteOpen(false);
        return;
      }
      // Number keys 1-7 switch tabs
      const tabKeys = { '1': 'overview', '2': 'transactions', '3': 'subscriptions', '4': 'budget', '5': 'analysis', '6': 'insights', '7': 'splits' };
      if (tabKeys[e.key] && !e.ctrlKey && !e.metaKey) {
        setActiveTab(tabKeys[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addToast = (title, message = "", type = "success") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, title, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3400);
  };

  const loadDemo = () => {
    const demoTransactions = buildDemoTransactions(merchantOverrides);
    startTransition(() => {
      setTransactions(dedupeTransactions(demoTransactions));
      setBudgets(getDefaultBudgets(demoTransactions));
      setReviewRows([]);
    });
    addToast("Demo data loaded", `✓ ${demoTransactions.filter((item) => item.bank === "SBI").length} SBI transactions + ${demoTransactions.filter((item) => item.bank === "IOB").length} IOB transactions loaded`);
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      const imported = [];
      const review = [];
      const fallbackMessages = [];
      for (const file of files) {
        let text;
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const buffer = await file.arrayBuffer();
          text = await extractTextFromPDF(buffer);
        } else {
          text = await file.text();
        }
        const result = detectBankAndParse(text);
        if (result.rows.length > 0) {
          imported.push(...result.rows.map((row, index) => buildTransaction(row, transactions.length + imported.length + index, merchantOverrides)));
          review.push(...result.reviewRows);
        } else if (isPdf) {
          const fallbackRows = getKnownPdfFallbackTransactions(file.name, transactions.length + imported.length, merchantOverrides);
          if (fallbackRows.length > 0) {
            imported.push(...fallbackRows);
            fallbackMessages.push(`${file.name}: matched bundled March statement fallback`);
          } else {
            throw new Error(`No structured transactions were extracted from ${file.name}. Try the "Load Demo Data" button or upload a TXT/CSV export.`);
          }
        }
      }
      const merged = dedupeTransactions([...transactions, ...imported]);
      setTransactions(merged);
      setReviewRows((current) => [...current, ...review]);
      if (!Object.keys(budgets).length && merged.length) setBudgets(getDefaultBudgets(merged));
      addToast("Statements imported", `${imported.length.toLocaleString("en-IN")} transactions added`);
      if (fallbackMessages.length > 0) {
        addToast("PDF fallback used", fallbackMessages.join(" | "));
      }
    } catch (error) {
      addToast("Import failed", error.message, "error");
    } finally {
      event.target.value = "";
    }
  };

  const handleSaveTransaction = ({ merchant, category, notes, applyAll, isReimbursable }) => {
    if (!selectedTransaction) return;
    if (applyAll) {
      setMerchantOverrides((current) => ({
        ...current,
        [selectedTransaction.merchantKey]: { merchant, category, notes, isReimbursable },
      }));
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.merchantKey === selectedTransaction.merchantKey
            ? { ...transaction, merchant, category, notes, isReimbursable, isManual: true }
            : transaction
        )
      );
    } else {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === selectedTransaction.id ? { ...transaction, merchant, category, notes, isReimbursable, isManual: true } : transaction
        )
      );
    }
    setSelectedTransaction(null);
    addToast("Classification saved", applyAll ? "All matching merchants updated." : "Transaction updated.");
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filters.bank !== "Both" && transaction.bank !== filters.bank) return false;
      if (filters.category !== "All" && transaction.category !== filters.category) return false;
      if (filters.type === "Debit" && transaction.debit <= 0) return false;
      if (filters.type === "Credit" && transaction.credit <= 0) return false;
      if (filters.type === "Refund" && !transaction.isRefund) return false;
      if (filters.type === "Self Transfer" && !transaction.isSelfTransfer) return false;
      if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
      if (filters.dateTo && transaction.date > filters.dateTo) return false;
      if (transaction.amount < filters.amountMin || transaction.amount > filters.amountMax) return false;
      if (deferredSearch) {
        const haystack = `${transaction.merchant} ${transaction.rawDescription} ${transaction.notes}`.toLowerCase();
        if (!haystack.includes(deferredSearch)) return false;
      }
      return true;
    }).sort((left, right) => (left.date === right.date ? right.sequence - left.sequence : right.date.localeCompare(left.date)));
  }, [transactions, filters.bank, filters.category, filters.type, filters.dateFrom, filters.dateTo, filters.amountMin, filters.amountMax, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / 25));
  const pagedTransactions = filteredTransactions.slice((page - 1) * 25, page * 25);

  const exportFilteredView = () => {
    const header = ["Date", "Merchant", "Category", "Bank", "Type", "Debit", "Credit", "Balance", "Notes", "Raw Description"];
    const rows = filteredTransactions.map((transaction) => [
      transaction.statementDate,
      transaction.merchant,
      transaction.category,
      transaction.bank,
      getTypeLabel(transaction),
      transaction.debit,
      transaction.credit,
      transaction.balance,
      transaction.notes || "",
      transaction.rawDescription,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${`${cell ?? ""}`.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "ledgr-transactions.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    addToast("CSV exported", `${filteredTransactions.length.toLocaleString("en-IN")} rows downloaded`);
  };

  const headerStats = transactions.length
    ? [
        { label: "Adjusted Spend", value: formatCurrency(analytics.totalSpent) },
        { label: "Credits", value: formatCurrency(analytics.adjustedCredits) },
        { label: "Top Merchant", value: analytics.merchantSpend[0]?.merchant || "None" },
      ]
    : [
        { label: "Ready for", value: "SBI + IOB + Canara" },
        { label: "Storage", value: "Local only" },
        { label: "Mode", value: "Dark luxury" },
      ];

  let tabContent = null;
  if (activeTab === "overview") {
    tabContent = <OverviewTab analytics={analytics} transactions={transactions} onOpenTransaction={setSelectedTransaction} onTabChange={setActiveTab} budgets={budgets} />;
  } else if (activeTab === "analysis") {
    tabContent = <AnalysisTab analytics={analytics} transactions={transactions} />;
  } else if (activeTab === "subscriptions") {
    tabContent = <SubscriptionsTab analytics={analytics} />;
  } else if (activeTab === "budget") {
    tabContent = <BudgetTab budgets={budgets} setBudgets={setBudgets} analytics={analytics} goals={goals} setGoals={setGoals} />;
  } else if (activeTab === "insights") {
    tabContent = <InsightsTab analytics={analytics} transactions={transactions} />;
  } else if (activeTab === "splits") {
    tabContent = <SplitsTab transactions={transactions} splitGroups={splitGroups} setSplitGroups={setSplitGroups} onTabChange={setActiveTab} />;
  } else {
    tabContent = (
      <TransactionsTab
        rows={pagedTransactions}
        filters={filters}
        setFilters={setFilters}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        onExport={exportFilteredView}
        onOpenTransaction={setSelectedTransaction}
        maxAmount={maxAmount}
        reviewRows={reviewRows}
        bankOptions={bankOptions}
      />
    );
  }

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex">
        <ToastStack toasts={toasts} />
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          transactions={transactions}
          onNavigate={(tab) => setActiveTab(tab)}
          onAction={(action, payload) => {
            if (action === "demo") loadDemo();
            else if (action === "export") exportFilteredView();
            else if (action === "clear") { setTransactions([]); setBudgets({}); setGoals([]); setReviewRows([]); }
            else if (action === "search" && payload) setFilters(cur => ({ ...cur, search: payload }));
          }}
        />

        {/* ── Sidebar Mobile Overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Sidebar ── */}
        <aside className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 h-screen w-64 shrink-0 bg-[var(--surface)] flex flex-col border-r border-[var(--line-10)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}>
          {/* Logo */}
          <div className="px-6 py-5 flex items-center gap-3 border-b border-[var(--line-10)]">
            <img src={LEDGR_ICON} alt="Ledgr" className="h-8 w-8 rounded" />
            <span className="ledgr-display text-xl tracking-tight text-[var(--text)]">LEDGR</span>
          </div>

          {/* Upload area in sidebar */}
          <div className="px-4 pt-4 pb-2">
            <div className="rounded-lg border border-dashed border-[var(--line-10)] bg-[var(--surface-5)] p-3 text-center">
              <label className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                  <Upload size={14} />
                  <span>Upload Statement</span>
                </div>
                <input type="file" accept=".txt,.csv,.pdf" multiple onChange={handleFileChange} className="hidden" />
              </label>
              <button type="button" onClick={loadDemo} className="mt-2 w-full rounded bg-[var(--accent)]/15 border border-[var(--accent)]/25 py-1.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors cursor-pointer">
                Load Demo Data
              </button>
            </div>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.title}>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{section.title}</div>
                <div className="space-y-0.5">
                  {section.items.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                          active
                            ? "bg-[var(--accent)]/12 text-[var(--accent)] border-l-2 border-[var(--accent)]"
                            : "text-[var(--text-60)] hover:bg-[var(--surface-5)] hover:text-[var(--text)] border-l-2 border-transparent"
                        }`}
                      >
                        <Icon size={16} className={active ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Stats strip */}
          <div className="px-4 pb-5 space-y-2 border-t border-[var(--line-10)] pt-4">
            <button type="button" onClick={() => setShortcutsOpen(true)} className="w-full flex items-center justify-between text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer mb-2">
              <span>Keyboard shortcuts</span>
              <kbd className="rounded border border-[var(--line-10)] bg-[var(--surface-5)] px-1.5 py-0.5 text-[9px] font-mono">?</kbd>
            </button>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Transactions</span>
              <span className="ledgr-mono font-semibold text-[var(--text)]">{transactions.length.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">Banks</span>
              <div className="flex items-center gap-1">
                {analytics.banks.length ? analytics.banks.map(b => <BankBadge key={b} bank={b} />) : <span className="text-[var(--text-40)]">—</span>}
              </div>
            </div>
            {reviewRows.length > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--danger)]">Review queue</span>
                <span className="ledgr-mono font-semibold text-[var(--danger)]">{reviewRows.length}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

          {/* Header */}
          <header className="shrink-0 h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--line-10)] bg-[var(--bg)] gap-2 sm:gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Mobile hamburger */}
              <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors rounded-md cursor-pointer">
                <AlignLeft size={20} />
              </button>
              {/* Mobile logo */}
              <img src={LEDGR_ICON} alt="Ledgr" className="h-7 w-7 rounded lg:hidden shrink-0 hidden sm:block" />
              {/* Live search */}
              <div className="relative max-w-xs w-full min-w-[120px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                <input
                  value={filters.search}
                  onChange={(e) => {
                    setFilters(cur => ({ ...cur, search: e.target.value }));
                    if (e.target.value.trim() && activeTab !== "transactions") setActiveTab("transactions");
                  }}
                  placeholder="Search..."
                  className="w-full bg-[var(--surface-5)] border border-[var(--line-10)] rounded-lg py-2 pl-8 pr-12 sm:pr-16 text-sm text-[var(--text)] placeholder-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border border-[var(--line-10)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/40 transition-colors cursor-pointer"
                >
                  ⌘K
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Live clock */}
              <LiveClock />
              {/* Upload */}
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-[var(--line-10)] bg-[var(--surface-5)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface)] hover:border-[var(--accent)]/40 transition-all">
                <Upload size={14} />
                <span className="hidden sm:inline">Upload</span>
                <input type="file" accept=".txt,.csv,.pdf" multiple onChange={handleFileChange} className="hidden" />
              </label>
              {/* Demo */}
              <button type="button" onClick={loadDemo} className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-black hover:brightness-105 transition-all cursor-pointer">
                <RefreshCcw size={14} />
                <span className="hidden sm:inline">Demo</span>
              </button>
              {/* Clear data */}
              {transactions.length > 0 && (
                <button type="button" onClick={() => { setTransactions([]); setBudgets({}); setGoals([]); setReviewRows([]); }} className="flex items-center gap-2 rounded-lg border border-[var(--danger)]/30 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all cursor-pointer">
                  <X size={14} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </header>

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
                {tabContent}
              </motion.div>
            </div>

            {/* Footer */}
            <footer className="border-t border-[var(--line-10)] px-6 py-5 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <div className="flex items-center gap-2">
                  <img src={LEDGR_ICON} alt="Ledgr" className="h-4 w-4 rounded opacity-60" />
                  <span>Built by{" "}
                    <a href="https://derajyojith.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent)] hover:underline transition-colors">
                      Deraj Yojith
                    </a>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Privacy-first · All data stays local</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">SBI + IOB + Canara</span>
                </div>
              </div>
            </footer>
          </main>
        </div>



        <TransactionDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onSave={handleSaveTransaction} />
        <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </div>
    </>
  );
}


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
