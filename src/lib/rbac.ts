import { RoleType, ROLE_PERMISSIONS } from "@/lib/auth";

export interface RoleDefinition {
  role: RoleType;
  title: string;
  description: string;
  allowedModules: string[];
}

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    role: "SUPER_ADMIN",
    title: "Super Administrator",
    description: "Unrestricted access to all CRM, POS, BOM, Finance, Google Docs & System Settings.",
    allowedModules: ROLE_PERMISSIONS.SUPER_ADMIN,
  },
  {
    role: "MANAGER",
    title: "Store & Operations Manager",
    description: "Manage orders, POS, inventory, BOM recipes, suppliers, CRM leads, and reports.",
    allowedModules: ROLE_PERMISSIONS.MANAGER,
  },
  {
    role: "CASHIER_POS",
    title: "POS Cashier & Billing Staff",
    description: "Operate POS terminal, barcode scanner, thermal receipts, and order lookup.",
    allowedModules: ROLE_PERMISSIONS.CASHIER_POS,
  },
  {
    role: "SUPPORT_AGENT",
    title: "WhatsApp CRM & Support Agent",
    description: "Manage WhatsApp live chat, human handover escalations, leads pipeline, and follow-ups.",
    allowedModules: ROLE_PERMISSIONS.SUPPORT_AGENT,
  },
  {
    role: "INVENTORY_STAFF",
    title: "Warehouse, Kitchen & BOM Staff",
    description: "Manage product stock, barcode labels, raw ingredients, BOM recipes, and GRN entries.",
    allowedModules: ROLE_PERMISSIONS.INVENTORY_STAFF,
  },
  {
    role: "ACCOUNTANT",
    title: "Finance & Accountant",
    description: "Manage cash flow ledger, COGS audit, supplier payables, P&L, and live Google Docs/Sheets reports.",
    allowedModules: ROLE_PERMISSIONS.ACCOUNTANT,
  },
];
