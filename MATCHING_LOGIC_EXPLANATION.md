# Matching Logic Explanation

## Current Matching Flow

### For POD Documents:
1. **OCR Extraction**: Extracts `journeyNumber`, `vehicleNumber`, `loadId` from POD
2. **Journey Matching**: Matches OCR data with journeys using:
   - Journey Number (40% weight)
   - Vehicle Number (40% weight)  
   - Load ID (20% weight)
3. **Match Threshold**: Requires 30% score minimum
4. **Result**: Creates `bulk_job_item` with matched journey_id

### For Invoice Documents:
1. **OCR Extraction**: Extracts `invoiceNumber`, `vehicleNumber`, `journeyNumber`, `loadId`, `baseFreight`, `totalAmount`, `charges` from Invoice
2. **Journey Matching**: Matches OCR data with journeys using same logic as POD
3. **Proforma Retrieval**: Gets proforma data from matched journey
4. **Charge Comparison**: Should compare invoice charges with proforma charges, but currently NOT implemented!
5. **Result**: Creates `bulk_job_item` with matched journey_id

## Issues Found:

1. **"Loaded 0 journeys"**: Journey query is failing or journeyIds are invalid
2. **OCR extracting null**: OCR prompt might not be extracting correctly
3. **No charge comparison**: Invoice charges are NOT compared with proforma charges
4. **Items not created**: If matching fails, items might not be created

## What Should Happen:

### For Invoices:
1. Match OCR data with journeys (by vehicle/journey/load ID)
2. Get proforma from matched journey
3. **Compare charges**:
   - Base Freight: Invoice vs Proforma
   - Toll Charges: Invoice vs Proforma
   - Unloading Charges: Invoice vs Proforma
   - Detention Charges: Invoice vs Proforma
   - Other Charges: Invoice vs Proforma
   - GST: Invoice vs Proforma
   - Total Amount: Invoice vs Proforma
4. Calculate variances for each charge
5. Determine match status based on variances
6. Create item with variance data

## Current Implementation Gap:

The system matches invoices with journeys, but does NOT:
- Compare invoice charges with proforma charges
- Calculate variances
- Store variance data in bulk_job_items
- Use variance data for review workspace


