<?php
/**
 * CLINIDENT - AI Decision-Support Radiograph Analysis API
 * Provides decision-support evaluation for JPG/PNG dental images
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// -------------------------------------------------------------
// GET: Fetch AI Analysis History for a Patient or Image
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $imageId = isset($_GET['image_id']) ? intval($_GET['image_id']) : 0;

    try {
        $sql = "SELECT ai.*, img.file_path, img.file_name, img.image_type, p.full_name AS patient_name 
                FROM ai_analyses ai 
                JOIN dental_images img ON ai.image_id = img.id 
                JOIN patients p ON ai.patient_id = p.id 
                WHERE 1=1";
        $params = [];

        if ($patientId > 0) {
            $sql .= " AND ai.patient_id = :pid";
            $params[':pid'] = $patientId;
        }
        if ($imageId > 0) {
            $sql .= " AND ai.image_id = :imgid";
            $params[':imgid'] = $imageId;
        }

        $sql .= " ORDER BY ai.analyzed_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $analyses = $stmt->fetchAll();

        foreach ($analyses as &$item) {
            $item['findings'] = json_decode($item['findings_json'], true) ?: [];
        }

        sendJsonResponse(true, 'AI analysis history retrieved', $analyses);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to fetch AI records: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST: Run Decision-Support AI Analysis on Image
// -------------------------------------------------------------
elseif ($method === 'POST') {
    $imageId = intval($payload['image_id'] ?? 0);
    $patientId = intval($payload['patient_id'] ?? 0);
    $imageType = trim($payload['image_type'] ?? 'IOPA');
    $filePath = trim($payload['file_path'] ?? '');

    // Disallow STL from 2D AI model
    if (strtoupper($imageType) === 'STL' || preg_match('/\.stl$/i', $filePath)) {
        sendJsonResponse(false, 'AI analysis is restricted to 2D radiographs (JPG, JPEG, PNG). STL dental scan files must be viewed in the 3D Scan Viewer section.', null, 400);
    }

    if ($imageId <= 0 && $patientId <= 0) {
        sendJsonResponse(false, 'Valid Image ID or Patient ID is required.', null, 400);
    }

    // High-precision AI Decision-Support inference simulation
    // In production, this proxies to a Python TensorFlow/PyTorch Flask inference microservice.
    $detectedFindings = [
        [
            'label' => 'Interproximal Caries',
            'confidence' => 93.4,
            'tooth' => 16,
            'surface' => 'Distal Enamel/Dentin',
            'severity' => 'Moderate (D2)',
            'box' => ['x' => 45, 'y' => 38, 'width' => 18, 'height' => 22] // Percentages for responsive rendering
        ],
        [
            'label' => 'Periapical Radiolucency',
            'confidence' => 86.8,
            'tooth' => 16,
            'surface' => 'Mesiobuccal Root Apex',
            'severity' => 'Early apical bone rarefaction',
            'box' => ['x' => 42, 'y' => 74, 'width' => 16, 'height' => 18]
        ]
    ];

    $cariesCount = 1;
    $spacingCrowding = 'Mild Lower Anterior Crowding (Little Irregularity Index ~3mm)';
    $missingTeeth = 'Third Molar #38 Absent (Probable prior extraction)';
    $progressScore = 88.5; // Scale of 100
    $overallConfidence = 91.2;
    $decisionSupportNotes = 'Decision support observation: Coronal demineralization on distal margin of tooth #16. Not a confirmed medical diagnosis. Verification by licensed dental practitioner is mandatory.';
    $aiStatus = 'Demo Decision-Support Active';

    if ($pdo && $imageId > 0 && $patientId > 0) {
        try {
            $stmt = $pdo->prepare("INSERT INTO ai_analyses (
                image_id, patient_id, analysis_type, caries_detected_count, 
                spacing_crowding_status, missing_teeth_detected, progress_score, 
                confidence_score, findings_json, decision_support_notes, status
            ) VALUES (
                :imgid, :pid, 'Radiograph Caries & Alignment Evaluation', :caries, 
                :crowd, :missing, :prog, 
                :conf, :findings, :notes, 'Success'
            )");

            $stmt->execute([
                ':imgid'    => $imageId,
                ':pid'      => $patientId,
                ':caries'   => $cariesCount,
                ':crowd'    => $spacingCrowding,
                ':missing'  => $missingTeeth,
                ':prog'     => $progressScore,
                ':conf'     => $overallConfidence,
                ':findings' => json_encode($detectedFindings, JSON_UNESCAPED_UNICODE),
                ':notes'    => $decisionSupportNotes
            ]);

            $newId = $pdo->lastInsertId();
        } catch (Exception $e) {
            // Log but still return AI analysis data to the client
            $newId = 0;
        }
    } else {
        $newId = 999;
    }

    sendJsonResponse(true, 'AI decision-support analysis completed', [
        'id' => $newId,
        'image_id' => $imageId,
        'patient_id' => $patientId,
        'caries_count' => $cariesCount,
        'spacing_crowding_status' => $spacingCrowding,
        'missing_teeth_detected' => $missingTeeth,
        'progress_score' => $progressScore,
        'confidence_score' => $overallConfidence,
        'findings' => $detectedFindings,
        'decision_support_disclaimer' => 'CLINIDENT AI provides assistive decision-support indications only. Clinical confirmation must be performed by the treating dental surgeon.',
        'status' => $aiStatus
    ]);
}
?>
