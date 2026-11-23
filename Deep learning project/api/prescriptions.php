<?php
/**
 * CLINIDENT - Prescription Management API
 * E-Prescriptions with Drug Details & Dosage
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// -------------------------------------------------------------
// GET: Fetch Prescriptions
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    try {
        if ($id > 0) {
            $stmt = $pdo->prepare("SELECT rx.*, p.full_name, p.age, p.gender, p.patient_code, p.phone, d.name AS doctor_name, d.clinic_name, d.specialization 
                FROM prescriptions rx
                JOIN patients p ON rx.patient_id = p.id
                JOIN doctors d ON rx.doctor_id = d.id
                WHERE rx.id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $rx = $stmt->fetch();
            if ($rx) {
                $rx['medications'] = json_decode($rx['medications_json'], true) ?: [];
            }
            sendJsonResponse(true, 'Prescription loaded', $rx);
        } else {
            $sql = "SELECT rx.*, p.full_name AS patient_name, p.patient_code 
                    FROM prescriptions rx 
                    JOIN patients p ON rx.patient_id = p.id";
            $params = [];
            if ($patientId > 0) {
                $sql .= " WHERE rx.patient_id = :pid";
                $params[':pid'] = $patientId;
            }
            $sql .= " ORDER BY rx.rx_date DESC, rx.id DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $prescriptions = $stmt->fetchAll();

            foreach ($prescriptions as &$item) {
                $item['medications'] = json_decode($item['medications_json'], true) ?: [];
            }
            sendJsonResponse(true, 'Prescriptions list retrieved', $prescriptions);
        }
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to fetch prescriptions: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST: Create New Prescription
// -------------------------------------------------------------
elseif ($method === 'POST') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = intval($payload['patient_id'] ?? 0);
    $diagnosis = trim($payload['diagnosis'] ?? 'Dental Consultation');
    $medications = $payload['medications'] ?? [];
    $doctorAdvice = trim($payload['doctor_advice'] ?? '');

    if ($patientId <= 0 || empty($medications)) {
        sendJsonResponse(false, 'Patient ID and at least one medication are required.', null, 400);
    }

    try {
        // Generate Unique Rx Number
        $countStmt = $pdo->query("SELECT COUNT(*) AS total FROM prescriptions");
        $count = $countStmt->fetch()['total'] ?? 0;
        $rxNumber = 'RX-' . date('Y') . '-' . str_pad($count + 101, 4, '0', STR_PAD_LEFT);

        $stmt = $pdo->prepare("INSERT INTO prescriptions (
            doctor_id, patient_id, rx_number, rx_date, diagnosis, medications_json, doctor_advice
        ) VALUES (
            1, :pid, :rx_num, CURRENT_DATE, :diag, :meds, :advice
        )");

        $stmt->execute([
            ':pid'    => $patientId,
            ':rx_num' => $rxNumber,
            ':diag'   => $diagnosis,
            ':meds'   => json_encode($medications, JSON_UNESCAPED_UNICODE),
            ':advice' => $doctorAdvice
        ]);

        $newId = $pdo->lastInsertId();
        sendJsonResponse(true, 'Prescription created successfully!', [
            'id' => $newId,
            'rx_number' => $rxNumber
        ], 201);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to generate prescription: ' . $e->getMessage(), null, 500);
    }
}
?>
