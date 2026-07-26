@extends('layouts.app')

@section('title', 'استيراد ملف إكسل')

@section('content')
    <div class="row justify-content-center">
        <div class="col-md-10">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">استيراد ملف إكسل</h4>
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

                        <form action="{{ route('excel.import') }}" method="POST" enctype="multipart/form-data">
                            @csrf
                            <div class="mb-3">
                                <label for="table_name" class="form-label">اسم الجدول</label>
                                <input type="text" class="form-control" id="table_name" name="table_name" required>
                                <div class="form-text">سيتم إنشاء الجدول إذا لم يكن موجوداً</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="excel_file" class="form-label">ملف الإكسل</label>
                                <input type="file" class="form-control" id="excel_file" name="excel_file" accept=".xlsx,.xls" required>
                            </div>
                            
                            <button type="submit" class="btn btn-primary">استيراد البيانات</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
