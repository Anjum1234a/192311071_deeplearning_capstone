<?php
/**
 * CLINIDENT - Patients Management API
 * Full CRUD for Patient Records
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// -------------------------------------------------------------
// GET: Fetch List or Single Patient Details
// -------------------------------------------------------------
if ($method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $search = trim($_GET['q'] ?? '');

    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    try {
        if ($id > 0) {
            // Fetch single patient profile
            $stmt = $pdo->prepare("SELECT * FROM patients WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $patient = $stmt->fetch();

            if (!$patient) {
                sendJsonResponse(false, 'Patient not found', null, 404);
            }

            // Fetch patient's appointments
            $apptStmt = $pdo->prepare("SELECT * FROM appointments WHERE patient_id = :id ORDER BY appointment_date DESC, appointment_time DESC");
            $apptStmt->execute([':id' => $id]);
            $patient['appointments'] = $apptStmt->fetchAll();

            // Fetch patient's dental chart records
            $chartStmt = $pdo->prepare("SELECT * FROM dental_charts WHERE patient_id = :id ORDER BY tooth_number ASC");
            $chartStmt->execute([':id' => $id]);
            $patient['dental_chart'] = $chartStmt->fetchAll();

            // Fetch patient's clinical notes
            $notesStmt = $pdo->prepare("SELECT * FROM clinical_notes WHERE patient_id = :id ORDER BY note_date DESC");
            $notesStmt->execute([':id' => $id]);
            $patient['clinical_notes'] = $notesStmt->fetchAll();

            // Fetch patient's prescriptions
            $rxStmt = $pdo->prepare("SELECT * FROM prescriptions WHERE patient_id = :id ORDER BY rx_date DESC");
            $rxStmt->execute([':id' => $id]);
            $patient['prescriptions'] = $rxStmt->fetchAll();

            // Fetch patient's dental images
            $imgStmt = $pdo->prepare("SELECT * FROM dental_images WHERE patient_id = :id ORDER BY uploaded_at DESC");
            $imgStmt->execute([':id' => $id]);
            $patient['images'] = $imgStmt->fetchAll();

            sendJsonResponse(true, 'Patient details loaded', $patient);
        } else {
            // Fetch list with optional search query
            if (!empty($search)) {
                $term = "%$search%";
                $stmt = $pdo->prepare("SELECT p.*, 
                    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) AS total_visits,
                    (SELECT appointment_date FROM appointments a WHERE a.patient_id = p.id ORDER BY appointment_date DESC LIMIT 1) AS last_visit
                    FROM patients p 
                    WHERE full_name LIKE :term OR phone LIKE :term OR patient_code LIKE :term OR email LIKE :term
                    ORDER BY p.id DESC");
                $stmt->execute([':term' => $term]);
            } else {
                $stmt = $pdo->query("SELECT p.*, 
                    (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) AS total_visits,
                    (SELECT appointment_date FROM appointments a WHERE a.patient_id = p.id ORDER BY appointment_date DESC LIMIT 1) AS last_visit
                    FROM patients p 
                    ORDER BY p.id DESC");
            }
            $patients = $stmt->fetchAll();
            sendJsonResponse(true, 'Patients retrieved successfully', $patients);
        }
    } catch (Exception $e) {
        sendJsonResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST: Add New Patient Record
// -------------------------------------------------------------
elseif ($method === 'POST') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $fullName = trim($payload['full_name'] ?? '');
    $phone = trim($payload['phone'] ?? '');
    $gender = trim($payload['gender'] ?? 'Male');
    $dob = trim($payload['dob'] ?? date('Y-m-d', strtotime('-30 years')));
    $age = intval($payload['age'] ?? 30);
    $email = trim($payload['email'] ?? '');
    $bloodGroup = trim($payload['blood_group'] ?? 'O+');
    $address = trim($payload['address'] ?? '');
    $emergencyName = trim($payload['emergency_contact_name'] ?? '');
    $emergencyPhone = trim($payload['emergency_contact_phone'] ?? '');
    $medicalHistory = trim($payload['medical_history'] ?? '');
    $dentalHistory = trim($payload['dental_history'] ?? '');
    $allergies = trim($payload['allergies'] ?? 'No known allergies');

    if (empty($fullName) || empty($phone)) {
        sendJsonResponse(false, 'Patient name and phone number are required.', null, 400);
    }

    try {
        // Auto-generate patient code
        $countStmt = $pdo->query("SELECT COUNT(*) AS total FROM patients");
        $count = $countStmt->fetch()['total'] ?? 0;
        $patientCode = 'CD-' . str_pad($count + 1001, 4, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("INSERT INTO patients (
            doctor_id, patient_code, full_name, gender, dob, age, phone, email, 
            blood_group, address, emergency_contact_name, emergency_contact_phone, 
            medical_history, dental_history, allergies, consent_signed, status
        ) VALUES (
            1, :code, :name, :gender, :dob, :age, :phone, :email, 
            :blood, :address, :em_name, :em_phone, 
            :med_hist, :dent_hist, :allergies, 1, 'Active'
        )");

        $stmt->execute([
            ':code'      => $patientCode,
            ':name'      => $fullName,
            ':gender'    => $gender,
            ':dob'       => $dob,
            ':age'       => $age,
            ':phone'     => $phone,
            ':email'     => $email,
            ':blood'     => $bloodGroup,
            ':address'   => $address,
            ':em_name'   => $emergencyName,
            ':em_phone'  => $emergencyPhone,
            ':med_hist'  => $medicalHistory,
            ':dent_hist' => $dentalHistory,
            ':allergies' => $allergies
        ]);

        $newId = $pdo->lastInsertId();
        sendJsonResponse(true, 'Patient registered successfully!', [
            'id' => $newId,
            'patient_code' => $patientCode,
            'full_name' => $fullName
        ], 201);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to save patient: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// PUT: Update Existing Patient Record
// -------------------------------------------------------------
elseif ($method === 'PUT') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $id = intval($payload['id'] ?? 0);
    if ($id <= 0) {
        sendJsonResponse(false, 'Invalid patient ID for update.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("UPDATE patients SET 
            full_name = :name, 
            gender = :gender, 
            dob = :dob, 
            age = :age, 
            phone = :phone, 
            email = :email, 
            blood_group = :blood, 
            address = :address, 
            emergency_contact_name = :em_name, 
            emergency_contact_phone = :em_phone, 
            medical_history = :med_hist, 
            dental_history = :dent_hist, 
            allergies = :allergies,
            status = :status
            WHERE id = :id");

        $stmt->execute([
            ':id'        => $id,
            ':name'      => trim($payload['full_name'] ?? ''),
            ':gender'    => trim($payload['gender'] ?? 'Male'),
            ':dob'       => trim($payload['dob'] ?? '1990-01-01'),
            ':age'       => intval($payload['age'] ?? 30),
            ':phone'     => trim($payload['phone'] ?? ''),
            ':email'     => trim($payload['email'] ?? ''),
            ':blood'     => trim($payload['blood_group'] ?? 'O+'),
            ':address'   => trim($payload['address'] ?? ''),
            ':em_name'   => trim($payload['emergency_contact_name'] ?? ''),
            ':em_phone'  => trim($payload['emergency_contact_phone'] ?? ''),
            ':med_hist'  => trim($payload['medical_history'] ?? ''),
            ':dent_hist' => trim($payload['dental_history'] ?? ''),
            ':allergies' => trim($payload['allergies'] ?? ''),
            ':status'    => trim($payload['status'] ?? 'Active')
        ]);

        sendJsonResponse(true, 'Patient details updated successfully!');
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to update patient: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// DELETE: Remove Patient Record
// -------------------------------------------------------------
elseif ($method === 'DELETE') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $id = isset($_GET['id']) ? intval($_GET['id']) : intval($payload['id'] ?? 0);
    if ($id <= 0) {
        sendJsonResponse(false, 'Invalid patient ID for deletion.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM patients WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendJsonResponse(true, 'Patient record deleted successfully.');
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to delete patient: ' . $e->getMessage(), null, 500);
    }
}
?>
