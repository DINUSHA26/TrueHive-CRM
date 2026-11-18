// Unified Data Layer: Uses Prisma when DATABASE_URL is connected, with rich instant state for immediate operation & testing

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId?: string;
  category?: any;
  description?: string;
  imageUrl?: string;
  images?: any;
  sellingPrice: number;
  discountPrice?: number;
  calculatedCogs: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  trackBom: boolean;
  isActive?: boolean;
  variants?: Array<{
    id: string;
    productId?: string;
    name: string;
    value?: string | null;
    sku: string;
    barcode: string;
    sellingPrice: number;
    priceAdjustment?: number | null;
    currentStock: number;
    image?: string | null;
  }>;
  bom: { ingredientId: string; ingredientName: string; quantityRequired: number; unit: string; unitCost: number }[];
}

export interface IngredientItem {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  unitCost: number;
  supplierName: string;
}

export interface LeadItem {
  id: string;
  customerName: string;
  phone: string;
  town: string;
  stage: "NEW" | "CONTACTED" | "SCHEDULED" | "COMPLETED" | "LOST";
  intent: "HIGH_INTENT" | "ENGAGED" | "EXPLORING" | "URGENT_ESCALATION";
  issueSummary: string;
  businessType: string;
  dailyMessageVolume: string;
  needsMediaSupport: string;
  nextFollowUpAt: string;
  followUpBucket: "OVERDUE" | "TODAY" | "TOMORROW" | "UPCOMING";
  callNotes: string[];
  updatedAgo: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  barcode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  source: "WHATSAPP_AI" | "POS_TERMINAL" | "MANUAL_DASHBOARD";
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentMethod: "CASH" | "CARD" | "BANK_TRANSFER" | "COD";
  paymentStatus: "UNPAID" | "PAID" | "VERIFYING_SLIP";
  items: { productId: string; productName: string; sku: string; barcode: string; quantity: number; unitPrice: number; unitCogs: number; totalPrice: number; discount?: number }[];
  subtotal: number;
  discountAmount: number;
  taxAmount?: number;
  deliveryFee?: number;
  totalAmount: number;
  totalCogs: number;
  cashReceived?: number;
  changeGiven?: number;
  notes?: string;
  bomDeducted: boolean;
  whatsappNotificationsSent: string[];
  createdAt: string;
}

export interface ChatThread {
  id: string;
  customerName: string;
  whatsappPhone: string;
  isAiActive: boolean;
  handoverStatus: "AI_ACTIVE" | "HUMAN_HANDOVER" | "URGENT_ESCALATION";
  unreadCount: number;
  lastMessageText: string;
  lastMessageAt: string;
  messages: {
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    senderType: "CUSTOMER" | "AI_BOT" | "HUMAN_AGENT" | "SYSTEM";
    messageType: "TEXT" | "AUDIO" | "IMAGE" | "INVOICE";
    content: string;
    toolCalls?: string[];
    timestamp: string;
  }[];
}

export interface SupplierRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  creditBalance: number;
  suppliedItems: string[];
}

export interface CashFlowRecord {
  id: string;
  transactionCode: string;
  type: "INCOME" | "EXPENSE" | "SUPPLIER_PAYMENT" | "COGS_RECOGNITION" | "SALARY" | "MARKETING";
  category: string;
  amount: number;
  description: string;
  paymentMethod: string;
  date: string;
}

const globalState = globalThis as unknown as {
  trueHiveStore?: {
    ingredients: IngredientItem[];
    products: ProductItem[];
    leads: LeadItem[];
    orders: OrderRecord[];
    chats: ChatThread[];
    suppliers: SupplierRecord[];
    cashflow: CashFlowRecord[];
    googleSyncHistory: {
      id: string;
      reportTitle: string;
      docUrl: string;
      sheetUrl: string;
      aiNarrative: string;
      lastSyncedAt: string;
    }[];
  };
};

if (!globalState.trueHiveStore) {
  globalState.trueHiveStore = {
    ingredients: [
      { id: "ing-1", name: "Premium Prima Flour", sku: "ING-FLR-01", barcode: "8901001001", unit: "kg", currentStock: 85.5, reorderLevel: 20, unitCost: 290, supplierName: "Ceylon Agro Mills" },
      { id: "ing-2", name: "Belgian Dark Cocoa Powder", sku: "ING-COC-02", barcode: "8901001002", unit: "kg", currentStock: 14.2, reorderLevel: 15, unitCost: 3400, supplierName: "Lanka Food Imports" },
      { id: "ing-3", name: "Anchor Unsalted Butter", sku: "ING-BTR-03", barcode: "8901001003", unit: "kg", currentStock: 32.0, reorderLevel: 10, unitCost: 2850, supplierName: "Fonterra Lankaputhra" },
      { id: "ing-4", name: "Refined White Sugar", sku: "ING-SGR-04", barcode: "8901001004", unit: "kg", currentStock: 120.0, reorderLevel: 25, unitCost: 270, supplierName: "Ceylon Agro Mills" },
      { id: "ing-5", name: "Luxury Gold Foil Cake Box (1kg)", sku: "ING-BOX-05", barcode: "8901001005", unit: "pcs", currentStock: 210, reorderLevel: 50, unitCost: 145, supplierName: "Colombo Print & Pack" },
      { id: "ing-6", name: "Organic Vanilla Pod Extract", sku: "ING-VAN-06", barcode: "8901001006", unit: "L", currentStock: 3.8, reorderLevel: 5, unitCost: 6200, supplierName: "Lanka Food Imports" },
    ],
    products: [
      {
        id: "prod-1",
        name: "Signature Belgian Chocolate Fudge Cake (1kg)",
        sku: "TH-CAKE-001",
        barcode: "479202600101",
        category: "Cakes & Bakery",
        sellingPrice: 3850,
        calculatedCogs: 1485,
        currentStock: 18,
        reorderLevel: 5,
        unit: "pcs",
        trackBom: true,
        bom: [
          { ingredientId: "ing-1", ingredientName: "Premium Prima Flour", quantityRequired: 0.35, unit: "kg", unitCost: 290 },
          { ingredientId: "ing-2", ingredientName: "Belgian Dark Cocoa Powder", quantityRequired: 0.15, unit: "kg", unitCost: 3400 },
          { ingredientId: "ing-3", ingredientName: "Anchor Unsalted Butter", quantityRequired: 0.22, unit: "kg", unitCost: 2850 },
          { ingredientId: "ing-4", ingredientName: "Refined White Sugar", quantityRequired: 0.3, unit: "kg", unitCost: 270 },
          { ingredientId: "ing-5", ingredientName: "Luxury Gold Foil Cake Box (1kg)", quantityRequired: 1, unit: "pcs", unitCost: 145 },
        ],
      },
      {
        id: "prod-2",
        name: "Classic Vanilla Ribbon Gateau (1kg)",
        sku: "TH-CAKE-002",
        barcode: "479202600102",
        category: "Cakes & Bakery",
        sellingPrice: 2950,
        calculatedCogs: 1120,
        currentStock: 24,
        reorderLevel: 6,
        unit: "pcs",
        trackBom: true,
        bom: [
          { ingredientId: "ing-1", ingredientName: "Premium Prima Flour", quantityRequired: 0.4, unit: "kg", unitCost: 290 },
          { ingredientId: "ing-3", ingredientName: "Anchor Unsalted Butter", quantityRequired: 0.25, unit: "kg", unitCost: 2850 },
          { ingredientId: "ing-6", ingredientName: "Organic Vanilla Pod Extract", quantityRequired: 0.02, unit: "L", unitCost: 6200 },
          { ingredientId: "ing-5", ingredientName: "Luxury Gold Foil Cake Box (1kg)", quantityRequired: 1, unit: "pcs", unitCost: 145 },
        ],
      },
      {
        id: "prod-3",
        name: "Assorted Artisan Brownie Box (12 Pcs)",
        sku: "TH-BRW-003",
        barcode: "479202600103",
        category: "Gourmet Boxes",
        sellingPrice: 2450,
        calculatedCogs: 940,
        currentStock: 31,
        reorderLevel: 8,
        unit: "pcs",
        trackBom: true,
        bom: [
          { ingredientId: "ing-2", ingredientName: "Belgian Dark Cocoa Powder", quantityRequired: 0.12, unit: "kg", unitCost: 3400 },
          { ingredientId: "ing-3", ingredientName: "Anchor Unsalted Butter", quantityRequired: 0.14, unit: "kg", unitCost: 2850 },
          { ingredientId: "ing-5", ingredientName: "Luxury Gold Foil Cake Box (1kg)", quantityRequired: 1, unit: "pcs", unitCost: 145 },
        ],
      },
      {
        id: "prod-4",
        name: "Roasted Cashew & Honey Jar (500g)",
        sku: "TH-JAR-004",
        barcode: "479202600104",
        category: "Dry Goods",
        sellingPrice: 2180,
        calculatedCogs: 1050,
        currentStock: 42,
        reorderLevel: 10,
        unit: "pcs",
        trackBom: false,
        bom: [],
      },
    ],
    leads: [],
    orders: [],
    chats: [],
    suppliers: [
      { id: "sup-1", name: "Ceylon Agro Mills (Pvt) Ltd", contactPerson: "Roshan Perera", phone: "+94112345678", email: "orders@ceylonagro.lk", creditBalance: 0, suppliedItems: ["Premium Prima Flour", "Refined White Sugar"] },
      { id: "sup-2", name: "Lanka Food Imports", contactPerson: "Shiranthi Fernando", phone: "+94114567890", email: "supply@lankafoods.lk", creditBalance: 0, suppliedItems: ["Belgian Dark Cocoa Powder", "Organic Vanilla Pod Extract"] },
      { id: "sup-3", name: "Colombo Print & Pack", contactPerson: "Asanka Silva", phone: "+94777123456", email: "sales@colombopack.lk", creditBalance: 0, suppliedItems: ["Luxury Gold Foil Cake Box (1kg)"] },
    ],
    cashflow: [],
    googleSyncHistory: [],
  };
}

export function getStore() {
  return globalState.trueHiveStore!;
}
