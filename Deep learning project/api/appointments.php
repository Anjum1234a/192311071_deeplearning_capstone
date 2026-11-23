<?php
/**
 * CLINIDENT - Appointments Management API
 * Calendar, Scheduler, Status Updates
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// -------------------------------------------------------------
// GET: Fetch Appointments
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $date = $_GET['date'] ?? null;
    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : null;
    $status = $_GET['status'] ?? null;

    try {
        $sql = "SELECT a.*, p.full_name AS patient_name, p.phone AS patient_phone, p.patient_code 
                FROM appointments a 
                JOIN patients p ON a.patient_id = p.id 
                WHERE 1=1";
        $params = [];

        if ($date) {
            $sql .= " AND a.appointment_date = :date";
            $params[':date'] = $date;
        }
        if ($patientId) {
            $sql .= " AND a.patient_id = :pid";
            $params[':pid'] = $patientId;
        }
        if ($status) {
            $sql .= " AND a.status = :status";
            $params[':status'] = $status;
        }

        $sql .= " ORDER BY a.appointment_date ASC, a.appointment_time ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll();

        sendJsonResponse(true, 'Appointments retrieved successfully', $appointments);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Error fetching appointments: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST: Book New Appointment
// -------------------------------------------------------------
elseif ($method === 'POST') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = intval($payload['patient_id'] ?? 0);
    $date = trim($payload['appointment_date'] ?? date('Y-m-d'));
    $time = trim($payload['appointment_time'] ?? '10:00:00');
    $duration = intval($payload['duration_minutes'] ?? 30);
    $reason = trim($payload['reason_for_visit'] ?? 'General Consultation');
    $treatmentType = trim($payload['treatment_type'] ?? 'General Dentistry');
    $status = trim($payload['status'] ?? 'Scheduled');
    $notes = trim($payload['notes'] ?? '');

    if ($patientId <= 0) {
        sendJsonResponse(false, 'Please select a valid patient.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO appointments (
            doctor_id, patient_id, appointment_date, appointment_time, 
            duration_minutes, reason_for_visit, treatment_type, status, notes
        ) VALUES (
            1, :pid, :date, :time, 
            :duration, :reason, :treatment, :status, :notes
        )");

        $stmt->execute([
            ':pid'       => $patientId,
            ':date'      => $date,
            ':time'      => $time,
            ':duration'  => $duration,
            ':reason'    => $reason,
            ':treatment' => $treatmentType,
            ':status'    => $status,
            ':notes'     => $notes
        ]);

        $newId = $pdo->lastInsertId();
        sendJsonResponse(true, 'Appointment booked successfully!', ['id' => $newId], 201);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to book appointment: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// PUT: Update Status or Reschedule Appointment
// -------------------------------------------------------------
elseif ($method === 'PUT') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $id = intval($payload['id'] ?? 0);
    if ($id <= 0) {
        sendJsonResponse(false, 'Invalid appointment ID.', null, 400);
    }

    try {
        $fields = [];
        $params = [':id' => $id];

        if (isset($payload['status'])) {
            $fields[] = "status = :status";
            $params[':status'] = trim($payload['status']);
        }
        if (isset($payload['appointment_date'])) {
            $fields[] = "appointment_date = :date";
            $params[':date'] = trim($payload['appointment_date']);
        }
        if (isset($payload['appointment_time'])) {
            $fields[] = "appointment_time = :time";
            $params[':time'] = trim($payload['appointment_time']);
        }
        if (isset($payload['notes'])) {
            $fields[] = "notes = :notes";
            $params[':notes'] = trim($payload['notes']);
        }

        if (empty($fields)) {
            sendJsonResponse(false, 'No fields specified for update.', null, 400);
        }

        $sql = "UPDATE appointments SET " . implode(", ", $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendJsonResponse(true, 'Appointment updated successfully!');
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to update appointment: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// DELETE: Cancel / Remove Appointment
// -------------------------------------------------------------
elseif ($method === 'DELETE') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $id = isset($_GET['id']) ? intval($_GET['id']) : intval($payload['id'] ?? 0);
    if ($id <= 0) {
        sendJsonResponse(false, 'Invalid appointment ID.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendJsonResponse(true, 'Appointment removed.');
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to delete appointment: ' . $e->getMessage(), null, 500);
    }
}
?>
