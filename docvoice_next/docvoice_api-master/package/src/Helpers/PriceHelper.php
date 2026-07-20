<?php

namespace LaraCore\Helpers;

class PriceHelper
{
    /**
     * Format price with currency
     */
    public function format(float $price, string $currency = 'SAR'): string
    {
        return number_format($price, 2) . ' ' . $currency;
    }

    /**
     * Calculate percentage
     */
    public function percentage(float $value, float $total): float
    {
        if ($total == 0) {
            return 0;
        }

        return round(($value / $total) * 100, 2);
    }

    /**
     * Calculate discount amount
     */
    public function discount(float $originalPrice, float $discountPercentage): float
    {
        return $originalPrice * ($discountPercentage / 100);
    }

    /**
     * Calculate final price after discount
     */
    public function finalPrice(float $originalPrice, float $discountPercentage): float
    {
        return $originalPrice - $this->discount($originalPrice, $discountPercentage);
    }
}
