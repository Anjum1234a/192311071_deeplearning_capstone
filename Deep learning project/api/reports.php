<?php
/**
 * CLINIDENT - Reports & Clinic Analytics API
 * Aggregates statistics, appointment counts, and treatment summaries
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();

if (!$pdo) {
    // Return sample analytical payload if database is offline
    sendJsonResponse(true, 'Clinic statistics (Demo Mode)', [
        'total_patients' => 148,
        'today_appointments' => 4,
        'upcoming_appointments' => 18,
        'completed_treatments' => 112,
        'pending_treatments' => 36,
        'treatments_breakdown' => [
            ['type' => 'Root Canal Therapy', 'count' => 38, 'percentage' => 34],
            ['type' => 'Crown & Bridge', 'count' => 29, 'percentage' => 26],
            ['type' => 'Oral Prophylaxis (Scaling)', 'count' => 24, 'percentage' => 21],
            ['type' => 'Composite Restorations', 'count' => 14, 'percentage' => 12],
            ['type' => 'Extractions', 'count' => 7, 'percentage' => 7]
        ],
        'monthly_trend' => [
            ['month' => 'May', 'patients' => 22, 'revenue' => 45000],
            ['month' => 'Jun', 'patients' => 26, 'revenue' => 52000],
            ['month' => 'Jul', 'patients' => 31, 'revenue' => 61000],
            ['month' => 'Aug', 'patients' => 29, 'revenue' => 58000],
            ['month' => 'Sep', 'patients' => 34, 'revenue' => 69000],
            ['month' => 'Oct', 'patients' => 38, 'revenue' => 74000]
        ]
    ]);
}

try {
    // 1. Total Patients
    $pStmt = $pdo->query("SELECT COUNT(*) AS total FROM patients");
    $totalPatients = $pStmt->fetch()['total'] ?? 0;

    // 2. Today's Appointments
    $todayStmt = $pdo->query("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = CURRENT_DATE");
    $todayAppts = $todayStmt->fetch()['total'] ?? 0;

    // 3. Upcoming Appointments
    $upStmt = $pdo->query("SELECT COUNT(*) AS total FROM appointments WHERE appointment_date >= CURRENT_DATE AND status = 'Scheduled'");
    $upcomingAppts = $upStmt->fetch()['total'] ?? 0;

    // 4. Completed Treatments
    $compStmt = $pdo->query("SELECT COUNT(*) AS total FROM appointments WHERE status = 'Completed'");
    $completedTreatments = $compStmt->fetch()['total'] ?? 0;

    // 5. Pending Treatments
    $pendingTreatments = $upcomingAppts;

    // 6. Treatment Type Distribution
    $treatStmt = $pdo->query("SELECT treatment_type, COUNT(*) AS count FROM appointments GROUP BY treatment_type ORDER BY count DESC LIMIT 6");
    $treatmentsBreakdown = $treatStmt->fetchAll();

    // 7. Recent Patient Activities
    $recentStmt = $pdo->query("SELECT a.*, p.full_name AS patient_name, p.patient_code 
                               FROM appointments a 
                               JOIN patients p ON a.patient_id = p.id 
                               ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 5");
    $recentActivities = $recentStmt->fetchAll();

    sendJsonResponse(true, 'Reports retrieved successfully', [
        'total_patients' => $totalPatients,
        'today_appointments' => $todayAppts,
        'upcoming_appointments' => $upcomingAppts,
        'completed_treatments' => $completedTreatments,
        'pending_treatments' => $pendingTreatments,
        'treatments_breakdown' => $treatmentsBreakdown,
        'recent_activities' => $recentActivities
    ]);
} catch (Exception $e) {
    sendJsonResponse(false, 'Error compiling reports: ' . $e->getMessage(), null, 500);
}
?>
