-- Cleanup: Remove all existing medical records and start fresh
-- Run this to clean up old records before the fix

-- 1. Delete all medical records
DELETE FROM medical_records;

-- 2. Verify deletion
SELECT COUNT(*) as remaining_records FROM medical_records;

-- Success message
SELECT 'All old medical records removed successfully!' as message;
SELECT 'Patients can now upload fresh medical records' as message;
