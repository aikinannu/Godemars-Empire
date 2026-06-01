export const NAV_ITEMS = [
  { title: "Dashboard", slug: "/dashboard", access: "basic", description: "The central GD workflow hub for your projects and operational overview." },
  { title: "Executive Center", slug: "/executive-center", access: "premium", description: "Enterprise leadership workflows, board insights, and executive approvals." },
  { title: "Cloud Infrastructure", slug: "/cloud-infrastructure", access: "standard", description: "Manage GD infrastructure, cloud deployments, and service orchestration." },
  { title: "CMS Studio", slug: "/cms-studio", access: "standard", description: "Content management workflows for publishing, assets, and editorial operations." },
  { title: "Files Vault", slug: "/files-vault", access: "standard", description: "Secure file storage, sharing, and collaboration." },
  { title: "CRM & ERP", slug: "/crm-erp", access: "premium", description: "Customer and enterprise resource workflow coordination for growth." },
  { title: "Marketing Hub", slug: "/marketing-hub", access: "standard", description: "Campaign workflows, lead journeys, and marketing automation." },
  { title: "E-Banking", slug: "/e-banking", access: "premium", description: "Financial workflows, payments, and banking automation in GD." },
  { title: "Analytics", slug: "/analytics", access: "standard", description: "Insights, dashboards, and data workflows for decisions." },
  { title: "AI Operations", slug: "/ai-operations", access: "premium", description: "AI workflow orchestration and recommendation engines." },
  { title: "Security Center", slug: "/security-center", access: "standard", description: "Security workflows, alerts, and incident response management." },
  { title: "Billing & Licensing", slug: "/billing-licensing", access: "standard", description: "Manage GD billing, plans, and license workflows." },
  { title: "Marketplace", slug: "/marketplace", access: "standard", description: "Discovery workflows for add-ons, licenses, and GD services." },
  { title: "Integrations", slug: "/integrations", access: "standard", description: "Connectors, API integrations, and workflow sync setup." },
  { title: "Developer APIs", slug: "/developer-apis", access: "standard", description: "Developer workflow access to API keys, docs, and automation." },
  { title: "Settings", slug: "/settings", access: "basic", description: "Account, profile, and workspace preference workflows." },
];

export const slugify = (item) => {
  const source = typeof item === "string" ? item : item.title || item.slug || "";
  return `/${source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
};
