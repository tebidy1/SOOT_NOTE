<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DynamicImport implements ToCollection, WithHeadingRow
{
    protected $tableName;
    protected $headers;
    
    public function __construct($tableName, $headers)
    {
        $this->tableName = $tableName;
        $this->headers = $headers;
    }

    public function collection(Collection $rows)
    {
        $insertData = [];
        
        foreach ($rows as $row) {
            $rowData = [];
            foreach ($this->headers as $index => $header) {
                $rowData[Str::snake($header)] = $row[$index] ?? null;
            }
            $rowData['created_at'] = Carbon::now();
            $rowData['updated_at'] = Carbon::now();
            $insertData[] = $rowData;
        }
        
        if (!empty($insertData)) {
            DB::table($this->tableName)->insert($insertData);
        }
    }
}
