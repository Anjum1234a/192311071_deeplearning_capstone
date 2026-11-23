<?php
/**
 * CLINIDENT - Clinical Documentation API
 * SOAP Notes (Subjective, Objective, Assessment, Plan), Procedures, Voice Notes
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$payload = getJsonPayload();

// -------------------------------------------------------------
// GET: Fetch Clinical Notes for a Patient
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    if ($patientId <= 0) {
        sendJsonResponse(false, 'Patient ID required.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM clinical_notes WHERE patient_id = :pid ORDER BY note_date DESC");
        $stmt->execute([':pid' => $patientId]);
        $notes = $stmt->fetchAll();
        sendJsonResponse(true, 'Clinical notes retrieved successfully', $notes);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to fetch clinical notes: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST: Save New SOAP Clinical Note
// -------------------------------------------------------------
elseif ($method === 'POST') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = intval($payload['patient_id'] ?? 0);
    $procedureTitle = trim($payload['procedure_title'] ?? 'Clinical Consultation');
    $subjective = trim($payload['subjective'] ?? '');
    $objective = trim($payload['objective'] ?? '');
    $assessment = trim($payload['assessment'] ?? '');
    $plan = trim($payload['plan'] ?? '');
    $anesthesia = trim($payload['anesthesia_used'] ?? 'None');
    $voiceTranscription = trim($payload['voice_transcription'] ?? '');

    if ($patientId <= 0 || empty($assessment)) {
        sendJsonResponse(false, 'Patient ID and Assessment (Diagnosis) are required.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO clinical_notes (
            doctor_id, patient_id, procedure_title, subjective, objective, 
            assessment, plan, anesthesia_used, voice_transcription
        ) VALUES (
            1, :pid, :title, :subj, :obj, 
            :assess, :plan, :anes, :voice
        )");

        $stmt->execute([
            ':pid'    => $patientId,
            ':title'  => $procedureTitle,
            ':subj'   => $subjective,
            ':obj'    => $objective,
            ':assess' => $assessment,
            ':plan'   => $plan,
            ':anes'   => $anesthesia,
            ':voice'  => $voiceTranscription
        ]);

        $newId = $pdo->lastInsertId();
        sendJsonResponse(true, 'Clinical SOAP note saved successfully!', ['id' => $newId], 201);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to save clinical note: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// DELETE: Remove Clinical Note
// -------------------------------------------------------------
elseif ($method === 'DELETE') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $id = isset($_GET['id']) ? intval($_GET['id']) : intval($payload['id'] ?? 0);
    if ($id <= 0) {
        sendJsonResponse(false, 'Invalid note ID.', null, 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM clinical_notes WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendJsonResponse(true, 'Clinical note deleted.');
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to delete note: ' . $e->getMessage(), null, 500);
    }
}
?>
