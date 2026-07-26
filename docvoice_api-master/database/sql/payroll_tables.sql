-- =====================================================
-- ملف إنشاء جداول نظام الرواتب
-- الترتيب الصحيح: drivers -> payroll_runs -> driver_payrolls -> allowances/deductions/manual_adjustments
-- =====================================================

-- 1. جدول السائقين (يجب إنشاؤه أولاً)

-- 2. جدول مسيرات الرواتب الرئيسي
CREATE TABLE `payroll_runs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `period` varchar(10) NOT NULL COMMENT 'فترة الراتب (مثال: 2025-08)',
  `period_name` varchar(255) NOT NULL COMMENT 'اسم فترة الراتب (مثال: رواتب شهر أغسطس 2025)',
  `working_days` int(11) NOT NULL DEFAULT 26 COMMENT 'عدد أيام العمل',
  `status` enum('draft','approved','paid','cancelled') NOT NULL DEFAULT 'draft' COMMENT 'حالة المسير',
  `summary` json DEFAULT NULL COMMENT 'إجماليات المسير',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payroll_runs_period_status_index` (`period`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول مسيرات الرواتب الرئيسي';

-- 3. جدول رواتب السائقين
CREATE TABLE `driver_payrolls` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `payroll_run_id` bigint(20) UNSIGNED NOT NULL COMMENT 'معرف مسير الرواتب',
  `driver_id` bigint(20) UNSIGNED NOT NULL COMMENT 'معرف السائق',
  `driver_name` varchar(255) NOT NULL COMMENT 'اسم السائق',
  `base_salary` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'الراتب الأساسي',
  `target_bonus` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'مكافأة التارجت',
  `working_days_actual` int(11) NOT NULL DEFAULT 26 COMMENT 'أيام العمل الفعلية',
  `absence_days` int(11) NOT NULL DEFAULT 0 COMMENT 'أيام الغياب',
  `overtime_hours` int(11) NOT NULL DEFAULT 0 COMMENT 'ساعات العمل الإضافي',
  `total_earnings` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي الأرباح',
  `total_deductions` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي الخصومات',
  `net_salary` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'صافي الراتب',
  `payment_status` enum('pending','paid','cancelled') NOT NULL DEFAULT 'pending' COMMENT 'حالة الدفع',
  `payment_date` timestamp NULL DEFAULT NULL COMMENT 'تاريخ الدفع',
  `bank_transaction_id` varchar(255) DEFAULT NULL COMMENT 'معرف المعاملة البنكية',
  `payment_note` text DEFAULT NULL COMMENT 'ملاحظات الدفع',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_payrolls_payroll_run_id_driver_id_index` (`payroll_run_id`,`driver_id`),
  KEY `driver_payrolls_payment_status_index` (`payment_status`),
  KEY `driver_payrolls_driver_id_index` (`driver_id`),
  CONSTRAINT `driver_payrolls_payroll_run_id_foreign` FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_payrolls_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول رواتب السائقين';

-- 4. جدول البدلات
CREATE TABLE `allowances` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `driver_payroll_id` bigint(20) UNSIGNED NOT NULL COMMENT 'معرف راتب السائق',
  `name` varchar(255) NOT NULL COMMENT 'اسم البدل (مثال: بدل إنترنت شهري)',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'مبلغ البدل',
  `type` enum('monthly','daily','one_time') NOT NULL DEFAULT 'monthly' COMMENT 'نوع البدل',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `allowances_driver_payroll_id_index` (`driver_payroll_id`),
  CONSTRAINT `allowances_driver_payroll_id_foreign` FOREIGN KEY (`driver_payroll_id`) REFERENCES `driver_payrolls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول البدلات';

-- 5. جدول الخصومات
CREATE TABLE `deductions` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `driver_payroll_id` bigint(20) UNSIGNED NOT NULL COMMENT 'معرف راتب السائق',
  `name` varchar(255) NOT NULL COMMENT 'اسم الخصم (مثال: خصم تأخير، خصم غياب)',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'مبلغ الخصم',
  `type` enum('fixed','percentage','daily') NOT NULL DEFAULT 'fixed' COMMENT 'نوع الخصم',
  `reason` text DEFAULT NULL COMMENT 'سبب الخصم',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deductions_driver_payroll_id_index` (`driver_payroll_id`),
  CONSTRAINT `deductions_driver_payroll_id_foreign` FOREIGN KEY (`driver_payroll_id`) REFERENCES `driver_payrolls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول الخصومات';

-- 6. جدول التعديلات اليدوية
CREATE TABLE `manual_adjustments` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `driver_payroll_id` bigint(20) UNSIGNED NOT NULL COMMENT 'معرف راتب السائق',
  `name` varchar(255) NOT NULL COMMENT 'اسم التعديل (مثال: تعديل خاص، مكافأة إضافية)',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'مبلغ التعديل',
  `type` enum('addition','subtraction') NOT NULL DEFAULT 'addition' COMMENT 'نوع التعديل (إضافة أو خصم)',
  `reason` text DEFAULT NULL COMMENT 'سبب التعديل',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `manual_adjustments_driver_payroll_id_index` (`driver_payroll_id`),
  CONSTRAINT `manual_adjustments_driver_payroll_id_foreign` FOREIGN KEY (`driver_payroll_id`) REFERENCES `driver_payrolls` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول التعديلات اليدوية';


ALTER TABLE `driver_payrolls`
  ADD `expenses_sum` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `total_deductions`,
  ADD `advances_sum` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `expenses_sum`;

-- =====================================================
-- إدراج بيانات تجريبية
-- =====================================================

-- إدراج سائقين تجريبيين

-- إدراج مسير رواتب تجريبي
INSERT INTO `payroll_runs` (`period`, `period_name`, `working_days`, `status`, `summary`, `created_at`, `updated_at`) VALUES
('2025-01', 'رواتب شهر يناير 2025', 26, 'draft', '{"total_drivers": 3, "total_net_salaries": 9300.00, "total_working_days": 78, "total_absence_days": 0}', NOW(), NOW());

-- إدراج رواتب السائقين
INSERT INTO `driver_payrolls` (`payroll_run_id`, `driver_id`, `driver_name`, `base_salary`, `target_bonus`, `working_days_actual`, `absence_days`, `overtime_hours`, `total_earnings`, `total_deductions`, `net_salary`, `payment_status`, `created_at`, `updated_at`) VALUES
(1, 1, 'أحمد محمد', 3000.00, 500.00, 26, 0, 0, 3600.00, 0.00, 3600.00, 'pending', NOW(), NOW()),
(1, 2, 'محمد علي', 3500.00, 300.00, 26, 0, 0, 3900.00, 0.00, 3900.00, 'pending', NOW(), NOW()),
(1, 3, 'علي أحمد', 2800.00, 200.00, 26, 0, 0, 3000.00, 0.00, 3000.00, 'pending', NOW(), NOW());

-- إدراج بدلات تجريبية
INSERT INTO `allowances` (`driver_payroll_id`, `name`, `amount`, `type`, `created_at`, `updated_at`) VALUES
(1, 'بدل إنترنت شهري', 100.00, 'monthly', NOW(), NOW()),
(2, 'بدل إنترنت شهري', 100.00, 'monthly', NOW(), NOW()),
(3, 'بدل إنترنت شهري', 100.00, 'monthly', NOW(), NOW());

-- =====================================================
-- فحص العلاقات
-- =====================================================

-- فحص العلاقات بين الجداول
SELECT
    'payroll_runs' as table_name,
    COUNT(*) as record_count
FROM payroll_runs
UNION ALL
SELECT
    'driver_payrolls' as table_name,
    COUNT(*) as record_count
FROM driver_payrolls
UNION ALL
SELECT
    'allowances' as table_name,
    COUNT(*) as record_count
FROM allowances
UNION ALL
SELECT
    'drivers' as table_name,
    COUNT(*) as record_count
FROM drivers;

-- فحص العلاقات مع السائقين
SELECT
    pr.period,
    pr.period_name,
    COUNT(dp.id) as drivers_count,
    SUM(dp.net_salary) as total_salaries
FROM payroll_runs pr
LEFT JOIN driver_payrolls dp ON pr.id = dp.payroll_run_id
GROUP BY pr.id;

-- فحص البدلات لكل سائق
SELECT
    dp.driver_name,
    a.name as allowance_name,
    a.amount,
    a.type
FROM driver_payrolls dp
JOIN allowances a ON dp.id = a.driver_payroll_id
ORDER BY dp.driver_name;

-- =====================================================
-- ملاحظات مهمة
-- =====================================================

/*
1. جميع الجداول تستخدم InnoDB engine لدعم Foreign Keys
2. تم إضافة indexes للاستعلامات السريعة
3. جميع العلاقات تستخدم CASCADE DELETE
4. تم استخدام JSON field للإجماليات لسهولة التخزين والاسترجاع
5. جميع المبالغ تستخدم decimal(10,2) لدقة الأرقام العشرية
6. تم إضافة تعليقات عربية لجميع الحقول
7. الترتيب الصحيح: drivers -> payroll_runs -> driver_payrolls -> allowances/deductions/manual_adjustments
8. جميع العلاقات مترابطة بشكل صحيح مع Foreign Keys
*/
