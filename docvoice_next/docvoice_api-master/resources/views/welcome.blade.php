@extends('layouts.app')

@section('title', 'الرئيسية')

@push('styles')
    <style>
        .welcome-card {
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            margin: 2rem auto;
            max-width: 800px;
        }
        .welcome-title {
            color: #1a56db;
            margin-bottom: 1.5rem;
            font-weight: 600;
            text-align: center;
        }
        .welcome-text {
            color: #4b5563;
            line-height: 1.7;
            margin-bottom: 2rem;
            text-align: center;
        }
        .btn-container {
            display: flex;
            justify-content: center;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .btn {
            padding: 0.5rem 1.5rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s;
            text-decoration: none;
        }
        .btn-primary {
            background-color: #1a56db;
            color: white;
            border: 1px solid #1a56db;
        }
        .btn-primary:hover {
            background-color: #1e40af;
            border-color: #1e40af;
        }
        .btn-outline-primary {
            background-color: white;
            color: #1a56db;
            border: 1px solid #1a56db;
        }
        .btn-outline-primary:hover {
            background-color: #f3f4f6;
        }
    </style>
@endpush

@section('content')
    <div class="welcome-card">
        <h1 class="welcome-title">مرحباً بك في نظام إدارة قاعدة البيانات</h1>
        <p class="welcome-text">
            يمكنك استخدام هذا النظام لاستيراد ملفات الإكسل وإدارتها بسهولة. اختر أحد الخيارات التالية للبدء:
        </p>
        <div class="btn-container">
            <a href="{{ route('excel.import.form') }}" class="btn btn-primary">
                استيراد ملف إكسل
            </a>
            <a href="{{ route('excel.import.multi-sheet.form') }}" class="btn btn-outline-primary">
                استيراد ملف متعدد الأوراق
            </a>
        </div>
    </div>
@endsection
         @if (Route::has('login'))
            <div class="h-14.5 hidden lg:block"></div>
        @endif
    </body>
</html>
