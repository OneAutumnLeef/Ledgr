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
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  BusFront,
  ChartColumnBig,
  CircleDollarSign,
  Cpu,
  Download,
  Dumbbell,
  Flame,
  Gamepad2,
  House,
  IndianRupee,
  Landmark,
  LayoutGrid,
  Pencil,
  PiggyBank,
  Plus,
  ReceiptText,
  RefreshCcw,
  Repeat2,
  Search,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  UtensilsCrossed,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import demoSeed from "../demo_seed.json";
import merchantCatalog from "../merchant_catalog.json";
import "./styles.css";

const DEMO_SEED = demoSeed;
const MERCHANT_CATALOG = merchantCatalog;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const STORAGE_KEYS = {
  transactions: "ledgr-transactions",
  budgets: "ledgr-budgets",
  goals: "ledgr-goals",
  merchantOverrides: "ledgr-merchant-overrides",
  reviewRows: "ledgr-review-rows",
};

const TAB_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "analysis", label: "Analysis", icon: ChartColumnBig },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat2 },
  { id: "budget", label: "Budget", icon: PiggyBank },
  { id: "insights", label: "Insights", icon: BrainCircuit },
  { id: "transactions", label: "Transactions", icon: WalletCards },
];

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
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&family=DM+Serif+Display:ital@0;1&display=swap');

  :root {
    --bg: #0A0A0F;
    --surface: rgba(19, 19, 26, 0.82);
    --surface-strong: rgba(19, 19, 26, 0.96);
    --surface-soft: rgba(255, 255, 255, 0.02);
    --accent: #C8F135;
    --secondary: #3B82F6;
    --danger: #FF4D6D;
    --text: #F3F4F6;
    --text-80: rgba(255, 255, 255, 0.8);
    --text-75: rgba(255, 255, 255, 0.75);
    --text-70: rgba(255, 255, 255, 0.7);
    --text-65: rgba(255, 255, 255, 0.65);
    --text-60: rgba(255, 255, 255, 0.6);
    --text-50: rgba(255, 255, 255, 0.5);
    --text-45: rgba(255, 255, 255, 0.45);
    --text-40: rgba(255, 255, 255, 0.4);
    --muted: #6B7280;
    --line: rgba(255,255,255,0.08);
    --line-10: rgba(255, 255, 255, 0.1);
    --line-5: rgba(255, 255, 255, 0.05);
    --surface-5: rgba(255, 255, 255, 0.05);
    --glow: rgba(200, 241, 53, 0.18);
    --shadow: 0 22px 80px rgba(0,0,0,0.45);
  }

  body {
    margin: 0;
    min-height: 100vh;
    background:
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 28%),
      radial-gradient(circle at left center, rgba(200, 241, 53, 0.10), transparent 24%),
      var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    transition: background 260ms ease, color 260ms ease;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: 0.16;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E");
    mix-blend-mode: soft-light;
  }

  .ledgr-display { font-family: 'DM Serif Display', serif; letter-spacing: 0.02em; }
  .ledgr-mono { font-family: 'DM Mono', monospace; font-variant-numeric: tabular-nums; }

  .glass-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--line);
    background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow);
  }

  .glass-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.16), transparent, rgba(200,241,53,0.16));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .soft-grid {
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 22px 22px;
  }

  .mobile-safe { padding-bottom: calc(env(safe-area-inset-bottom) + 6rem); }
  .range-input { accent-color: var(--accent); }
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
  const spendTransactions = sorted.filter((transaction) => transaction.debit > 0 && !transaction.isSelfTransfer);
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

  return {
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
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#C8F135" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <rect x="28" y="26" width="184" height="88" rx="18" fill="rgba(255,255,255,0.04)" stroke="url(#empty-gradient)" strokeWidth="2" />
        <path d="M58 86C82 58 96 66 116 84C138 102 160 50 186 72" fill="none" stroke="url(#empty-gradient)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="84" cy="58" r="9" fill="#C8F135" fillOpacity="0.85" />
        <circle cx="162" cy="52" r="6" fill="#3B82F6" fillOpacity="0.8" />
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
  const [applyAll, setApplyAll] = useState(false);

  useEffect(() => {
    setMerchant(transaction?.merchant || "");
    setCategory(transaction?.category || "Other");
    setNotes(transaction?.notes || "");
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
            </div>

            <div className="mt-auto flex gap-3 pt-6">
              <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-[var(--line-10)] px-4 py-3 text-sm text-[var(--text-70)] transition hover:bg-[var(--surface-5)]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onSave({ merchant, category, notes, applyAll })}
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

function OverviewTab({ analytics, transactions, onOpenTransaction }) {
  if (!transactions.length) {
    return <EmptyState title="No transactions yet" message="Import a statement or load the March demo set to unlock Ledgr's charts, budgets, and smart insights." />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="Total Spent" icon={ArrowDownRight} value={analytics.totalSpent} note="Self transfers excluded from spend" accent="var(--danger)" />
        <MetricCard title="Total Credits" icon={ArrowUpRight} value={analytics.adjustedCredits} note="Non-self credits only" accent="var(--secondary)" />
        <MetricCard title="Net Cash Flow" icon={TrendingUp} value={analytics.cashFlow.adjustedNet} note={analytics.cashFlow.adjustedNet >= 0 ? "Positive month" : "Deficit month"} />
        <MetricCard title="Self Transfers" icon={Repeat2} value={analytics.selfTransferTotal} note="Excluded from KPI spend totals" accent="#94A3B8" />
        <MetricCard title="Biggest Expense" icon={Flame} value={analytics.biggestExpense?.debit || 0} note={analytics.biggestExpense?.merchant || "No debit transactions"} accent="#FB7185" />
        <MetricCard title="Top Category" icon={ChartColumnBig} value={analytics.topCategory?.value || 0} note={analytics.topCategory?.name || "Waiting for spend"} accent={analytics.topCategory?.color || "var(--accent)"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,1fr,0.9fr]">
        <SectionCard title="Spending by Category" eyebrow="March Mix">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.spendByCategory} dataKey="value" nameKey="name" innerRadius={78} outerRadius={118} paddingAngle={2}>
                  {analytics.spendByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Balance Over Time" eyebrow={`${Math.max(analytics.banks.length, 1)}-Account Curve`}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.balanceSeries}>
                <defs>
                  {analytics.banks.map((bank) => {
                    const color = BANK_META[bank]?.color || BANK_META.DEFAULT.color;
                    return (
                      <linearGradient key={bank} id={`${bank.toLowerCase()}-area`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.45)" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
                <Tooltip content={<ChartTooltip />} />
                {analytics.banks.map((bank) => {
                  const color = BANK_META[bank]?.color || BANK_META.DEFAULT.color;
                  return <Area key={bank} type="monotone" dataKey={bank} name={`${bank} Balance`} stroke={color} fill={`url(#${bank.toLowerCase()}-area)`} strokeWidth={2.5} />;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Recent Activity" eyebrow="Latest 10">
          <div className="space-y-3">
            {analytics.recentTransactions.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                onClick={() => onOpenTransaction(transaction)}
                className="flex w-full items-center justify-between rounded-2xl border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-3 text-left transition hover:bg-[var(--surface-5)]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-[var(--text)]">{transaction.merchant}</div>
                    <BankBadge bank={transaction.bank} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <CategoryChip category={transaction.category} />
                    <span className="text-xs text-[var(--muted)]">{formatLongDate(transaction.statementDate)}</span>
                  </div>
                </div>
                <div className={`ledgr-mono text-right ${transaction.credit > 0 ? "text-emerald-300" : "text-[var(--text)]"}`}>
                  {transaction.credit > 0 ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AnalysisTab({ analytics }) {
  if (!analytics.merchantSpend.length) {
    return <EmptyState title="Nothing to analyze yet" message="Spend categories, merchant ranking, subscriptions, and P2P heatmaps appear once debit transactions are available." />;
  }

  return (
    <div className="grid gap-6">
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
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#C8F135" />
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
                style={{ background: `linear-gradient(135deg, rgba(200,241,53,${0.1 + item.intensity * 0.35}), rgba(59,130,246,${0.08 + item.intensity * 0.22}))` }}
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
                  className="ledgr-mono w-36 rounded-2xl border border-[var(--line-10)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text)] outline-none"
                />
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-5)]">
                <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${Math.min(row.percent, 100)}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Actual: {formatCurrency(row.actual)}</span>
                <span className={`ledgr-mono ${row.actual > row.budget && row.budget > 0 ? "text-rose-300" : "text-[var(--text-80)]"}`}>{row.percent.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6">
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

function InsightsTab({ analytics }) {
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
              <div className={`mt-3 ledgr-mono text-2xl ${analytics.cashFlow.adjustedNet >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatAmountDisplay(analytics.cashFlow.adjustedNet)}</div>
            </div>
          </div>
        </SectionCard>
      </div>

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

function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [merchantOverrides, setMerchantOverrides] = useState(() => storageGet(STORAGE_KEYS.merchantOverrides, {}));
  const [transactions, setTransactions] = useState(() => storageGet(STORAGE_KEYS.transactions, []));
  const [budgets, setBudgets] = useState(() => storageGet(STORAGE_KEYS.budgets, {}));
  const [goals, setGoals] = useState(() => storageGet(STORAGE_KEYS.goals, []));
  const [reviewRows, setReviewRows] = useState(() => storageGet(STORAGE_KEYS.reviewRows, []));
  const [selectedTransaction, setSelectedTransaction] = useState(null);
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

  const handleSaveTransaction = ({ merchant, category, notes, applyAll }) => {
    if (!selectedTransaction) return;
    if (applyAll) {
      setMerchantOverrides((current) => ({
        ...current,
        [selectedTransaction.merchantKey]: { merchant, category, notes },
      }));
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.merchantKey === selectedTransaction.merchantKey
            ? { ...transaction, merchant, category, notes, isManual: true }
            : transaction
        )
      );
    } else {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === selectedTransaction.id ? { ...transaction, merchant, category, notes, isManual: true } : transaction
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
    tabContent = <OverviewTab analytics={analytics} transactions={transactions} onOpenTransaction={setSelectedTransaction} />;
  } else if (activeTab === "analysis") {
    tabContent = <AnalysisTab analytics={analytics} />;
  } else if (activeTab === "subscriptions") {
    tabContent = <SubscriptionsTab analytics={analytics} />;
  } else if (activeTab === "budget") {
    tabContent = <BudgetTab budgets={budgets} setBudgets={setBudgets} analytics={analytics} goals={goals} setGoals={setGoals} />;
  } else if (activeTab === "insights") {
    tabContent = <InsightsTab analytics={analytics} />;
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
      <div className="mobile-safe min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <ToastStack toasts={toasts} />
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <header className="glass-card rounded-[2rem] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://images.prismic.io/derajportfolio/acq0eJGXnQHGZG01_ledgr-icon.png?auto=format,compress" alt="Ledgr" className="h-8 w-8" />
                  <div className="text-[11px] uppercase tracking-[0.35em] text-[var(--muted)]">Ledgr</div>
                </div>
                <h1 className="ledgr-display mt-2 text-4xl sm:text-5xl">Personal finance with statement-grade precision.</h1>
                <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">A luxury-fintech dashboard for Indian bank users, tuned for SBI, IOB, and Canara exports, merchant cleanup, budget planning, and refund-aware analytics.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[28rem]">
                {headerStats.map((stat) => (
                  <div key={stat.label} className="rounded-[1.5rem] border border-[var(--line-10)] bg-[var(--surface-5)] px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">{stat.label}</div>
                    <div className="mt-3 ledgr-mono text-lg">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`hidden rounded-full px-4 py-2 text-sm transition md:inline-flex md:items-center md:gap-2 ${active ? "bg-[var(--accent)] text-black" : "border border-[var(--line-10)] bg-[var(--surface-5)] text-[var(--text-75)] hover:bg-[var(--surface-5)]"}`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </header>

          <main className="mt-6 space-y-6">
            <UploadConsole
              onLoadDemo={loadDemo}
              onFileChange={handleFileChange}
              reviewRows={reviewRows}
              transactionCount={transactions.length}
              bankCounts={analytics.bankCounts}
            />
            <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
              {tabContent}
            </motion.div>
            <footer className="glass-card rounded-[1.75rem] px-6 py-6 mt-12 mb-20 text-center">
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
    className="space-y-2"
  >
    <p className="text-sm text-[var(--text)]">
      Built by{" "}
      <a
        href="https://derajyojith.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--accent)] hover:underline transition-all duration-200"
      >
        Deraj Yojith
      </a>
    </p>
    <p className="text-xs text-[var(--muted)]">
      Privacy-first expense tracker for Indian bank users. All data stays local.
    </p>
  </motion.div>
</footer>
          </main>
        </div>

        <nav className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-5 gap-2 rounded-[1.75rem] border border-[var(--line-10)] bg-[var(--surface-strong)] p-2 shadow-2xl backdrop-blur md:hidden">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center gap-1 rounded-[1.25rem] px-2 py-2 text-[11px] ${active ? "bg-[var(--accent)] text-black" : "text-[var(--text-65)]"}`}>
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <TransactionDrawer transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onSave={handleSaveTransaction} />
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
