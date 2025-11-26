-- Freight Audit Backend Schema
-- Future-proof for multi-role (Consignor, Transporter, Admin)
-- Currently only Consignor role is active

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('consignor', 'transporter', 'admin');
CREATE TYPE journey_status AS ENUM ('ongoing', 'closed', 'disputed');
CREATE TYPE epod_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE document_type AS ENUM ('pod', 'invoice');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE item_status AS ENUM ('pending_review', 'matched', 'mismatch', 'accepted', 'rejected', 'skipped');
CREATE TYPE review_action_type AS ENUM ('accept', 'reject', 'skip', 'replace');

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'consignor',
    full_name VARCHAR(255),
    company_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 2. JOURNEYS TABLE
-- ============================================================================
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_number VARCHAR(100) UNIQUE NOT NULL,
    vehicle_number VARCHAR(50) NOT NULL,
    load_id VARCHAR(100),
    
    -- Route details
    origin VARCHAR(255),
    destination VARCHAR(255),
    
    -- Parties
    consignor_id UUID REFERENCES users(id),
    transporter_id UUID REFERENCES users(id),
    
    -- Status
    status journey_status NOT NULL DEFAULT 'ongoing',
    epod_status epod_status DEFAULT 'pending',
    
    -- Dates
    journey_date DATE,
    closure_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journeys_journey_number ON journeys(journey_number);
CREATE INDEX idx_journeys_vehicle_number ON journeys(vehicle_number);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_epod_status ON journeys(epod_status);
CREATE INDEX idx_journeys_consignor ON journeys(consignor_id);
CREATE INDEX idx_journeys_transporter ON journeys(transporter_id);

-- ============================================================================
-- 3. PROFORMAS TABLE
-- ============================================================================
CREATE TABLE proformas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_number VARCHAR(100) UNIQUE NOT NULL,
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    
    -- Financial details
    base_freight DECIMAL(12, 2) NOT NULL,
    detention_charge DECIMAL(12, 2) DEFAULT 0,
    toll_charge DECIMAL(12, 2) DEFAULT 0,
    unloading_charge DECIMAL(12, 2) DEFAULT 0,
    other_charges DECIMAL(12, 2) DEFAULT 0,
    gst_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- Status
    category VARCHAR(50) DEFAULT 'open', -- open, closed, disputed
    invoice_matched BOOLEAN DEFAULT FALSE,
    
    -- Parties
    consignor_id UUID REFERENCES users(id),
    transporter_id UUID REFERENCES users(id),
    
    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_proformas_proforma_number ON proformas(proforma_number);
CREATE INDEX idx_proformas_journey_id ON proformas(journey_id);
CREATE INDEX idx_proformas_category ON proformas(category);
CREATE INDEX idx_proformas_consignor ON proformas(consignor_id);
CREATE INDEX idx_proformas_transporter ON proformas(transporter_id);

-- ============================================================================
-- 4. POD_DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE pod_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    
    -- Storage
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- OCR extracted data
    ocr_vehicle_number VARCHAR(50),
    ocr_load_id VARCHAR(100),
    ocr_journey_number VARCHAR(100),
    ocr_confidence DECIMAL(5, 4), -- 0.0000 to 1.0000
    ocr_raw_response JSONB,
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50), -- matched, mismatch, needs_review
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pod_documents_journey_id ON pod_documents(journey_id);
CREATE INDEX idx_pod_documents_uploaded_by ON pod_documents(uploaded_by);
CREATE INDEX idx_pod_documents_verification_status ON pod_documents(verification_status);

-- ============================================================================
-- 5. INVOICE_DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE invoice_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proforma_id UUID REFERENCES proformas(id) ON DELETE CASCADE,
    journey_id UUID REFERENCES journeys(id),
    
    -- Invoice details
    invoice_number VARCHAR(100),
    invoice_date DATE,
    
    -- Storage
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- OCR extracted financial data
    ocr_base_freight DECIMAL(12, 2),
    ocr_detention_charge DECIMAL(12, 2),
    ocr_toll_charge DECIMAL(12, 2),
    ocr_unloading_charge DECIMAL(12, 2),
    ocr_other_charges DECIMAL(12, 2),
    ocr_gst_amount DECIMAL(12, 2),
    ocr_total_amount DECIMAL(12, 2),
    ocr_confidence DECIMAL(5, 4),
    ocr_raw_response JSONB,
    
    -- Matching results
    variance_base_freight DECIMAL(12, 2),
    variance_total DECIMAL(12, 2),
    variance_percentage DECIMAL(5, 2),
    match_status VARCHAR(50), -- exact_match, base_freight_diff, charges_diff
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_invoice_documents_proforma_id ON invoice_documents(proforma_id);
CREATE INDEX idx_invoice_documents_journey_id ON invoice_documents(journey_id);
CREATE INDEX idx_invoice_documents_invoice_number ON invoice_documents(invoice_number);
CREATE INDEX idx_invoice_documents_match_status ON invoice_documents(match_status);
CREATE INDEX idx_invoice_documents_uploaded_by ON invoice_documents(uploaded_by);

-- ============================================================================
-- 6. BULK_JOBS TABLE
-- ============================================================================
CREATE TABLE bulk_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type document_type NOT NULL, -- 'pod' or 'invoice'
    
    -- Statistics
    total_files INT NOT NULL DEFAULT 0,
    processed_files INT DEFAULT 0,
    matched_files INT DEFAULT 0,
    mismatch_files INT DEFAULT 0,
    failed_files INT DEFAULT 0,
    
    -- Status
    status job_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Metadata
    uploaded_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bulk_jobs_uploaded_by ON bulk_jobs(uploaded_by);
CREATE INDEX idx_bulk_jobs_status ON bulk_jobs(status);
CREATE INDEX idx_bulk_jobs_job_type ON bulk_jobs(job_type);
CREATE INDEX idx_bulk_jobs_created_at ON bulk_jobs(created_at DESC);

-- ============================================================================
-- 7. BULK_JOB_ITEMS TABLE
-- ============================================================================
CREATE TABLE bulk_job_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_job_id UUID REFERENCES bulk_jobs(id) ON DELETE CASCADE,
    
    -- Target reference (journey for POD, proforma for invoice)
    journey_id UUID REFERENCES journeys(id),
    proforma_id UUID REFERENCES proformas(id),
    
    -- Document reference
    pod_document_id UUID REFERENCES pod_documents(id),
    invoice_document_id UUID REFERENCES invoice_documents(id),
    
    -- File info
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500),
    
    -- OCR results
    ocr_extracted_data JSONB,
    ocr_confidence DECIMAL(5, 4),
    
    -- Match results
    match_status item_status NOT NULL DEFAULT 'pending_review',
    match_details JSONB, -- stores comparison details
    
    -- Review
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    
    -- Metadata
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bulk_job_items_bulk_job_id ON bulk_job_items(bulk_job_id);
CREATE INDEX idx_bulk_job_items_journey_id ON bulk_job_items(journey_id);
CREATE INDEX idx_bulk_job_items_proforma_id ON bulk_job_items(proforma_id);
CREATE INDEX idx_bulk_job_items_match_status ON bulk_job_items(match_status);
CREATE INDEX idx_bulk_job_items_reviewed_by ON bulk_job_items(reviewed_by);

-- ============================================================================
-- 8. REVIEW_ACTIONS TABLE (Audit Trail)
-- ============================================================================
CREATE TABLE review_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bulk_job_item_id UUID REFERENCES bulk_job_items(id) ON DELETE CASCADE,
    
    -- Action details
    action review_action_type NOT NULL,
    comment TEXT,
    
    -- Before/After state
    previous_status item_status,
    new_status item_status NOT NULL,
    changes JSONB, -- stores what was changed
    
    -- Metadata
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_review_actions_bulk_job_item_id ON review_actions(bulk_job_item_id);
CREATE INDEX idx_review_actions_performed_by ON review_actions(performed_by);
CREATE INDEX idx_review_actions_performed_at ON review_actions(performed_at DESC);
CREATE INDEX idx_review_actions_action ON review_actions(action);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON journeys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proformas_updated_at BEFORE UPDATE ON proformas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pod_documents_updated_at BEFORE UPDATE ON pod_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_documents_updated_at BEFORE UPDATE ON invoice_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_jobs_updated_at BEFORE UPDATE ON bulk_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bulk_job_items_updated_at BEFORE UPDATE ON bulk_job_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Insert a mock consignor user
INSERT INTO users (id, email, role, full_name, company_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'consignor@example.com', 'consignor', 'John Doe', 'CONSIGNOR-001');

-- Note: Additional seed data can be added for testing purposes
-- For now, keeping it minimal as per requirements

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts - supports consignor, transporter, and admin roles';
COMMENT ON TABLE journeys IS 'Journey records with ePOD status tracking';
COMMENT ON TABLE proformas IS 'System-generated proformas from journey closure';
COMMENT ON TABLE pod_documents IS 'Uploaded POD documents with OCR extraction';
COMMENT ON TABLE invoice_documents IS 'Uploaded invoice documents with OCR and matching';
COMMENT ON TABLE bulk_jobs IS 'Bulk upload job tracking';
COMMENT ON TABLE bulk_job_items IS 'Individual items in bulk upload jobs';
COMMENT ON TABLE review_actions IS 'Audit trail for review actions';

