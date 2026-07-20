<?php

namespace App\Http\Controllers;

use App\Imports\DynamicImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Database\Eloquent\Relations\Relation;
use Rap2hpoutre\FastExcel\FastExcel;
use OpenSpout\Common\Entity\Style\Border;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\Common\Creator\Style\BorderBuilder;
use OpenSpout\Writer\Common\Creator\Style\StyleBuilder;

class ExcelImportController extends Controller
{
    /**
     * Show the import form.
     *
     * @return \Illuminate\View\View
     */
    public function showImportForm(): View
    {
        return view('excel_import');
    }

    /**
     * Show the multi-sheet import form.
     *
     * @return \Illuminate\View\View
     */
    public function showMultiSheetImport(): View
    {
        return view('multi_sheet_import');
    }

    /**
     * Import data from Excel file.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'table_name' => 'required|string|max:255',
            'excel_file' => 'required|file|mimes:xlsx,xls'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $tableName = Str::snake($request->input('table_name'));
        /** @var UploadedFile $file */
        $file = $request->file('excel_file');

        try {
            // Ensure the uploaded file is valid
            if (!$file->isValid()) {
                return redirect()->back()->withErrors(['excel_file' => 'الملف المرفوع غير صالح']);
            }

            // Read the Excel file using FastExcel
            $rows = (new FastExcel)->import($file->getPathname())->toArray();

            if (count($rows) === 0) {
                return redirect()->back()->withErrors(['excel_file' => 'ملف الإكسل فارغ']);
            }

            // Get the first row as headers
            $firstRow = reset($rows);
            $originalHeaders = array_keys($firstRow);
            $headers = [];
            $columnIndex = 1;

            // Log all original headers
            Log::info('=== START COLUMN PROCESSING ===');
            Log::info('Original Headers Count: ' . count($originalHeaders));
            Log::info('Original Headers:', $originalHeaders);

            // Process each header to create valid column names
            foreach ($originalHeaders as $index => $originalHeader) {
                $header = trim($originalHeader);

                // Log header processing details
                Log::info(sprintf(
                    'Processing header [%d]: Original: "%s"',
                    $index + 1,
                    $header
                ));

                // Translate Arabic to English using transliteration
                $header = $this->transliterateArabicToEnglish($header);

                // If header is empty after processing, use a default name
                if (empty($header)) {
                    $header = 'column_' . $columnIndex;
                }

                // Ensure the header is a valid column name
                $header = preg_replace('/[^a-zA-Z0-9_]/', '_', $header);
                $header = Str::snake($header);

                // Ensure the header is not empty after processing
                if (empty($header)) {
                    $header = 'column_' . $columnIndex;
                }

                // Ensure the header is unique
                $baseHeader = $header;
                $counter = 1;
                while (in_array($header, $headers)) {
                    $header = $baseHeader . '_' . $counter;
                    $counter++;
                }
                $headers[] = $header;

                // Log the final header mapping
                Log::info(sprintf(
                    'Header [%d] Mapped: "%s" => "%s"',
                    $index + 1,
                    $originalHeader,
                    $header
                ));

                $columnIndex++;
            }

            // Log final header information
            Log::info('=== FINAL COLUMN MAPPING ===');
            foreach ($headers as $index => $header) {
                Log::info(sprintf(
                    'Column [%d]: "%s" => "%s"',
                    $index + 1,
                    $originalHeaders[$index] ?? 'N/A',
                    $header
                ));
            }
            Log::info('Total columns processed: ' . count($headers));

            // Create or update table with the cleaned headers
            $this->createOrUpdateTable($tableName, $headers);

            // Prepare data for insertion with timestamps
            $data = [];

            foreach ($rows as $rowIndex => $row) {
                $rowData = [];

                // Map each column using the original headers
                foreach ($originalHeaders as $colIndex => $originalKey) {
                    $header = $headers[$colIndex] ?? 'column_' . ($colIndex + 1);
                    $originalValue = $row[$originalKey] ?? null;

                    // Clean up the header to match the database column names
                    $cleanHeader = $this->cleanColumnName($header);

                    // Log the mapping for debugging
                    if ($rowIndex === 0) { // Only log for first row to avoid log spam
                        Log::info("Mapping '{$originalKey}' to '{$cleanHeader}'");
                    }

                    $rowData[$cleanHeader] = $originalValue;
                }
                $rowData['created_at'] = now();
                $rowData['updated_at'] = now();
                $data[] = $rowData;
            }

            // Insert data in chunks to avoid memory issues
            if (!empty($data)) {
                try {
                    // Insert data in chunks of 1000 to avoid memory issues
                    $chunks = array_chunk($data, 1000);

                    foreach ($chunks as $chunkIndex => $chunk) {
                        DB::table($tableName)->insert($chunk);
                        Log::info('Inserted chunk ' . ($chunkIndex + 1) . ' with ' . count($chunk) . ' rows');
                    }

                    Log::info('Successfully inserted all data into table: ' . $tableName);

                } catch (\Exception $e) {
                    Log::error('Error inserting data into table ' . $tableName . ': ' . $e->getMessage());
                    Log::error('Stack trace: ' . $e->getTraceAsString());
                    Log::error('Data sample: ' . json_encode(array_slice($data, 0, 2)));
                    Log::error('Total rows to insert: ' . count($data));
                    Log::error('Chunk size: 1000');
                    Log::error('Error details: ' . $e->getMessage());
                    Log::error('This error typically occurs when data structure does not match table schema.');
                    Log::error('Please check that all required columns exist and data types are compatible.');
                    Log::error('Ensure that the table was created successfully before attempting to insert data.');
                    Log::error('The error suggests there may be a mismatch between the data structure and table columns.');
                    throw $e;
                }
            }

            return redirect()->back()->with('success', 'تم استيراد البيانات بنجاح');

        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return redirect()->back()
                ->withErrors(['excel_file' => 'حدث خطأ: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Transliterate Arabic text to English
     *
     * @param string $text
     * @return string
     */
    private function transliterateArabicToEnglish($text) {
        if (empty($text)) {
            return 'column';
        }

        // Common Arabic characters and their transliterations
        $transliteration = [
            // Arabic letters
            'ء' => 'a', 'آ' => 'a', 'أ' => 'a', 'إ' => 'e', 'ا' => 'a', 'ب' => 'b', 'ت' => 't', 'ث' => 'th',
            'ج' => 'j', 'ح' => 'h', 'خ' => 'kh', 'د' => 'd', 'ذ' => 'th', 'ر' => 'r', 'ز' => 'z', 'س' => 's',
            'ش' => 'sh', 'ص' => 's', 'ض' => 'd', 'ط' => 't', 'ظ' => 'z', 'ع' => 'a', 'غ' => 'gh', 'ف' => 'f',
            'ق' => 'q', 'ك' => 'k', 'ل' => 'l', 'م' => 'm', 'ن' => 'n', 'ه' => 'h', 'و' => 'w', 'ي' => 'y',
            'ى' => 'a', 'ة' => 'h', 'ئ' => 'e', 'ؤ' => 'o', ' ' => '_',

            // Common Arabic words and their translations
            'ال' => 'al_', 'وال' => 'wal_', 'في' => 'in_', 'على' => 'on_', 'من' => 'from_',
            'الى' => 'to_', 'عن' => 'about_', 'مع' => 'with_', 'حتى' => 'until_',
            'او' => 'or_', 'و' => 'and_', 'لكن' => 'but_', 'اذا' => 'if_',
            'ثم' => 'then_', 'لان' => 'because_', 'لذا' => 'so_',

            // Common suffixes and prefixes
            'ة' => 'a', 'ه' => 'h', 'ي' => 'y', 'ك' => 'k', 'ت' => 't', 'ن' => 'n',
        ];

        // Convert Arabic text to transliterated text
        $text = strtr($text, $transliteration);

        // Remove any remaining non-ASCII characters and normalize
        $text = preg_replace('/[^\x20-\x7E]/u', '', $text);
        $text = preg_replace('/[^a-zA-Z0-9_]/', '_', $text);
        $text = preg_replace('/_+/', '_', $text);
        $text = trim($text, '_');

        // Ensure the result is not empty
        if (empty($text)) {
            $text = 'column';
        }

        // Ensure the result is not too long
        if (strlen($text) > 64) {
            $text = substr($text, 0, 64);
        }

        // Ensure the result starts with a letter or underscore
        if (!preg_match('/^[a-zA-Z_]/', $text)) {
            $text = 'col_' . $text;
        }

        // Ensure the result is not empty after all processing
        if (empty($text)) {
            $text = 'column';
        }

        // Log the transliteration result for debugging
        Log::info('Transliterated: "' . $text . '" (original: "' . $text . '")');

        return $text;
    }

    /**
     * Preview sheets in the uploaded Excel file
     */
    /**
     * Preview sheets in the uploaded Excel file
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function previewSheets(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls'
        ]);

        $file = $request->file('excel_file');

        try {
            $sheets = [];

            // Get all sheet names
            $sheetNames = (new FastExcel)->importSheets($file->getPathname())->getSheetNames();

            foreach ($sheetNames as $sheetIndex => $sheetName) {
                // Read only the first row of each sheet to get headers
                $rows = (new FastExcel)
                    ->sheet($sheetIndex + 1) // Sheets are 1-indexed
                    ->import($file->getPathname())
                    ->take(1)
                    ->toArray();

                if (empty($rows)) {
                    continue;
                }

                // Get headers from first row
                $headers = [];
                $firstRow = reset($rows);

                foreach ($firstRow as $index => $header) {
                    $headers[] = $header;
                }

                // Save headers for this sheet
                $sheets[$sheetName] = [
                    'headers' => $headers,
                    'row_count' => count($rows) - 1 // Subtract 1 for header row
                ];
            }

            return response()->json([
                'success' => true,
                'sheets' => $sheets
            ]);

        } catch (\Exception $e) {
            Log::error('Error previewing sheets: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معاينة الملف: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process multi-sheet Excel file import
     */
    /**
     * Process multi-sheet Excel file import
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function importMultiSheet(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls',
            'table_name' => 'required|string|alpha_dash|max:100'
        ]);

        $file = $request->file('excel_file');
        $tableName = Str::snake($request->table_name);

        try {
            // Create directory for JSON files if not exists
            $jsonDir = storage_path('app/excel_schemas');
            if (!file_exists($jsonDir)) {
                mkdir($jsonDir, 0777, true);
            }

            $jsonFile = $jsonDir . '/' . $tableName . '_schema.json';
            $schema = [];

            // Get all sheet names
            $sheetNames = (new FastExcel)->importSheets($file->getPathname())->getSheetNames();

            // Process each sheet
            foreach ($sheetNames as $sheetIndex => $sheetName) {
                // Read only the first row of each sheet to get headers
                $rows = (new FastExcel)
                    ->sheet($sheetIndex + 1) // Sheets are 1-indexed
                    ->import($file->getPathname())
                    ->take(1)
                    ->toArray();

                if (empty($rows)) {
                    continue;
                }

                // Get headers from first row
                $headers = [];
                $firstRow = reset($rows);

                foreach ($firstRow as $index => $header) {
                    $header = trim($header);
                    $header = $this->transliterateArabicToEnglish($header);
                    $header = preg_replace('/[^a-zA-Z0-9_]/', '_', $header);
                    $header = preg_replace('/_+/', '_', $header); // Replace multiple underscores with single one
                    $header = trim($header, '_'); // Remove any leading/trailing underscores
                    $header = Str::snake($header);
                    $header = preg_replace('/_+/', '_', $header); // Ensure no consecutive underscores after snake_case

                    if (empty($header)) {
                        $header = 'column_' . ($index + 1);
                    }

                    // Make header unique within this sheet
                    $originalHeader = $header;
                    $counter = 1;
                    while (in_array($header, $headers)) {
                        $header = $originalHeader . '_' . $counter;
                        $counter++;
                    }

                    $headers[] = $header;
                }

                // Get total row count (including header)
                $rowCount = (new FastExcel)
                    ->sheet($sheetIndex + 1)
                    ->import($file->getPathname())
                    ->count();

                // Save sheet data to schema
                $schema[$sheetName] = [
                    'table_name' => $tableName . '_' . Str::slug($sheetName, '_'),
                    'headers' => $headers,
                    'row_count' => $rowCount - 1 // Exclude header row
                ];

                // Log the sheet processing
                Log::info("Processed sheet: " . $sheetName);
                Log::info("Headers: " . implode(', ', $headers));
            }

            // Save schema to JSON file
            try {
                file_put_contents($jsonFile, json_encode($schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                Log::info('Schema saved to file: ' . $jsonFile);
            } catch (\Exception $e) {
                Log::error('Error saving schema to file: ' . $e->getMessage());
                Log::error('Stack trace: ' . $e->getTraceAsString());
                Log::error('Schema content: ' . json_encode($schema));
                Log::error('File path: ' . $jsonFile);
                Log::error('Schema size: ' . count($schema) . ' sheets');
                Log::error('Error details: ' . $e->getMessage());
                Log::error('This error typically occurs when there are permission issues or disk space problems.');
                Log::error('Please check file permissions and available disk space.');
                Log::error('Ensure the storage directory is writable by the web server.');
                Log::error('The error suggests there may be a file system or permission issue.');
                throw $e;
            }

            return response()->json([
                'success' => true,
                'message' => 'تم معالجة الملف بنجاح',
                'schema_file' => $jsonFile,
                'sheets' => $schema
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing multi-sheet Excel: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء معالجة الملف: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import data from a specific sheet
     */
    /**
     * Import data from a specific sheet
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $sheetName
     * @return \Illuminate\Http\JsonResponse
     */
    public function importSheetData(Request $request, $sheetName)
    {
        $request->validate([
            'table_name' => 'required|string|alpha_dash|max:100',
            'mapping' => 'required|array'
        ]);

        $jsonFile = storage_path('app/excel_schemas/' . $request->table_name . '_schema.json');

        if (!file_exists($jsonFile)) {
            return response()->json([
                'success' => false,
                'error' => 'Schema file not found'
            ], 404);
        }

        try {
            $schema = json_decode(file_get_contents($jsonFile), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Error decoding JSON schema file: ' . json_last_error_msg());
                Log::error('Stack trace: ' . (new \Exception())->getTraceAsString());
                Log::error('File content preview: ' . substr(file_get_contents($jsonFile), 0, 500));
                Log::error('File size: ' . filesize($jsonFile) . ' bytes');
                Log::error('Sheet name requested: ' . $sheetName);
                Log::error('Error details: ' . json_last_error_msg());
                Log::error('This error typically occurs when the JSON file is corrupted or contains invalid syntax.');
                Log::error('Please check the JSON file format and ensure it is valid.');
                Log::error('You may need to regenerate the schema file using the multi-sheet import function.');
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid schema file format'
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Error reading schema file: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            Log::error('File path: ' . $jsonFile);
            Log::error('File exists: ' . (file_exists($jsonFile) ? 'Yes' : 'No'));
            Log::error('Sheet name requested: ' . $sheetName);
            Log::error('Error details: ' . $e->getMessage());
            Log::error('This error typically occurs when the file cannot be read or does not exist.');
            Log::error('Please check that the schema file exists and is readable.');
            Log::error('You may need to regenerate the schema file using the multi-sheet import function.');
            return response()->json([
                'success' => false,
                'error' => 'Error reading schema file'
            ], 500);
        }

        if (!isset($schema[$sheetName])) {
            return response()->json([
                'success' => false,
                'error' => 'Sheet not found in schema'
            ], 404);
        }

        // TODO: Implement the actual data import logic here
        // This would be similar to your existing import method but using the provided mapping

        return response()->json([
            'success' => true,
            'message' => 'سيتم استيراد البيانات من ' . $sheetName,
            'schema' => $schema[$sheetName],
            'mapping' => $request->mapping
        ]);
    }

    /**
     * Clean column name by converting to snake_case and removing duplicate/leading/trailing underscores
     *
     * @param string $name
     * @return string
     */
    private function cleanColumnName($name)
    {
        if (empty($name)) {
            return '';
        }

        // Convert to snake_case
        $name = Str::snake(trim($name));

        // Replace multiple underscores with single one and remove leading/trailing underscores
        $name = preg_replace('/_+/', '_', $name);
        $name = trim($name, '_');

        // If empty after cleaning, generate a default column name
        if (empty($name)) {
            $name = 'column_' . uniqid();
        }

        // Ensure the name is not too long for database
        if (strlen($name) > 64) {
            $name = substr($name, 0, 64);
        }

        // Ensure the name starts with a letter or underscore
        if (!preg_match('/^[a-zA-Z_]/', $name)) {
            $name = 'col_' . $name;
        }

        // Ensure the name is not a reserved SQL keyword
        $reservedKeywords = ['order', 'group', 'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'table', 'database', 'index', 'view', 'trigger', 'procedure', 'function'];
        if (in_array(strtolower($name), $reservedKeywords)) {
            $name = 'col_' . $name;
        }

        // Ensure the name is not empty after all processing
        if (empty($name)) {
            $name = 'column_' . uniqid();
        }

        // Log the final column name for debugging
        Log::info('Column name cleaned: "' . $name . '" (original: "' . $name . '")');

        return $name;
    }

    /**
     * Create or update table with the given headers
     *
     * @param string $tableName
     * @param array $headers
     * @return void
     */
    private function createOrUpdateTable($tableName, $headers): void
    {
        try {
            if (!Schema::hasTable($tableName)) {
                // Create new table
                Log::info('Creating new table: ' . $tableName);

                Schema::create($tableName, function (Blueprint $table) use ($headers) {
                    $table->id();
                    $this->addColumnsToTable($table, $headers);
                    $table->timestamps();
                    $table->softDeletes();
                });

                Log::info('Successfully created table: ' . $tableName);

            } else {
                // Update existing table - add only missing columns
                Log::info('Updating existing table: ' . $tableName);

                $existingColumns = Schema::getColumnListing($tableName);
                $missingColumns = array_diff($headers, $existingColumns);

                if (!empty($missingColumns)) {
                    Log::info('Adding missing columns: ' . implode(', ', $missingColumns));

                    Schema::table($tableName, function (Blueprint $table) use ($missingColumns) {
                        $this->addColumnsToTable($table, $missingColumns);
                    });

                    Log::info('Successfully updated table: ' . $tableName);
                } else {
                    Log::info('No new columns to add to table: ' . $tableName);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error creating/updating table ' . $tableName . ': ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            // Try to provide more specific error information
            if (strpos($e->getMessage(), 'SQLSTATE[42000]') !== false) {
                Log::error('SQL Syntax Error detected. This might be due to invalid column names.');
                Log::error('Headers being processed: ' . implode(', ', $headers));
                Log::error('Table name: ' . $tableName);
                Log::error('Total headers: ' . count($headers));
                Log::error('Error details: ' . $e->getMessage());
                Log::error('This error typically occurs when column names contain invalid characters or are too long.');
                Log::error('Please check the column names and ensure they are valid SQL identifiers.');
                Log::error('Column names must start with a letter or underscore and contain only alphanumeric characters.');
                Log::error('The error suggests there may be duplicate column names or invalid SQL syntax.');
            }

            throw $e;
        }
    }

    /**
     * Add columns to the table if they don't exist
     *
     * @param Blueprint $table
     * @param array $headers
     * @return void
     */
    private function addColumnsToTable(Blueprint $table, array $headers): void
    {
        foreach ($headers as $header) {
            // Skip if it's the ID column we just added
            if (strtolower($header) === 'id') continue;

            // Clean and validate the column name
            $columnName = $this->cleanColumnName($header);

            if (empty($columnName)) {
                continue; // Skip empty column names
            }

            try {
                // Add the new column without 'after' clause
                $table->string($columnName)->nullable();

                // Log successful column addition
                Log::info('Successfully added column: ' . $columnName);

            } catch (\Exception $e) {
                // Log the error but continue with other columns
                Log::warning('Failed to add column ' . $columnName . ': ' . $e->getMessage());

                // Try to add with a different name
                try {
                    $fallbackName = 'col_' . uniqid();
                    $table->string($fallbackName)->nullable();
                    Log::info('Added fallback column: ' . $fallbackName);
                } catch (\Exception $fallbackError) {
                    Log::error('Failed to add fallback column: ' . $fallbackError->getMessage());
                }

                continue;
            }
        }
    }
}
