<?php

namespace LaraCore\Helpers;

class ValidationHelper
{
    /**
     * Validate email format.
     */
    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate URL format.
     */
    public static function isValidUrl(string $url): bool
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Validate IP address.
     */
    public static function isValidIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP) !== false;
    }

    /**
     * Validate date format.
     */
    public static function isValidDate(string $date, string $format = 'Y-m-d'): bool
    {
        $d = \DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }

    /**
     * Validate time format.
     */
    public static function isValidTime(string $time, string $format = 'H:i:s'): bool
    {
        $t = \DateTime::createFromFormat($format, $time);
        return $t && $t->format($format) === $time;
    }

    /**
     * Validate datetime format.
     */
    public static function isValidDateTime(string $datetime, string $format = 'Y-m-d H:i:s'): bool
    {
        $dt = \DateTime::createFromFormat($format, $datetime);
        return $dt && $dt->format($format) === $datetime;
    }

    /**
     * Check if string is numeric.
     */
    public static function isNumeric(string $value): bool
    {
        return is_numeric($value);
    }

    /**
     * Check if string is integer.
     */
    public static function isInteger(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_INT) !== false;
    }

    /**
     * Check if string is float.
     */
    public static function isFloat(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_FLOAT) !== false;
    }

    /**
     * Check if string is boolean.
     */
    public static function isBoolean(string $value): bool
    {
        $value = strtolower($value);
        return in_array($value, ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']);
    }

    /**
     * Validate file extension.
     */
    public static function isValidFileExtension(string $filename, array $allowedExtensions): bool
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return in_array($extension, $allowedExtensions);
    }

    /**
     * Validate file size.
     */
    public static function isValidFileSize(int $fileSize, int $maxSize): bool
    {
        return $fileSize <= $maxSize;
    }

    /**
     * Validate image dimensions.
     */
    public static function isValidImageDimensions(string $imagePath, int $minWidth, int $minHeight): bool
    {
        if (!file_exists($imagePath)) {
            return false;
        }

        $imageInfo = getimagesize($imagePath);
        if (!$imageInfo) {
            return false;
        }

        [$width, $height] = $imageInfo;
        return $width >= $minWidth && $height >= $minHeight;
    }

    /**
     * Validate phone number format.
     */
    public static function isValidPhone(string $phone, string $country = 'SA'): bool
    {
        return match($country) {
            'SA' => CommonHelper::validateSaudiPhone($phone),
            'AE' => preg_match('/^(05|5)[0-9]{8}$/', $phone) === 1,
            'KW' => preg_match('/^(5|6)[0-9]{7}$/', $phone) === 1,
            'BH' => preg_match('/^(3|6|7)[0-9]{7}$/', $phone) === 1,
            'OM' => preg_match('/^(9)[0-9]{8}$/', $phone) === 1,
            'QA' => preg_match('/^(3|5|6|7)[0-9]{7}$/', $phone) === 1,
            default => preg_match('/^[+]?[0-9]{8,15}$/', $phone) === 1
        };
    }

    /**
     * Validate national ID format.
     */
    public static function isValidNationalId(string $id, string $country = 'SA'): bool
    {
        return match($country) {
            'SA' => CommonHelper::validateSaudiId($id),
            'AE' => preg_match('/^[0-9]{15}$/', $id) === 1,
            'KW' => preg_match('/^[0-9]{12}$/', $id) === 1,
            'BH' => preg_match('/^[0-9]{9}$/', $id) === 1,
            'OM' => preg_match('/^[0-9]{8}$/', $id) === 1,
            'QA' => preg_match('/^[0-9]{11}$/', $id) === 1,
            default => preg_match('/^[0-9]{5,20}$/', $id) === 1
        };
    }

    /**
     * Validate credit card number.
     */
    public static function isValidCreditCard(string $number): bool
    {
        // Remove spaces and dashes
        $number = preg_replace('/\s+/', '', $number);
        $number = str_replace('-', '', $number);

        // Check if it's a valid number
        if (!is_numeric($number)) {
            return false;
        }

        // Check length
        if (strlen($number) < 13 || strlen($number) > 19) {
            return false;
        }

        // Luhn algorithm
        $sum = 0;
        $length = strlen($number);
        $parity = $length % 2;

        for ($i = 0; $i < $length; $i++) {
            $digit = $number[$i];
            if ($i % 2 == $parity) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }
            $sum += $digit;
        }

        return $sum % 10 == 0;
    }

    /**
     * Validate IBAN format.
     */
    public static function isValidIban(string $iban): bool
    {
        // Remove spaces
        $iban = str_replace(' ', '', strtoupper($iban));

        // Check length
        if (strlen($iban) < 15 || strlen($iban) > 34) {
            return false;
        }

        // Check format
        if (!preg_match('/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/', $iban)) {
            return false;
        }

        return true;
    }

    /**
     * Validate strong password.
     */
    public static function isStrongPassword(string $password): bool
    {
        // At least 8 characters
        if (strlen($password) < 8) {
            return false;
        }

        // At least one uppercase letter
        if (!preg_match('/[A-Z]/', $password)) {
            return false;
        }

        // At least one lowercase letter
        if (!preg_match('/[a-z]/', $password)) {
            return false;
        }

        // At least one number
        if (!preg_match('/[0-9]/', $password)) {
            return false;
        }

        // At least one special character
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return false;
        }

        return true;
    }

    /**
     * Get password strength score.
     */
    public static function getPasswordStrength(string $password): int
    {
        $score = 0;

        // Length
        if (strlen($password) >= 8) $score += 1;
        if (strlen($password) >= 12) $score += 1;

        // Character types
        if (preg_match('/[A-Z]/', $password)) $score += 1;
        if (preg_match('/[a-z]/', $password)) $score += 1;
        if (preg_match('/[0-9]/', $password)) $score += 1;
        if (preg_match('/[^A-Za-z0-9]/', $password)) $score += 1;

        return $score;
    }

    /**
     * Get password strength text.
     */
    public static function getPasswordStrengthText(string $password): string
    {
        $score = self::getPasswordStrength($password);

        return match($score) {
            0, 1 => 'ضعيف جداً',
            2, 3 => 'ضعيف',
            4, 5 => 'متوسط',
            6, 7 => 'قوي',
            default => 'قوي جداً'
        };
    }
}
