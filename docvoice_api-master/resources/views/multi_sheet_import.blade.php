@extends('layouts.app')

@section('title', 'استيراد ملف إكسل متعدد الأوراق')

@push('styles')
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
    <style>
        .select2-container--default .select2-selection--single {
            height: 38px;
            padding: 5px 10px;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
        }
        .select2-container--default .select2-selection--single .select2-selection__arrow {
            height: 36px;
        }
        .select2-container--default .select2-selection--single .select2-selection__rendered {
            line-height: 26px;
        }
        .select2-container--default .select2-dropdown {
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
        }
        .select2-container--default .select2-results__option--highlighted[aria-selected] {
            background-color: #0d6efd;
        }
    </style>
@endpush

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-10">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">استيراد ملف إكسل متعدد الأوراق</h4>
                </div>
                <div class="card-body">
                    @if(session('success'))
                        <div class="alert alert-success">{{ session('success') }}</div>
                    @endif

                    @if($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form id="multiSheetForm" action="{{ route('excel.import.multi-sheet') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        
                        <div class="form-group mb-3">
                            <label for="table_name">اسم الجدول الأساسي:</label>
                            <input type="text" name="table_name" id="table_name" class="form-control" required>
                            <small class="form-text text-muted">سيتم إضافة أسماء الجداول الفرعية تلقائياً</small>
                        </div>

                        <div class="form-group mb-3">
                            <label for="excel_file">ملف الإكسل:</label>
                            <input type="file" name="excel_file" id="excel_file" class="form-control-file" accept=".xlsx,.xls" required>
                        </div>

                        <div id="sheetPreview" class="mt-4 d-none">
                            <h5>معاينة الجداول:</h5>
                            <div class="table-responsive">
                                <table class="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>اسم الجدول</th>
                                            <th>عدد الأعمدة</th>
                                            <th>عدد الصفوف</th>
                                            <th>الأعمدة</th>
                                        </tr>
                                    </thead>
                                    <tbody id="sheetsList">
                                        <!-- Sheets will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary mt-3">استيراد البيانات</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script>
        $(document).ready(function() {
            $('.select2').select2({
                dir: 'rtl',
                width: '100%'
            });

            document.getElementById('excel_file').addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const formData = new FormData();
                formData.append('excel_file', file);
                
                // Show loading
                const previewDiv = document.getElementById('sheetPreview');
                previewDiv.classList.add('d-none');
                
                // Send file to backend for processing
                fetch('{{ route("excel.preview-sheets") }}', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    },
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const sheetsList = document.getElementById('sheetsList');
                        sheetsList.innerHTML = '';
                        
                        Object.entries(data.sheets).forEach(([sheetName, sheetData]) => {
                            const row = document.createElement('tr');
                            row.innerHTML = `
                                <td>${sheetName}</td>
                                <td>${sheetData.headers.length}</td>
                                <td>${sheetData.row_count}</td>
                                <td>${sheetData.headers.join(', ')}</td>
                            `;
                            sheetsList.appendChild(row);
                        });
                        
                        previewDiv.classList.remove('d-none');
                    } else {
                        alert('حدث خطأ أثناء معالجة الملف: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('حدث خطأ أثناء معالجة الملف');
                });
            });
        });
    </script>
@endpush
