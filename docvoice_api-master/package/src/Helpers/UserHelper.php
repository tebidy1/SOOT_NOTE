<?php

namespace LaraCore\Helpers;

class UserHelper
{
    /**
     * Get user initials from name
     */
    public function getInitials(string $name): string
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
     * Mask email address
     */
    public function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $username = $parts[0];
        $domain = $parts[1] ?? '';

        if (strlen($username) <= 2) {
            return $email;
        }

        $maskedUsername = substr($username, 0, 1) . str_repeat('*', strlen($username) - 2) . substr($username, -1);

        return $maskedUsername . '@' . $domain;
    }

    /**
     * Mask phone number
     */
    public function maskPhone(string $phone): string
    {
        $length = strlen($phone);
        if ($length <= 4) {
            return $phone;
        }

        return substr($phone, 0, 2) . str_repeat('*', $length - 4) . substr($phone, -2);
    }

    /**
     * Get age from birth date
     */
    public function getAge(string $birthDate): int
    {
        $date = new \DateTime($birthDate);
        $now = new \DateTime();
        $interval = $now->diff($date);

        return $interval->y;
    }

    /**
     * Check if user is adult
     */
    public function isAdult(string $birthDate, int $adultAge = 18): bool
    {
        return $this->getAge($birthDate) >= $adultAge;
    }
}
