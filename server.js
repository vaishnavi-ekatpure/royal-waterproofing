require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
const { quoteMessage } = require("./email");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const quotesFile = path.join(dataDir, "quotes.json");
const hits = new Map();

const SERVICES = [
  "Terrace Waterproofing",
  "Bathroom & Balcony Waterproofing",
  "Water Tank Waterproofing",
  "Basement Waterproofing",
  "Swimming Pool Waterproofing",
  "STP / ETP Tank Waterproofing",
  "Lift Pit Waterproofing",
  "Retaining Wall Waterproofing",
  "Expansion Joint Waterproofing",
  "GI Sheet & Roof Joint Waterproofing",
  "Planter & Garden Waterproofing",
  "Leakage Treatment",
  "PU Injection Grouting",
  "PCC / Base Waterproofing",
  "Not sure — site inspection needed",
];

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.static(publicDir));

function clean(value, max) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanMobile(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : "";
}

function wantsJson(req) {
  const accept = req.headers.accept || "";
  return req.is("application/json") || accept.includes("application/json");
}

function limited(req) {
  const key = req.ip || "local";
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (recent.length >= 8) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function tooFast(body) {
  const started = Number(body.started);
  return Number.isFinite(started) && started > 0 && Date.now() - started < 1500;
}

function saveQuote(quote) {
  fs.mkdirSync(dataDir, { recursive: true });
  const existing = fs.existsSync(quotesFile) ? JSON.parse(fs.readFileSync(quotesFile, "utf8")) : [];
  existing.push(quote);
  fs.writeFileSync(quotesFile, JSON.stringify(existing, null, 2));
}

async function sendMail(message) {
  if (!process.env.MAIL_PASS || !process.env.MAIL_USER) return false;
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  const info = await transporter.sendMail({
    from: `"Royal Waterproofing Company" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_TO || "royalwpco@gmail.com",
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`Test email preview: ${preview}`);
  return true;
}

function reply(req, res, redirectTo, payload, status = 200) {
  if (wantsJson(req)) {
    res.status(status).json(payload);
    return;
  }
  if (status >= 400) {
    res.redirect(303, `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=1`);
    return;
  }
  res.redirect(303, redirectTo);
}

app.post("/api/quote", async (req, res) => {
  try {
    if (req.body.company_site || tooFast(req.body)) {
      reply(req, res, "/?quote=sent#contact", { ok: true });
      return;
    }
    if (limited(req)) {
      reply(req, res, "/?error=1#contact", { ok: false, message: "Please wait a few minutes and try again." }, 429);
      return;
    }

    const quote = {
      name: clean(req.body.name, 80),
      mobile: cleanMobile(req.body.mobile),
      location: clean(req.body.location, 120),
      service: clean(req.body.service, 80),
      problem: clean(req.body.problem, 2000),
      preferredTime: clean(req.body.preferredTime, 80),
      createdAt: new Date().toISOString(),
    };
    const errors = {};
    if (quote.name.length < 2) errors.name = "Enter your name.";
    if (!quote.mobile) errors.mobile = "Enter a 10-digit mobile number.";
    if (quote.location.length < 2) errors.location = "Enter the site location.";
    if (!SERVICES.includes(quote.service)) errors.service = "Choose a service.";
    if (quote.problem.length < 8) errors.problem = "Describe the problem in a short sentence.";
    if (Object.keys(errors).length) {
      reply(req, res, "/?error=1#contact", { ok: false, errors }, 400);
      return;
    }

    saveQuote(quote);
    const emailed = await sendMail(quoteMessage(quote));
    if (!emailed) {
      console.warn("Quote saved locally; email was not sent (check MAIL_USER and MAIL_PASS).");
    }
    reply(req, res, "/?quote=sent#contact", { ok: true, quote });
  } catch (error) {
    console.error("Quote request failed");
    reply(req, res, "/?error=1#contact", { ok: false, message: "The message could not be saved. Please call or WhatsApp the owner." }, 500);
  }
});

app.listen(PORT, () => {
  console.log(`Royal Waterproofing site at http://localhost:${PORT}`);
});
