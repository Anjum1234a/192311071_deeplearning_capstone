-- =============================================================================
-- CLINIDENT: AI-Powered Dental Clinic Management System
-- Database Schema for MySQL 8.x / MariaDB (XAMPP Compatible)
-- Single Doctor User Role Architecture
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `clinident` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `clinident`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `ai_analyses`;
DROP TABLE IF EXISTS `dental_images`;
DROP TABLE IF EXISTS `prescriptions`;
DROP TABLE IF EXISTS `clinical_notes`;
DROP TABLE IF EXISTS `dental_charts`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `doctors`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Doctor Profile Table (Single Doctor Role)
CREATE TABLE `doctors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(25) DEFAULT '+91 98765 43210',
  `license_number` VARCHAR(50) DEFAULT 'DENT-REG-84920',
  `specialization` VARCHAR(100) DEFAULT 'Consultant Dental Surgeon & Implantologist',
  `clinic_name` VARCHAR(150) DEFAULT 'CLINIDENT Advanced Dental Care',
  `clinic_address` TEXT DEFAULT 'Suite 402, Metro Healthcare Towers, MG Road, Bengaluru, 560001',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Doctor (Password: Doctor@123)
-- Hash generated via password_hash('Doctor@123', PASSWORD_BCRYPT)
INSERT INTO `doctors` (`id`, `name`, `email`, `password_hash`, `phone`, `license_number`, `specialization`, `clinic_name`) VALUES
(1, 'Dr. Sarah Mitchell, BDS, MDS', 'doctor@clinident.com', '$2y$10$wO08fM2u9x9k4J8pQh.7uOmg2WqL4Z7n3H1f2d6c9b8a0e5f7g8h.', '+91 98765 43210', 'DENT-REG-84920', 'Dental Surgeon & Oral Implantologist', 'CLINIDENT Advanced Dental Care');

-- 2. Patients Table
CREATE TABLE `patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` INT NOT NULL DEFAULT 1,
  `patient_code` VARCHAR(30) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `dob` DATE NOT NULL,
  `age` INT NOT NULL,
  `phone` VARCHAR(25) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT 'O+',
  `address` TEXT DEFAULT NULL,
  `emergency_contact_name` VARCHAR(100) DEFAULT NULL,
  `emergency_contact_phone` VARCHAR(25) DEFAULT NULL,
  `medical_history` TEXT DEFAULT NULL, -- e.g. Hypertension, Type 2 Diabetes
  `dental_history` TEXT DEFAULT NULL,  -- e.g. Root Canal on #16 in 2022
  `allergies` TEXT DEFAULT NULL,       -- e.g. Penicillin, NSAIDs, Latex
  `consent_signed` TINYINT(1) DEFAULT 1,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Appointments Table
CREATE TABLE `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` INT NOT NULL DEFAULT 1,
  `patient_id` INT NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `duration_minutes` INT DEFAULT 30,
  `reason_for_visit` VARCHAR(255) NOT NULL,
  `treatment_type` VARCHAR(100) DEFAULT 'General Consultation',
  `status` ENUM('Scheduled', 'Completed', 'Cancelled', 'Waiting List') DEFAULT 'Scheduled',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Dental Charts / Odontogram Table (Adult 32 Teeth, FDI Two-Digit Standard)
CREATE TABLE `dental_charts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `tooth_number` INT NOT NULL, -- 11-18, 21-28, 31-38, 41-48
  `condition_state` ENUM('healthy', 'caries', 'filled', 'crown', 'missing', 'rct', 'bridge') DEFAULT 'healthy',
  `surfaces` VARCHAR(25) DEFAULT 'O', -- Occlusal, Mesial, Distal, Buccal, Lingual
  `pocket_depth_mm` INT DEFAULT 2,   -- Periodontal pocket depth (1-9 mm)
  `mobility_grade` INT DEFAULT 0,    -- Mobility 0, 1, 2, 3
  `endodontic_status` VARCHAR(50) DEFAULT 'Vital',
  `notes` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_patient_tooth` (`patient_id`, `tooth_number`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Clinical Documentation (SOAP Notes & Procedures)
CREATE TABLE `clinical_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` INT NOT NULL DEFAULT 1,
  `patient_id` INT NOT NULL,
  `note_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `procedure_title` VARCHAR(150) NOT NULL,
  `subjective` TEXT NOT NULL, -- Chief complaint & history
  `objective` TEXT NOT NULL,  -- Clinical exam & tests
  `assessment` TEXT NOT NULL, -- Diagnosis
  `plan` TEXT NOT NULL,       -- Treatment executed & follow-up
  `anesthesia_used` VARCHAR(100) DEFAULT 'None',
  `voice_transcription` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Prescriptions Table
CREATE TABLE `prescriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `doctor_id` INT NOT NULL DEFAULT 1,
  `patient_id` INT NOT NULL,
  `rx_number` VARCHAR(30) NOT NULL UNIQUE,
  `rx_date` DATE NOT NULL,
  `diagnosis` VARCHAR(255) NOT NULL,
  `medications_json` LONGTEXT NOT NULL, -- JSON array of medication objects
  `doctor_advice` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Dental Images Table (IOPA, OPG, CBCT, Intraoral, STL)
CREATE TABLE `dental_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_id` INT NOT NULL,
  `image_type` ENUM('IOPA', 'OPG', 'CBCT', 'Intraoral', 'STL') NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(150) NOT NULL,
  `file_size_kb` INT DEFAULT 120,
  `tooth_number` INT DEFAULT NULL,
  `stage` ENUM('Pre-Treatment', 'Mid-Treatment', 'Post-Treatment') DEFAULT 'Pre-Treatment',
  `notes` TEXT DEFAULT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. AI Analysis Records (Decision-Support Only)
CREATE TABLE `ai_analyses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `image_id` INT NOT NULL,
  `patient_id` INT NOT NULL,
  `analysis_type` VARCHAR(100) DEFAULT 'Caries & Alignment Assessment',
  `caries_detected_count` INT DEFAULT 0,
  `spacing_crowding_status` VARCHAR(100) DEFAULT 'Mild Lower Anterior Crowding',
  `missing_teeth_detected` VARCHAR(100) DEFAULT 'Tooth #38 Missing',
  `progress_score` DECIMAL(5,2) DEFAULT 88.50,
  `confidence_score` DECIMAL(5,2) DEFAULT 91.20,
  `findings_json` LONGTEXT DEFAULT NULL,
  `decision_support_notes` TEXT DEFAULT 'Decision support indicator only. Clinical validation required by dental practitioner.',
  `status` ENUM('Success', 'Demo', 'Pending') DEFAULT 'Success',
  `analyzed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`image_id`) REFERENCES `dental_images`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================================================
-- INITIAL SEED DATA FOR DEMO & TESTING
-- =============================================================================

INSERT INTO `patients` (`id`, `doctor_id`, `patient_code`, `full_name`, `gender`, `dob`, `age`, `phone`, `email`, `blood_group`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `medical_history`, `dental_history`, `allergies`, `consent_signed`, `status`) VALUES
(1, 1, 'CD-1001', 'James Anderson', 'Male', '1988-06-14', 36, '+91 98450 11223', 'james.anderson@example.com', 'A+', '12 Elm Street, Indiranagar, Bengaluru', 'Emily Anderson (Spouse)', '+91 98450 99887', 'Mild Hypertension (Under Medication: Telmisartan 20mg)', 'Composite restoration on #14, routine scaling 1 year ago', 'Penicillin (Skin Rash)', 1, 'Active'),
(2, 1, 'CD-1002', 'Priya Sharma', 'Female', '1995-11-23', 29, '+91 98761 22334', 'priya.sharma@example.com', 'B+', '404 Green Valley, Koramangala, Bengaluru', 'Rajesh Sharma (Father)', '+91 98761 88776', 'No known systemic illnesses', 'Orthodontic braces treatment completed in 2018', 'No known drug allergies', 1, 'Active'),
(3, 1, 'CD-1003', 'Robert Chen', 'Male', '1976-03-08', 48, '+91 97400 33445', 'robert.chen@example.com', 'O+', '78 Palm Avenue, Whitefield, Bengaluru', 'Linda Chen (Wife)', '+91 97400 66554', 'Type 2 Diabetes (HbA1c 6.8% under control)', 'Root Canal Treatment on #36 with PFM Crown in 2021', 'Latex Gloves (Mild erythema)', 1, 'Active'),
(4, 1, 'CD-1004', 'Ananya Deshmukh', 'Female', '2001-09-17', 23, '+91 99160 44556', 'ananya.d@example.com', 'AB+', '22 Lakeview Road, HSR Layout, Bengaluru', 'Meera Deshmukh (Mother)', '+91 99160 55667', 'Asthmatic (Carries Salbutamol inhaler)', 'Mild gingivitis, wisdom tooth eruption pain on #48', 'No known drug allergies', 1, 'Active');

INSERT INTO `appointments` (`id`, `doctor_id`, `patient_id`, `appointment_date`, `appointment_time`, `duration_minutes`, `reason_for_visit`, `treatment_type`, `status`, `notes`) VALUES
(1, 1, 1, CURRENT_DATE, '10:00:00', 45, 'Severe pain on upper right molar with cold sensitivity', 'Root Canal Therapy', 'Scheduled', 'Tooth #16 deep carious lesion. Patient informed of RCT stages.'),
(2, 1, 2, CURRENT_DATE, '11:30:00', 30, 'Routine 6-month checkup and ultrasonic scaling', 'Oral Prophylaxis', 'Completed', 'Scaling done. Minimal calculus, good plaque control.'),
(3, 1, 3, CURRENT_DATE, '14:30:00', 60, 'Crown prep & bite impression for lower molar', 'Crown Preparation', 'Scheduled', 'Prep for zirconia crown on tooth #46.'),
(4, 1, 4, CURRENT_DATE, '16:00:00', 30, 'Impacted wisdom tooth consultation and OPG review', 'Oral Surgery Consult', 'Waiting List', 'OPG shows horizontal impaction of tooth #48.'),
(5, 1, 1, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), '10:30:00', 45, 'RCT Obturation visit for tooth #16', 'Endodontics', 'Scheduled', 'Working length 21mm verified.');

-- Populate baseline odontogram for Patient 1
INSERT INTO `dental_charts` (`patient_id`, `tooth_number`, `condition_state`, `surfaces`, `pocket_depth_mm`, `mobility_grade`, `endodontic_status`, `notes`) VALUES
(1, 16, 'caries', 'MOD', 4, 0, 'Symptomatic Irreversible Pulpitis', 'Deep carious lesion approaching pulp chamber'),
(1, 14, 'filled', 'DO', 2, 0, 'Vital', 'Old amalgam replaced with composite in 2022'),
(1, 26, 'crown', 'Full', 3, 0, 'Treated', 'PFM crown in good occlusal alignment'),
(1, 38, 'missing', 'None', 0, 0, 'Extracted', 'Third molar extracted 2019'),
(1, 46, 'caries', 'O', 3, 0, 'Vital', 'Pit and fissure occlusal caries');

-- Clinical SOAP Notes for Patient 1
INSERT INTO `clinical_notes` (`id`, `doctor_id`, `patient_id`, `procedure_title`, `subjective`, `objective`, `assessment`, `plan`, `anesthesia_used`, `voice_transcription`) VALUES
(1, 1, 1, 'Endodontic Access & Biomechanical Preparation #16', 
'Patient reports spontaneous, throbbing pain on upper right molar for the past 3 days, exacerbated by hot drinks.',
'Intraoral exam reveals deep MOD caries on tooth #16. Tenderness to vertical percussion (+). Cold test produced lingering sharp pain >15 seconds. Periapical radiograph indicates radiolucency in coronal pulp chamber.',
'Symptomatic Irreversible Pulpitis with Symptomatic Apical Periodontitis on tooth #16.',
'Local anesthesia administered. Rubber dam isolation placed. Access opening created; pulp extirpated. Working length determined (MB: 20mm, DB: 19.5mm, P: 21mm). Irrigated with 3% NaOCl and saline. Closed with Ca(OH)2 paste & Cavit temp restoration. Recalled in 48 hours for obturation.',
'2% Lignocaine with 1:80000 Adrenaline (1.8ml PSA & Greater Palatine nerve block)',
'Voice note: access opened smoothly, three canals located mesiobuccal distobuccal and palatal, calcium hydroxide dressing given.');

-- Prescription for Patient 1
INSERT INTO `prescriptions` (`id`, `doctor_id`, `patient_id`, `rx_number`, `rx_date`, `diagnosis`, `medications_json`, `doctor_advice`) VALUES
(1, 1, 1, 'RX-2026-001', CURRENT_DATE, 'Acute Pulpitis #16 post access opening',
'[
  {"drug_name": "Amoxicillin Capsules", "dosage": "500 mg", "frequency": "1-0-1 (Twice Daily)", "duration": "5 Days", "instructions": "After meals"},
  {"drug_name": "Ibuprofen + Paracetamol", "dosage": "400mg + 325mg", "frequency": "1-1-1 (Thrice Daily)", "duration": "3 Days", "instructions": "After food, for pain relief"},
  {"drug_name": "Chlorhexidine 0.2% Mouthwash", "dosage": "10 ml", "frequency": "Twice Daily", "duration": "7 Days", "instructions": "Rinse for 60 seconds after brushing"}
]',
'Avoid chewing hard foods on the upper right side until permanent crown is placed. Maintain gentle warm salt water rinses.');

-- Dental Image Record for Patient 1
INSERT INTO `dental_images` (`id`, `patient_id`, `image_type`, `file_path`, `file_name`, `file_size_kb`, `tooth_number`, `stage`, `notes`) VALUES
(1, 1, 'IOPA', 'uploads/images/sample_iopa_16.png', 'patient_1001_iopa_tooth16.png', 420, 16, 'Pre-Treatment', 'Pre-operative IOPA showing coronal radiolucency on distal margin of tooth 16.');

-- AI Analysis Record for Patient 1
INSERT INTO `ai_analyses` (`id`, `image_id`, `patient_id`, `analysis_type`, `caries_detected_count`, `spacing_crowding_status`, `missing_teeth_detected`, `progress_score`, `confidence_score`, `findings_json`, `decision_support_notes`, `status`) VALUES
(1, 1, 1, 'Caries & Radiolucency Assessment', 1, 'Normal Arch Alignment', 'Tooth #38 Missing', 88.50, 93.40, 
'[{"label": "Interproximal Caries", "confidence": 93.4, "tooth": 16, "surface": "Distal", "box": [140, 190, 48, 52]}, {"label": "Periapical Radiolucency", "confidence": 86.8, "tooth": 16, "surface": "Apical Root", "box": [220, 185, 40, 38]}]',
'AI Assistive Observation: Significant coronal demineralization detected at tooth #16 distal margin. Decision-support reference only; final clinical evaluation reserved for the treating dental surgeon.', 'Success');
