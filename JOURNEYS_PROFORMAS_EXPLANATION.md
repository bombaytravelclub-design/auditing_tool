# 📊 Journeys & Proformas Tables - How They Work

## Overview

The system uses two main tables: **`journeys`** and **`proformas`**. They have a **one-to-many relationship** where:
- One Journey can have multiple Proformas (though typically one)
- Each Proforma belongs to exactly one Journey

---

## 🚚 JOURNEYS Table

### Purpose
Stores **logistical information** about freight trips/transports.

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `journey_number` | VARCHAR(100) | Unique journey identifier (internal system ID) |
| `lr_number` | VARCHAR(100) | **LR Number from invoice/POD** (used for matching) |
| `vehicle_number` | VARCHAR(50) | Vehicle registration number |
| `load_id` | VARCHAR(100) | Load/LCU identifier |
| `origin` | VARCHAR(255) | Origin city/state |
| `destination` | VARCHAR(255) | Destination city/state |
| `consignor_id` | UUID | Reference to consignor user |
| `transporter_id` | UUID | Reference to transporter user |
| `status` | ENUM | `ongoing`, `closed`, `disputed` |
| `epod_status` | ENUM | `pending`, `approved`, `rejected` |
| `journey_date` | DATE | When journey started |
| `closure_date` | TIMESTAMP | When journey was closed |

### Important Distinction
- **`journey_number`**: Internal system identifier (e.g., "JNY-001", "TRIP-123")
- **`lr_number`**: LR Number from invoice/POD documents (e.g., "LR20257713")
- **These are DIFFERENT!** LR Number is used for matching invoices/PODs.

---

## 💰 PROFORMAS Table

### Purpose
Stores **financial/contractual information** - the expected charges for a journey.

### Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `proforma_number` | VARCHAR(100) | Unique proforma identifier |
| `journey_id` | UUID | **Foreign key → journeys.id** |
| `base_freight` | DECIMAL(12,2) | Base freight amount |
| `detention_charge` | DECIMAL(12,2) | Detention charges |
| `toll_charge` | DECIMAL(12,2) | Toll charges |
| `unloading_charge` | DECIMAL(12,2) | Unloading charges |
| `other_charges` | DECIMAL(12,2) | Other miscellaneous charges |
| `gst_amount` | DECIMAL(12,2) | GST amount |
| `total_amount` | DECIMAL(12,2) | Total payable amount |
| `category` | VARCHAR(50) | `open`, `closed`, `disputed` |
| `invoice_matched` | BOOLEAN | Whether invoice has been matched |

### Relationship
- **`journey_id`** → References `journeys.id`
- When a journey is deleted, all its proformas are deleted (CASCADE)

---

## 🔄 How They Work Together

### 1. **Journey Creation Flow**

```
1. Journey is created (logistics info)
   ↓
2. Proforma is generated (expected charges)
   ↓
3. Journey has proforma attached via journey_id
```

### 2. **Invoice Matching Flow**

```
1. User uploads invoice PDF
   ↓
2. OCR extracts LR Number from invoice
   ↓
3. System matches LR Number with journeys.lr_number
   ↓
4. Gets proforma from matched journey
   ↓
5. Compares invoice charges vs proforma charges
   ↓
6. Shows variances/differences
```

### 3. **Data Flow Example**

```javascript
// Fetch journey with its proforma
const journey = {
  id: "abc-123",
  journey_number: "JNY-001",
  lr_number: "LR20257713",  // ← Used for matching!
  vehicle_number: "MH11AB6104",
  proformas: [{
    id: "proforma-456",
    journey_id: "abc-123",
    base_freight: 47727.03,
    toll_charge: 516.75,
    unloading_charge: 1052.18,
    gst_amount: 5915.52,
    total_amount: 55211.48
  }]
}

// OCR extracts from invoice:
const invoiceData = {
  lrNo: "LR20257713",  // ← Matches journey.lr_number!
  baseFreight: 50000.00,  // ← Compare with proforma.base_freight
  totalAmount: 58000.00   // ← Compare with proforma.total_amount
}

// Calculate variance:
const variance = {
  baseFreight: 50000 - 47727.03 = 2272.97,
  totalAmount: 58000 - 55211.48 = 2788.52
}
```

---

## 📍 Where They're Used in Code

### 1. **Fetching Proformas** (`GET /api/proformas`)

```javascript
// Fetches proformas with their journey data
SELECT proformas.*, 
       journeys.* 
FROM proformas 
JOIN journeys ON proformas.journey_id = journeys.id
```

**Used for:**
- Displaying proforma list in UI
- Filtering by category (`open`, `closed`, `disputed`)
- Filtering by ePOD status (`pending`, `approved`, `rejected`)

### 2. **Invoice Bulk Upload** (`POST /api/invoice/bulk-upload`)

```javascript
// For invoices, fetch journeys WITH their proformas
SELECT journeys.*,
       proformas.*
FROM journeys
LEFT JOIN proformas ON proformas.journey_id = journeys.id
WHERE journeys.id IN (selected_journey_ids)
```

**Used for:**
- Matching invoice LR Number with `journeys.lr_number`
- Comparing invoice charges with `proformas` charges
- Calculating variances

### 3. **POD Bulk Upload** (`POST /api/pod/bulk-upload`)

```javascript
// For PODs, just fetch journey basic info
SELECT journeys.id, journey_number, lr_number, load_id, vehicle_number
FROM journeys
WHERE journeys.id IN (selected_journey_ids)
```

**Used for:**
- Matching POD LR Number with `journeys.lr_number`
- POD doesn't need proforma data (no charge comparison)

---

## 🎯 Key Use Cases

### Use Case 1: Display Proforma List
- **Query**: Get all proformas with journey info
- **Purpose**: Show proforma audit dashboard
- **Filters**: Category, ePOD status

### Use Case 2: Invoice Matching
- **Step 1**: Extract LR Number from invoice (OCR)
- **Step 2**: Find journey with matching `lr_number`
- **Step 3**: Get proforma from that journey
- **Step 4**: Compare invoice charges vs proforma charges
- **Step 5**: Show variances

### Use Case 3: POD Matching
- **Step 1**: Extract LR Number from POD (OCR)
- **Step 2**: Find journey with matching `lr_number`
- **Step 3**: Link POD document to journey
- **Note**: No charge comparison needed for POD

---

## 🔑 Important Points

1. **LR Number is the Matching Key**
   - OCR extracts `lrNo` from invoice/POD
   - Matches against `journeys.lr_number` (NOT `journey_number`!)

2. **Proforma Contains Expected Charges**
   - System-generated when journey is closed
   - Used as baseline for invoice comparison

3. **One Journey → One Proforma** (typically)
   - But schema allows multiple proformas per journey
   - Foreign key relationship: `proformas.journey_id → journeys.id`

4. **Journey Number ≠ LR Number**
   - `journey_number`: Internal system ID
   - `lr_number`: Document identifier (from invoice/POD)
   - **Always match on `lr_number`!**

---

## 📊 Example Data Structure

```json
{
  "journey": {
    "id": "b37aff14-a998-4b8e-b868-ddc7fb43c5ae",
    "journey_number": "JNY-001",
    "lr_number": "LR20257713",
    "vehicle_number": "MH11AB6104",
    "load_id": "LCU95304199",
    "origin": "Bangalore, KA",
    "destination": "Surat, GJ",
    "status": "closed",
    "epod_status": "approved"
  },
  "proforma": {
    "id": "proforma-123",
    "journey_id": "b37aff14-a998-4b8e-b868-ddc7fb43c5ae",
    "base_freight": 47727.03,
    "toll_charge": 516.75,
    "unloading_charge": 1052.18,
    "gst_amount": 5915.52,
    "total_amount": 55211.48,
    "category": "open"
  }
}
```

---

## 🚀 Summary

- **Journeys**: Logistics data (vehicle, route, parties, status)
- **Proformas**: Financial data (expected charges, amounts)
- **Relationship**: One-to-many (journey → proformas)
- **Matching**: Use `lr_number` field (NOT `journey_number`)
- **Purpose**: Compare invoice charges against proforma charges


