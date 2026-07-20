<?php

namespace LaraCore\Helpers;

class CommonHelper
{
    /**
     * Generate a random string.
     */
    public static function randomString(int $length = 10): string
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';

        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }

        return $randomString;
    }

    /**
     * Generate a unique code.
     */
    public static function generateUniqueCode(string $prefix = '', int $length = 8): string
    {
        $code = $prefix . strtoupper(self::randomString($length));
        return $code;
    }

    /**
     * Format currency amount.
     */
    public static function formatCurrency(float $amount, string $currency = 'SAR'): string
    {
        return number_format($amount, 2) . ' ' . $currency;
    }

    /**
     * Format percentage.
     */
    public static function formatPercentage(float $value, int $decimals = 2): string
    {
        return number_format($value, $decimals) . '%';
    }

    /**
     * Format file size.
     */
    public static function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Convert Arabic numbers to English.
     */
    public static function arabicToEnglish(string $string): string
    {
        $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        return str_replace($arabic, $english, $string);
    }

    /**
     * Convert English numbers to Arabic.
     */
    public static function englishToArabic(string $string): string
    {
        $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

        return str_replace($english, $arabic, $string);
    }

    /**
     * Validate Saudi phone number.
     */
    public static function validateSaudiPhone(string $phone): bool
    {
        $pattern = '/^(05|5)[0-9]{8}$/';
        return preg_match($pattern, $phone) === 1;
    }

    /**
     * Validate Saudi ID number.
     */
    public static function validateSaudiId(string $id): bool
    {
        $pattern = '/^[12][0-9]{9}$/';
        return preg_match($pattern, $id) === 1;
    }

    /**
     * Get age from birth date.
     */
    public static function getAge(string $birthDate): int
    {
        $date = new \DateTime($birthDate);
        $now = new \DateTime();
        $interval = $now->diff($date);

        return $interval->y;
    }

    /**
     * Calculate working days between two dates.
     */
    public static function getWorkingDays(string $startDate, string $endDate): int
    {
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        $workingDays = 0;
        $current = clone $start;

        while ($current <= $end) {
            $dayOfWeek = $current->format('N');
            if ($dayOfWeek < 6) { // Monday to Friday
                $workingDays++;
            }
            $current->add(new \DateInterval('P1D'));
        }

        return $workingDays;
    }

    /**
     * Generate initials from name.
     */
    public static function getInitials(string $name): string
    {
        $words = explode(' ', trim($name));
        $initials = '';

        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper(substr($word, 0, 1));
            }
        }

        return $initials;
    }

    /**
     * Mask sensitive data.
     */
    public static function maskData(string $data, string $type = 'phone'): string
    {
        return match($type) {
            'phone' => substr($data, 0, 3) . '****' . substr($data, -3),
            'email' => substr($data, 0, 2) . '***@' . substr(strrchr($data, '@'), 1),
            'id' => substr($data, 0, 3) . '****' . substr($data, -3),
            default => $data
        };
    }

    /**
     * Check if string contains Arabic text.
     */
    public static function containsArabic(string $text): bool
    {
        return preg_match('/[\x{0600}-\x{06FF}]/u', $text) === 1;
    }

    /**
     * Check if string contains English text.
     */
    public static function containsEnglish(string $text): bool
    {
        return preg_match('/[a-zA-Z]/', $text) === 1;
    }

    /**
     * Get language direction.
     */
    public static function getTextDirection(string $text): string
    {
        if (self::containsArabic($text)) {
            return 'rtl';
        }

        return 'ltr';
    }
}
