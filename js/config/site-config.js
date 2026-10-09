/**
 * SITE_CONFIG — the single place to edit personal content.
 *
 * Rules used when filling this file:
 *  - Everything here comes from the resume (assets/resume.pdf).
 *  - Anything NOT supplied is left as an empty string "" and the UI hides
 *    that element automatically (e.g. an empty `github` hides every GitHub link).
 *    Nothing is invented.
 */
export const SITE_CONFIG = {
  name: "K Chetan Kumar",
  displayName: { first: "Chetan", last: "Kumar" },
  title: "B.Pharm | Pharmacovigilance | Clinical Research | Clinical SAS",
  roleParts: ["B.Pharm", "Pharmacovigilance", "Clinical Research", "Clinical SAS"],
  tagline:
    "Turning scientific knowledge into safer medicines, better research and data-driven healthcare.",

  /* ---------- 3D model ---------- */
  model: {
    /** Full-quality model (desktop / laptop). 2K WebP textures, Meshopt-compressed. */
    url: "./assets/chetan-kumar.glb",
    /** Lighter model (phones / low-memory devices). 1K textures, fewer triangles. */
    liteUrl: "./assets/chetan-kumar-lite.glb",
    /** Approximate file sizes, used only to draw a truthful progress bar when the
     *  server compresses responses and hides Content-Length. */
    approxBytes: 2840376,
    approxBytesLite: 1095324,
    /** Extra yaw (degrees) added so 0° is the face-forward view. Tweak if needed. */
    yawOffsetDeg: 0,
    /** Fallback still image if WebGL / GLB fails. */
    fallbackImage: "./assets/portrait.jpg",
  },

  resume: "./assets/resume.pdf",

  /* ---------- links (empty string = hidden) ---------- */
  social: {
    linkedin: "https://www.linkedin.com/in/k-chetan-kumar-7019334362c/",
    github: "", // add your GitHub URL here — buttons appear automatically
    email: "kchetankumar2426@gmail.com",
  },

  location: "Ballari, Karnataka, India",
  languages: ["English", "Kannada", "Hindi", "Telugu"],

  /* ---------- copy ---------- */
  about: {
    summary: [
      "B.Pharm graduate with training across Pharmacovigilance, Clinical Research and Clinical Data Management.",
      "Passionate about drug safety, clinical research and creating impact through data-driven healthcare solutions.",
    ],
    long:
      "Skilled in accurate documentation, data handling and quality-focused analytical work — supported by hands-on exposure through industrial training and a validated analytical research project. Seeking an entry-level opportunity to apply pharmacovigilance, clinical research and clinical data management knowledge in a professional pharmaceutical setting.",
    facts: [
      { label: "Based in", value: "Ballari, Karnataka" },
      { label: "Degree", value: "B.Pharm, 2021 – 2025" },
      { label: "Languages", value: "English · Kannada · Hindi · Telugu" },
    ],
  },

  expertise: [
    {
      id: "pv",
      icon: "shield",
      title: "Pharmacovigilance",
      short: "Drug Safety & Risk Management",
      items: ["Drug Safety", "Adverse Event Reporting", "Risk Management", "Safety Data"],
    },
    {
      id: "cr",
      icon: "flask",
      title: "Clinical Research",
      short: "Trials & Data Management",
      items: ["Clinical Trials", "Study Documentation", "Clinical Data", "Research Processes"],
    },
    {
      id: "sas",
      icon: "chart",
      title: "Clinical SAS",
      short: "Data Analysis & Reporting",
      items: ["SAS Programming", "Data Analysis", "Reporting", "Clinical Data Processing"],
    },
  ],

  /** Supporting skills listed in the resume (shown under Expertise). */
  supporting: [
    "Prescription reading & verification",
    "Inventory & stock handling",
    "UV-Visible Spectroscopy (basic)",
    "Accurate documentation & reporting",
    "MS Word · Excel · PowerPoint",
    "Professional email communication",
    "Analytical thinking",
    "Attention to detail",
    "Teamwork",
    "Time management",
  ],

  education: [
    {
      period: "Nov 2021 – Oct 2025",
      title: "Bachelor of Pharmacy (B.Pharm)",
      institution: "Togari Veeramallappa College",
      affiliation: "Rajiv Gandhi University of Health Sciences, Karnataka",
      grade: "CGPA 7.89",
      featured: true,
    },
    {
      period: "Nov 2020 – Jul 2021",
      title: "12th / PUC — PCMB",
      institution: "Pre University Board, Karnataka",
      affiliation: "",
      grade: "76.5%",
    },
    {
      period: "Sep 2018 – Apr 2019",
      title: "10th / SSLC",
      institution: "Karnataka Secondary Education Examination Board",
      affiliation: "",
      grade: "84.32%",
    },
  ],

  /** Leave `date` / `credentialUrl` empty to hide them. */
  certifications: [
    {
      title: "Certified Pharmacovigilance Associate",
      issuer: "IGMPI",
      date: "",
      credentialUrl: "",
      icon: "shield",
    },
    {
      title: "Advanced Diploma in Clinical Research & Clinical SAS",
      issuer: "CliniLaunch",
      date: "",
      credentialUrl: "",
      icon: "flask",
    },
    {
      title: "CPR Training",
      issuer: "Ballari Medical College and Research Centre (VIMS, Ballari)",
      date: "2025",
      credentialUrl: "",
      icon: "pulse",
    },
  ],

  training: [
    {
      icon: "shield",
      title: "Pharmacovigilance",
      text: "Pharmacovigilance and drug-safety fundamentals.",
      provider: "IGMPI",
    },
    {
      icon: "flask",
      title: "Clinical Research",
      text: "Clinical research fundamentals and clinical-trial documentation.",
      provider: "CliniLaunch",
    },
    {
      icon: "database",
      title: "Clinical Data Management",
      text: "Clinical data management fundamentals.",
      provider: "",
    },
    {
      icon: "chart",
      title: "Clinical SAS",
      text: "Clinical SAS fundamentals.",
      provider: "CliniLaunch",
    },
  ],

  internship: {
    period: "May – Jun 2025",
    role: "Industrial Trainee — Formulation Research & Development",
    org: "Analog Labs",
    text: "Hands-on exposure to formulation research and development processes and laboratory practices in a pharmaceutical industry setting.",
  },

  /** Add more objects to this array to add more case studies. */
  projects: [
    {
      kind: "Academic research project",
      visual: "uv", // "uv" = illustrative UV-Vis schematic beside the text; omit for text-only
      period: "2024 – 2025",
      title: "Method Development and Validation of Duloxetine Hydrochloride by UV-Visible Spectroscopy",
      description:
        "A quantitative UV-Visible spectroscopy method for Duloxetine Hydrochloride in bulk and tablet dosage forms, using Ferric Chloride.",
      role: "Developed and validated the analytical method as part of the final-year B.Pharm project.",
      tags: ["UV-Visible Spectroscopy", "Method Validation", "ICH Q2(R1)", "Calibration & Linearity", "Quality Control"],
      details: [
        "Developed and validated a UV-Visible spectroscopy method for quantitative analysis of Duloxetine Hydrochloride in bulk and tablet dosage forms using Ferric Chloride.",
        "Determined λmax and established linearity using a calibration curve.",
        "Performed method validation with reference to ICH Q2(R1) guidelines.",
        "Applied the validated method to the analysis of marketed tablet formulations.",
      ],
      caseStudyUrl: "", // optional external link (paper / PDF). Empty = opens the built-in case study panel.
      codeUrl: "", // empty = hidden
    },
  ],

  contact: {
    openTo: ["Pharmacovigilance", "Clinical Research", "Clinical Data Management", "Clinical SAS"],
    note: "Seeking an entry-level opportunity in a professional pharmaceutical setting.",
  },

  seo: {
    // Set when you deploy, e.g. "https://yourname.com/". Used for canonical + og:url.
    siteUrl: "",
  },
};
