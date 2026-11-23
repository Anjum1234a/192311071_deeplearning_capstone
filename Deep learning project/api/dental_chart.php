<?php
/**
 * CLINIDENT - Dental Charting (Odontogram) API
 * Adult 32 Teeth (FDI Two-Digit Standard 11-48)
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// -------------------------------------------------------------
// GET: Fetch Patient's Dental Odontogram Chart
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    if ($patientId <= 0) {
        sendJsonResponse(false, 'Patient ID is required.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM dental_charts WHERE patient_id = :pid ORDER BY tooth_number ASC");
        $stmt->execute([':pid' => $patientId]);
        $chartData = $stmt->fetchAll();

        // Convert to map indexed by tooth_number
        $teethMap = [];
        foreach ($chartData as $row) {
            $teethMap[$row['tooth_number']] = $row;
        }

        // Complete standard 32 FDI teeth list
        $allFdiTeeth = [
            18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
            48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38
        ];

        $fullChart = [];
        foreach ($allFdiTeeth as $tNum) {
            if (isset($teethMap[$tNum])) {
                $fullChart[] = $teethMap[$tNum];
            } else {
                $fullChart[] = [
                    'patient_id' => $patientId,
                    'tooth_number' => $tNum,
                    'condition_state' => 'healthy',
                    'surfaces' => 'O',
                    'pocket_depth_mm' => 2,
                    'mobility_grade' => 0,
                    'endodontic_status' => 'Vital',
                    'notes' => ''
                ];
            }
        }

        sendJsonResponse(true, 'Dental chart loaded successfully', $fullChart);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to load dental chart: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST / PUT: Update Tooth Condition & Periodontal Status
// -------------------------------------------------------------
elseif ($method === 'POST' || $method === 'PUT') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = intval($payload['patient_id'] ?? 0);
    $toothNumber = intval($payload['tooth_number'] ?? 0);
    $condition = trim($payload['condition_state'] ?? 'healthy');
    $surfaces = trim($payload['surfaces'] ?? 'O');
    $pocketDepth = intval($payload['pocket_depth_mm'] ?? 2);
    $mobility = intval($payload['mobility_grade'] ?? 0);
    $endoStatus = trim($payload['endodontic_status'] ?? 'Vital');
    $notes = trim($payload['notes'] ?? '');

    if ($patientId <= 0 || $toothNumber <= 0) {
        sendJsonResponse(false, 'Valid Patient ID and Tooth Number are required.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO dental_charts (
            patient_id, tooth_number, condition_state, surfaces, 
            pocket_depth_mm, mobility_grade, endodontic_status, notes
        ) VALUES (
            :pid, :tnum, :cond, :surf, 
            :pd, :mob, :endo, :notes
        ) ON DUPLICATE KEY UPDATE 
            condition_state = VALUES(condition_state),
            surfaces = VALUES(surfaces),
            pocket_depth_mm = VALUES(pocket_depth_mm),
            mobility_grade = VALUES(mobility_grade),
            endodontic_status = VALUES(endodontic_status),
            notes = VALUES(notes),
            updated_at = CURRENT_TIMESTAMP");

        $stmt->execute([
            ':pid'   => $patientId,
            ':tnum'  => $toothNumber,
            ':cond'  => $condition,
            ':surf'  => $surfaces,
            ':pd'    => $pocketDepth,
            ':mob'   => $mobility,
            ':endo'  => $endoStatus,
            ':notes' => $notes
        ]);

        sendJsonResponse(true, "Tooth #$toothNumber condition saved as " . strtoupper($condition));
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to update tooth: ' . $e->getMessage(), null, 500);
    }
}
?>
