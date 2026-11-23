<?php
/**
 * CLINIDENT - Clinical Dashboard Aggregation API
 * Live metrics for today's queue, patient counts, and clinical workload
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();

if (!$pdo) {
    sendJsonResponse(true, 'Dashboard metrics (Offline/Demo Mode)', [
        'total_patients' => 4,
        'today_appointments_count' => 4,
        'upcoming_appointments_count' => 3,
        'completed_treatments_count' => 1,
        'pending_treatments_count' => 3,
        'today_queue' => [
            [
                'id' => 1,
                'patient_name' => 'James Anderson',
                'patient_code' => 'CD-1001',
                'appointment_time' => '10:00:00',
                'treatment_type' => 'Root Canal Therapy',
                'reason_for_visit' => 'Severe pain on upper right molar with cold sensitivity',
                'status' => 'Scheduled'
            ],
            [
                'id' => 2,
                'patient_name' => 'Priya Sharma',
                'patient_code' => 'CD-1002',
                'appointment_time' => '11:30:00',
                'treatment_type' => 'Oral Prophylaxis',
                'reason_for_visit' => 'Routine 6-month checkup and ultrasonic scaling',
                'status' => 'Completed'
            ],
            [
                'id' => 3,
                'patient_name' => 'Robert Chen',
                'patient_code' => 'CD-1003',
                'appointment_time' => '14:30:00',
                'treatment_type' => 'Crown Preparation',
                'reason_for_visit' => 'Crown prep & bite impression for lower molar',
                'status' => 'Scheduled'
            ],
            [
                'id' => 4,
                'patient_name' => 'Ananya Deshmukh',
                'patient_code' => 'CD-1004',
                'appointment_time' => '16:00:00',
                'treatment_type' => 'Oral Surgery Consult',
                'reason_for_visit' => 'Impacted wisdom tooth consultation and OPG review',
                'status' => 'Waiting List'
            ]
        ]
    ]);
}

try {
    // Total Patients
    $pStmt = $pdo->query("SELECT COUNT(*) AS total FROM patients");
    $totalPatients = intval($pStmt->fetch()['total'] ?? 0);

    // Today's appointments count
    $todayCountStmt = $pdo->query("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = CURRENT_DATE");
    $todayCount = intval($todayCountStmt->fetch()['total'] ?? 0);

    // Upcoming appointments count
    $upCountStmt = $pdo->query("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date >= CURRENT_DATE AND status = 'Scheduled'");
    $upcomingCount = intval($upCountStmt->fetch()['total'] ?? 0);

    // Completed treatments count
    $compStmt = $pdo->query("SELECT COUNT(*) AS total FROM appointments WHERE status = 'Completed'");
    $completedCount = intval($compStmt->fetch()['total'] ?? 0);

    // Pending treatments
    $pendingCount = $upcomingCount;

    // Today's appointments list
    $queueStmt = $pdo->query("SELECT a.*, p.full_name AS patient_name, p.patient_code, p.phone AS patient_phone 
                              FROM appointments a 
                              JOIN patients p ON a.patient_id = p.id 
                              WHERE a.appointment_date = CURRENT_DATE 
                              ORDER BY a.appointment_time ASC");
    $todayQueue = $queueStmt->fetchAll();

    sendJsonResponse(true, 'Dashboard metrics loaded', [
        'total_patients' => $totalPatients,
        'today_appointments_count' => $todayCount,
        'upcoming_appointments_count' => $upcomingCount,
        'completed_treatments_count' => $completedCount,
        'pending_treatments_count' => $pendingCount,
        'today_queue' => $todayQueue
    ]);
} catch (Exception $e) {
    sendJsonResponse(false, 'Dashboard aggregation error: ' . $e->getMessage(), null, 500);
}
?>