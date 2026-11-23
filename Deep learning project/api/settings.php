<?php
/**
 * CLINIDENT - Doctor Profile & Clinic Settings API
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// GET: Fetch Doctor Profile and Clinic Settings
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(true, 'Demo doctor settings', [
            'id' => 1,
            'name' => 'Dr. Sarah Mitchell, BDS, MDS',
            'email' => 'doctor@clinident.com',
            'phone' => '+91 98765 43210',
            'license_number' => 'DENT-REG-84920',
            'specialization' => 'Consultant Dental Surgeon & Implantologist',
            'clinic_name' => 'CLINIDENT Advanced Dental Care',
            'clinic_address' => 'Suite 402, Metro Healthcare Towers, MG Road, Bengaluru, 560001'
        ]);
    }

    try {
        $stmt = $pdo->query("SELECT id, name, email, phone, license_number, specialization, clinic_name, clinic_address FROM doctors WHERE id = 1 LIMIT 1");
        $doctor = $stmt->fetch();
        if ($doctor) {
            sendJsonResponse(true, 'Doctor settings retrieved', $doctor);
        } else {
            sendJsonResponse(false, 'Doctor record not found', null, 404);
        }
    } catch (Exception $e) {
        sendJsonResponse(false, 'Database error: ' . $e->getMessage(), null, 500);
    }
}

// POST / PUT: Update Doctor and Clinic Information
elseif ($method === 'POST' || $method === 'PUT') {
    $name = trim($payload['name'] ?? '');
    $email = trim($payload['email'] ?? '');
    $phone = trim($payload['phone'] ?? '');
    $clinicName = trim($payload['clinic_name'] ?? '');
    $clinicAddress = trim($payload['clinic_address'] ?? '');

    if (empty($name) || empty($email) || empty($clinicName)) {
        sendJsonResponse(false, 'Doctor name, email, and clinic name are required.', null, 400);
    }

    if (!$pdo) {
        // Fallback for offline mode
        sendJsonResponse(true, 'Settings updated (Demo/Client Mode)', [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'clinic_name' => $clinicName,
            'clinic_address' => $clinicAddress
        ]);
    }

    try {
        $stmt = $pdo->prepare("UPDATE doctors SET 
            name = :name, 
            email = :email, 
            phone = :phone, 
            clinic_name = :clinic_name, 
            clinic_address = :clinic_address 
            WHERE id = 1");

        $stmt->execute([
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone,
            ':clinic_name' => $clinicName,
            ':clinic_address' => $clinicAddress
        ]);

        sendJsonResponse(true, 'Doctor & clinic settings updated successfully!');
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to update settings: ' . $e->getMessage(), null, 500);
    }
}
?>