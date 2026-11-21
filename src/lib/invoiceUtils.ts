import type { InvoiceItemRecord } from "@/lib/store";

/**
 * Safely parse raw invoice/bill items which may be stringified JSON,
 * nested arrays, or standard objects. Prevents raw JSON strings from displaying in UI.
 */
export function parseInvoiceItems(
  rawItems: any,
  fallbackTotal = 0,
  fallbackName = "Items"
): InvoiceItemRecord[] {
  if (!rawItems) {
    return [
      {
        description: fallbackName,
        quantity: 1,
        unit: "lot",
        unitPrice: fallbackTotal,
        totalPrice: fallbackTotal,
      },
    ];
  }

  let parsed = rawItems;
  if (typeof rawItems === "string") {
    const trimmed = rawItems.trim();
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = rawItems;
      }
    }
  }

  if (Array.isArray(parsed)) {
    const flattened: InvoiceItemRecord[] = [];
    for (const it of parsed) {
      if (!it) continue;
      if (typeof it === "string") {
        const itemTrim = it.trim();
        if (
          (itemTrim.startsWith("[") && itemTrim.endsWith("]")) ||
          (itemTrim.startsWith("{") && itemTrim.endsWith("}"))
        ) {
          try {
            const nested = JSON.parse(itemTrim);
            if (Array.isArray(nested)) {
              flattened.push(...parseInvoiceItems(nested, fallbackTotal, fallbackName));
              continue;
            }
          } catch {}
        }
        flattened.push({
          description: it,
          quantity: 1,
          unit: "Pcs",
          unitPrice: fallbackTotal,
          totalPrice: fallbackTotal,
        });
      } else if (typeof it === "object") {
        let desc = it.description || it.name || it.itemName || it.title || "Item";
        if (typeof desc === "string") {
          const descTrim = desc.trim();
          if (
            (descTrim.startsWith("[") && descTrim.endsWith("]")) ||
            (descTrim.startsWith("{") && descTrim.endsWith("}"))
          ) {
            try {
              const nestedDesc = JSON.parse(descTrim);
              if (Array.isArray(nestedDesc)) {
                flattened.push(...parseInvoiceItems(nestedDesc, fallbackTotal, fallbackName));
                continue;
              } else if (nestedDesc && typeof nestedDesc === "object") {
                desc = nestedDesc.name || nestedDesc.itemName || nestedDesc.description || desc;
              }
            } catch {}
          }
        }

        const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
        const uPrice = Number(it.unitPrice ?? it.unitCost ?? it.price ?? 0) || 0;
        const tPrice = Number(it.totalPrice ?? it.total ?? it.lineTotal ?? (qty * uPrice)) || (qty * uPrice);

        flattened.push({
          id: it.id,
          productId: it.productId,
          sku: it.sku || it.barcode,
          description: String(desc),
          unit: it.unit || "Pcs",
          quantity: qty,
          unitPrice: uPrice,
          discount: Number(it.discount || 0),
          totalPrice: tPrice,
        });
      }
    }
    if (flattened.length > 0) return flattened;
  }

  if (parsed && typeof parsed === "object") {
    const qty = Number(parsed.quantity ?? parsed.qty ?? 1) || 1;
    const uPrice = Number(parsed.unitPrice ?? parsed.unitCost ?? parsed.price ?? fallbackTotal) || 0;
    const tPrice = Number(parsed.totalPrice ?? parsed.total ?? fallbackTotal) || (qty * uPrice);
    return [
      {
        description: String(parsed.name || parsed.itemName || parsed.description || fallbackName),
        quantity: qty,
        unit: parsed.unit || "Pcs",
        unitPrice: uPrice,
        totalPrice: tPrice,
      },
    ];
  }

  return [
    {
      description: String(parsed || fallbackName),
      quantity: 1,
      unit: "lot",
      unitPrice: fallbackTotal,
      totalPrice: fallbackTotal,
    },
  ];
}
