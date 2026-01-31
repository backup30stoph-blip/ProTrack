
# ProTrack - Production Tracking System Documentation

## 1. Project Overview
ProTrack is a React-based web application designed for industrial production tracking. It manages shift data, shipment orders, and provides real-time analytics across different operational platforms (Big Bag, 50kg). The system persists data using LocalStorage for offline capability and utilizes a responsive design suitable for both desktop and mobile devices.

---

## 2. Technical Stack
*   **Framework:** React 19 (TypeScript)
*   **Build Tool:** Vite / ES Modules
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **Persistence:** Browser LocalStorage

---

## 3. Tonnage Calculator Logic
The core feature of the application is the automated tonnage calculation based on the specific **Order Type**.

### The General Formula
```typescript
Total Tonnage = Count × Configured_Columns × Weight_Per_Unit
```

### Logic by Category
The system handles three distinct production categories with unique multipliers defined in `constants.ts`:

| Category | Input Unit | Configured Columns | Weight Rules | Formula |
| :--- | :--- | :--- | :--- | :--- |
| **EXPORT** | Trucks | **20** | Selectable: 1.1T or 1.2T | `Trucks × 20 × Weight` |
| **LOCAL** | Trucks | **22** | Fixed: **1.2T** | `Trucks × 22 × 1.2` |
| **DÉBARDAGE** | Columns | **1** | Fixed: **1.2T** | `Columns × 1 × 1.2` |

> **Note on Débardage:** Unlike Export/Local where the input represents a whole truck, Débardage input represents specific columns. Therefore, the column multiplier is set to `1` to calculate the weight correctly.

---

## 4. Configuration Options & Enums

### Production Platforms (`PlatformType`)
*   **Big Bag:** Industrial Bulk Load
*   **50kg:** Standard Production Sack

### Shift Types (`ShiftType`)
1.  **Morning:** 06h00 to 14h00
2.  **Afternoon:** 14h00 to 22h00
3.  **Night:** 22h00 to 06h00

### Production Categories (`OrderType`)
*   **Export:** Requires BL, TC, and Seal Numbers.
*   **Local:** Requires Truck Matricule.
*   **Débardage:** Internal movement/clearing.

### Pallet Configurations (`PalletType`)
*   **Avec Palet** (Export/Local)
*   **Sans Palet** (Export/Local)
*   **Palet Plastic** (Forced default for Débardage)

### Article Codes
Defined in `ORDER_CONFIGS` in `constants.ts`:
*   **Export:** 4301, 4302
*   **Local:** 4300, 4318, 4312, 4303
*   **Débardage:** 4303

---

## 5. Core Functions & Hooks

### `useProductionData` Hook
Located in `hooks/useProductionData.ts`, this manages the application state.

| Function | Description |
| :--- | :--- |
| **`addEntry(entry)`** | Generates a unique ID, timestamps the entry, adds it to the list, and saves to LocalStorage. |
| **`updateEntry(entry)`** | Finds an existing entry by ID and replaces it with new data. |
| **`deleteEntry(id)`** | Removes an entry permanently from the state and LocalStorage. |
| **`saveDraft(draft)`** | Debounced function that auto-saves form progress to `DRAFT_KEY` in LocalStorage to prevent data loss. |
| **`isLoading`** | Boolean state used to trigger skeleton loaders during data fetching. |

### Utility Functions
Located in `utils/calculations.ts`.

*   **`calculateOrderTonnage`**: Executes the math logic described in Section 3.
*   **`calculateSummaryStats`**: Aggregates data for the Dashboard. Returns:
    *   Total Tonnage
    *   Average Tonnage per Shift
    *   Breakdown by Category (Export/Local/Débardage)
    *   Entry Count
*   **`formatTonnage`**: Formats numbers to 2 decimal places with a "T" suffix.

---

## 6. Component Architecture

### `EntryForm.tsx`
The primary data input interface.
*   **Features:**
    *   Dynamic fields based on selected `OrderType` (e.g., hiding Seal Number for Local orders).
    *   Live Tonnage Preview.
    *   Validations (Required Operator Name, Min 1 Order).
    *   Auto-save draft functionality.
    *   Multi-order support (A single shift can have multiple transactions).

### `HistoryView.tsx`
The data presentation layer.
*   **Features:**
    *   **Hybrid Layout:** Displays as Cards on Mobile and a Data Table on Desktop.
    *   **Sorting:** Clickable headers to sort by Date, Shift, Platform, Operator, or Tonnage.
    *   **Filtering:** Filter by Shift (horizontal scroll) or Platform.
    *   **Search:** Real-time search by Operator Name or Notes.
    *   **CSV Export:** Generates a detailed `.csv` file including all technical specs (Columns, Weight, Pallets).

### `Dashboard.tsx`
Visual analytics.
*   **Features:**
    *   **AreaChart:** Shows production trends over the last 10 entries.
    *   **PieChart:** Shows distribution between Export, Local, and Débardage.
    *   **StatCards:** Key Performance Indicators (Total, Avg, Counts).

### `Layout.tsx`
*   **Features:**
    *   Collapsible Sidebar for Desktop.
    *   Bottom Navigation Bar for Mobile.
    *   Responsive container handling.

---

## 7. Data Structure

### The Entry Object
Each record submitted creates a `ProductionEntry`:

```typescript
interface ProductionEntry {
  id: string;            // Unique ID
  date: string;          // YYYY-MM-DD
  shift: ShiftType;      // Morning/Afternoon/Night
  platform: PlatformType;// Big Bag / 50kg
  operatorName: string;  // Input string
  orders: ProductionOrder[]; // Array of operations within the shift
  totalTonnage: number;  // Sum of all orders
  submittedAt: number;   // Timestamp
  notes?: string;        // Optional remarks
}
```

### The Order Object
A shift can contain multiple orders (e.g., 2 Export trucks and 1 Local truck):

```typescript
interface ProductionOrder {
  id: string;
  type: OrderType;
  articleCode: string;
  // Dynamic fields based on type:
  blNumber?: string;
  tcNumber?: string;
  sealNumber?: string;
  truckMatricule?: string;
  // Calculation Factors:
  count: number;         // Trucks or Columns
  weightPerUnit: number; // Tonnage
  columns: number;       // Multiplier (1, 20, or 22)
  calculatedTonnage: number; 
}
```
