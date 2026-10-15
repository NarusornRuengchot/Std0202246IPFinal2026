-- ============================================================================
-- Database Script for IP Final Exam 2026
-- Student: Narusorn Ruengchot (นรุสรณ์ เรืองโชติ)
-- Student ID: 6730202246
-- Database: ip_std6730202246
-- Table Name: NarRue_6730202246
-- ============================================================================

CREATE TABLE IF NOT EXISTS `NarRue_6730202246` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `status` ENUM('Active', 'On Leave') NOT NULL DEFAULT 'Active',
  `salary` DECIMAL(12, 2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Mock Data (10 Employees across salary ranges for K-Means Clustering)
INSERT INTO `NarRue_6730202246` (`name`, `position`, `status`, `salary`) VALUES
('สมชาย วงศ์สกุล', 'CEO', 'Active', 120000.00),
('วิภาวดี ศรีสมร', 'Senior Developer', 'Active', 75000.00),
('ธนพล กิจเจริญ', 'Developer', 'Active', 55000.00),
('สุภาพร ศรีสุข', 'Designer', 'Active', 45000.00),
('อรุณ แสงเดือน', 'HR Manager', 'On Leave', 48000.00),
('พิมพ์ชนก สว่างจิต', 'Accountant', 'Active', 38000.00),
('กมลทิพย์ ร่มเย็น', 'Marketing', 'Active', 32000.00),
('ปัณณ์ ภูมิพัฒน์', 'CTO', 'Active', 95000.00),
('นภัส คงทน', 'Junior Developer', 'Active', 22000.00),
('วิชัย ใจดี', 'Intern', 'Active', 15000.00);
