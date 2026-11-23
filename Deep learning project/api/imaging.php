<?php
/**
 * CLINIDENT - Dental Imaging Management API
 * IOPA, OPG, CBCT, Intraoral Photos, and 3D STL Scans
 */

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// -------------------------------------------------------------
// GET: Fetch Images for Patient
// -------------------------------------------------------------
if ($method === 'GET') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = isset($_GET['patient_id']) ? intval($_GET['patient_id']) : 0;
    $type = $_GET['type'] ?? null;

    try {
        $sql = "SELECT img.*, p.full_name AS patient_name, p.patient_code 
                FROM dental_images img 
                JOIN patients p ON img.patient_id = p.id 
                WHERE 1=1";
        $params = [];

        if ($patientId > 0) {
            $sql .= " AND img.patient_id = :pid";
            $params[':pid'] = $patientId;
        }
        if ($type) {
            $sql .= " AND img.image_type = :type";
            $params[':type'] = $type;
        }

        $sql .= " ORDER BY img.uploaded_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $images = $stmt->fetchAll();

        sendJsonResponse(true, 'Dental images retrieved successfully', $images);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to fetch dental images: ' . $e->getMessage(), null, 500);
    }
}

// -------------------------------------------------------------
// POST: Upload Dental Image or Register Asset
// -------------------------------------------------------------
elseif ($method === 'POST') {
    if (!$pdo) {
        sendJsonResponse(false, 'Database connection unavailable', null, 503);
    }

    $patientId = intval($_POST['patient_id'] ?? 0);
    $imageType = trim($_POST['image_type'] ?? 'IOPA');
    $toothNumber = !empty($_POST['tooth_number']) ? intval($_POST['tooth_number']) : null;
    $stage = trim($_POST['stage'] ?? 'Pre-Treatment');
    $notes = trim($_POST['notes'] ?? '');

    if ($patientId <= 0) {
        sendJsonResponse(false, 'Valid Patient ID is required.', null, 400);
    }

    $filePath = '';
    $fileName = '';
    $fileSizeKb = 0;

    // Check if actual file uploaded via multipart/form-data
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $tmpName = $_FILES['file']['tmp_name'];
        $originalName = basename($_FILES['file']['name']);
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        // Format segregation
        if ($imageType === 'STL' || $ext === 'stl') {
            $imageType = 'STL';
            $targetDir = __DIR__ . '/../uploads/stl/';
            $relPath = 'uploads/stl/';
        } else {
            $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'dcm'];
            if (!in_array($ext, $allowedExts)) {
                sendJsonResponse(false, 'Unsupported image format. Allowed formats: JPG, JPEG, PNG, WEBP, STL.', null, 400);
            }
            $targetDir = __DIR__ . '/../uploads/images/';
            $relPath = 'uploads/images/';
        }

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $newFileName = 'cd_' . $patientId . '_' . time() . '.' . $ext;
        $destPath = $targetDir . $newFileName;

        if (move_uploaded_file($tmpName, $destPath)) {
            $filePath = $relPath . $newFileName;
            $fileName = $originalName;
            $fileSizeKb = round(filesize($destPath) / 1024);
        } else {
            sendJsonResponse(false, 'Failed to save uploaded file.', null, 500);
        }
    } else {
        // Fallback for demo sample asset registration
        $fileName = trim($_POST['file_name'] ?? 'radiograph_sample.png');
        $filePath = trim($_POST['file_path'] ?? 'uploads/images/sample_iopa_16.png');
        $fileSizeKb = intval($_POST['file_size_kb'] ?? 350);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO dental_images (
            patient_id, image_type, file_path, file_name, file_size_kb, 
            tooth_number, stage, notes
        ) VALUES (
            :pid, :type, :path, :fname, :fsize, 
            :tooth, :stage, :notes
        )");

        $stmt->execute([
            ':pid'   => $patientId,
            ':type'  => $imageType,
            ':path'  => $filePath,
            ':fname' => $fileName,
            ':fsize' => $fileSizeKb,
            ':tooth' => $toothNumber,
            ':stage' => $stage,
            ':notes' => $notes
        ]);

        $newId = $pdo->lastInsertId();
        sendJsonResponse(true, 'Dental image record registered successfully!', [
            'id' => $newId,
            'file_path' => $filePath,
            'image_type' => $imageType
        ], 201);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Database insert error: ' . $e->getMessage(), null, 500);
    }
}
?>
