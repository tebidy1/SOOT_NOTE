<?php

namespace App\Services;

class TextExtractionService
{
    public function extractFields(string $text): array
    {
        return [
            'name' => $this->extractName($text),
            'age' => $this->extractAge($text),
            'height' => $this->extractHeight($text),
            'gender' => $this->extractGender($text),
        ];
    }

    private function extractName(string $text): ?string
    {
        $patterns = [
            '/(?:المريض|المريضة|السيد|السيدة|آنسة|مريض|مريضة)\s*[:\-]?\s*([^\n,;.،]{2,50})/ui',
            '/(?:patient(?:\s+name)?|name)\s*[:\-]?\s*([^\n,;.]{2,50})/ui',
            '/(?:الاسم|اسم)\s*[:\-]?\s*([^\n,;.،]{2,50})/ui',
            '/(?:mr\.|mrs\.|ms\.|miss)\s+([a-z\s]{2,50})/ui',
            '/(?:سيد|سيدة|آنسة)\s+([^\n,;.،]{2,50})/ui',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $name = trim($matches[1]);
                if ($this->isValidName($name)) {
                    return $name;
                }
            }
        }

        return null;
    }

    private function extractAge(string $text): ?int
    {
        $patterns = [
            '/(?:العمر|عمر|عمره|عمرها|سن|سنه|سنها)\s*[:\-]?\s*(\d{1,3})\s*(?:سنة|سنه|عام|سنين)?/ui',
            '/(?:age|age of)\s*[:\-]?\s*(\d{1,3})\s*(?:years?|yrs?|y\/o)?/ui',
            '/(\d{1,3})\s*(?:سنة|سنه|عام|سنين)\s*(?:العمر|عمر)/ui',
            '/(\d{1,3})\s*(?:years?\s*old|y\/o|yo\b)/ui',
            '/(?:العمر|عمر|سن)\s*[:\-]?\s*(\d{1,3})/ui',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $age = (int)$matches[1];
                if ($age > 0 && $age < 150) {
                    return $age;
                }
            }
        }

        return null;
    }

    private function extractHeight(string $text): ?string
    {
        $patterns = [
            '/(?:الطول|طوله|طولها|طول|القامة)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*(?:سم|cm|centimeter)/ui',
            '/(?:height|ht)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)\s*(?:cm|centimeter)/ui',
            '/(\d{1,3}(?:[.,]\d+)?)\s*(?:سم|cm)\s*(?:طول|الطول|القامة|height)/ui',
            '/(?:الطول|طول|height|ht)\s*[:\-]?\s*(\d{1,3}(?:[.,]\d+)?)/ui',
            '/(\d{1,3}(?:[.,]\d+)?)\s*(?:سم|cm)\b/ui',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                $height = trim($matches[1]);
                $heightNum = (float)str_replace(',', '.', $height);
                if ($heightNum >= 30 && $heightNum <= 300) {
                    return $height;
                }
            }
        }

        return null;
    }

    private function extractGender(string $text): ?string
    {
        $malePatterns = [
            '/\b(?:ذكر|ذكور|مذكر|male)\b/ui',
            '/\b(?:السيد|سيد|م\.|mr\.?)\b/ui',
            '/\b(?:الجنس|جنس|gender|sex)\s*[:\-]?\s*(?:ذكر|ذكور|مذكر|male|m)\b/ui',
        ];

        $femalePatterns = [
            '/\b(?:أنثى|إناث|أنثوية|female)\b/ui',
            '/\b(?:السيدة|سيدة|آنسة|mrs\.?|ms\.?|miss)\b/ui',
            '/\b(?:الجنس|جنس|gender|sex)\s*[:\-]?\s*(?:أنثى|إناث|أنثوية|female|f)\b/ui',
        ];

        foreach ($malePatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return 'male';
            }
        }

        foreach ($femalePatterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return 'female';
            }
        }

        if (preg_match('/\b(?:المريض|مريض)\b/u', $text) && !preg_match('/\b(?:المريضة|مريضة)\b/u', $text)) {
            return 'male';
        }

        if (preg_match('/\b(?:المريضة|مريضة)\b/u', $text)) {
            return 'female';
        }

        return null;
    }

    private function isValidName(string $name): bool
    {
        $cleaned = preg_replace('/[\d\+\-\*\/\=\@\#\$\%\^\&\(\)]/', '', $name);
        $cleaned = trim($cleaned);

        if (mb_strlen($cleaned) < 2) {
            return false;
        }

        if (preg_match('/\b(?:سنة|عام|سم|cm|kg|ml|mg|mm|year|month|day|old|age|height|weight)\b/ui', $cleaned)) {
            return false;
        }

        return true;
    }
}
