<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;

class DatabaseHelper
{
    /**
     * تأكد من وجود الجدول وإضافة الأعمدة الجديدة مع تحديد النوع المناسب
     */
    public static function ensureTableAndColumns(string $table, array $data): void
    {
        if (!Schema::hasTable($table)) {
            Schema::create($table, function (Blueprint $tableDef) use ($data) {
                $tableDef->id();
                $tableDef->bigInteger('company_id')->nullable();

                foreach ($data as $field => $value) {
                    if ($field != 'id') {
                        if (is_array($value) || is_object($value)) {
                            $tableDef->json($field)->nullable();
                        } else {
                            $tableDef->string($field)->nullable();
                        }
                    }
                }

                $tableDef->timestamps();
            });
        } else {
            Schema::table($table, function (Blueprint $tableDef) use ($data, $table) {
                foreach ($data as $field => $value) {
                    if (!Schema::hasColumn($table, $field)) {
                        if ($field != 'id') {
                            if (is_array($value) || is_object($value)) {
                                $tableDef->json($field)->nullable();
                            } else {
                                $tableDef->string($field)->nullable();
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * معالجة البيانات قبل الحفظ - تحويل المصفوفات إلى JSON
     */
    public static function processDataForStorage(array $data): array
    {
        $processedData = [];

        foreach ($data as $field => $value) {
            if (is_array($value) || is_object($value)) {
                $processedData[$field] = json_encode($value);
            } else {
                if ($field === 'password') {
                    $processedData[$field] = Hash::make($value);
                } else {
                    $processedData[$field] = $value;
                }
            }
        }

        return $processedData;
    }
}
