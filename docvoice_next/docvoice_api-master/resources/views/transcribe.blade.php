@extends('layouts.app')

@section('title', 'نسخ ملف صوتي')

@push('styles')
<style>
    .card {
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        margin-bottom: 1.5rem;
    }
    .card-header {
        font-weight: 600;
    }
    #progress-container {
        display: none;
    }
    #result-container {
        display: none;
    }
    #login-section, #upload-section {
        transition: all 0.3s;
    }
    .token-info {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 0.375rem;
        padding: 0.75rem;
        font-size: 0.875rem;
        word-break: break-all;
    }
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    .status-processing {
        background: #fef3c7;
        color: #92400e;
    }
    .status-succeeded {
        background: #d1fae5;
        color: #065f46;
    }
    .status-failed {
        background: #fce4ec;
        color: #c62828;
    }
    #transcript-text {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        padding: 1rem;
        white-space: pre-wrap;
        max-height: 400px;
        overflow-y: auto;
    }
</style>
@endpush

@section('content')
<div class="row justify-content-center">
    <div class="col-md-8 col-lg-6">

        {{-- Login Section --}}
        <div id="login-section">
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h4 class="mb-0">تسجيل الدخول</h4>
                </div>
                <div class="card-body">
                    <div id="login-error" class="alert alert-danger d-none"></div>
                    <form id="login-form">
                        <div class="mb-3">
                            <label for="email" class="form-label">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="email" name="email" required
                                   placeholder="example@domain.com">
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">كلمة المرور</label>
                            <input type="password" class="form-control" id="password" name="password" required
                                   placeholder="••••••••">
                        </div>
                        <button type="submit" class="btn btn-primary w-100" id="login-btn">
                            <span id="login-btn-text">تسجيل الدخول</span>
                            <span id="login-btn-spinner" class="spinner-border spinner-border-sm d-none" role="status"></span>
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {{-- Upload Section --}}
        <div id="upload-section" class="d-none">
            <div class="card">
                <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                    <h4 class="mb-0">نسخ ملف صوتي</h4>
                    <button class="btn btn-sm btn-light" id="logout-btn">تسجيل خروج</button>
                </div>
                <div class="card-body">
                    <div id="token-display" class="token-info mb-3 d-none">
                        <strong>Token:</strong> <span id="token-value"></span>
                    </div>

                    <form id="upload-form">
                        <div class="mb-3">
                            <label for="audio-file" class="form-label">الملف الصوتي</label>
                            <input type="file" class="form-control" id="audio-file" name="file"
                                   accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.webm" required>
                            <div class="form-text">الحد الأقصى 25 ميغابايت. الصيغ المدعومة: MP3, WAV, OGG, FLAC, M4A, WEBM</div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="language" class="form-label">اللغة</label>
                                <select class="form-select" id="language" name="language">
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                    <option value="fr">Français</option>
                                    <option value="es">Español</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label for="model-type" class="form-label">نموذج النسخ</label>
                                <select class="form-select" id="model-type" name="model_type">
                                    <option value="WHISPER_LARGE_V3T">Whisper Large V3 Turbo</option>
                                    <option value="WHISPER_LARGE_V3">Whisper Large V3</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-success w-100" id="upload-btn">
                            <span id="upload-btn-text">رفع الملف وبدء النسخ</span>
                            <span id="upload-btn-spinner" class="spinner-border spinner-border-sm d-none" role="status"></span>
                        </button>
                    </form>

                    {{-- Progress --}}
                    <div id="progress-container" class="mt-3">
                        <div class="progress" style="height: 8px;">
                            <div id="upload-progress" class="progress-bar progress-bar-striped progress-bar-animated"
                                 role="progressbar" style="width: 0%"></div>
                        </div>
                        <p class="text-muted mt-1 mb-0" id="progress-text">جاري الرفع...</p>
                    </div>
                </div>
            </div>

            {{-- Result Card --}}
            <div id="result-container">
                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">نتيجة النسخ</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>معرف المهمة:</strong>
                            <span id="job-id" class="ms-2"></span>
                            <button class="btn btn-sm btn-outline-primary ms-2" id="check-status-btn" onclick="checkStatus()">
                                التحقق من الحالة
                            </button>
                        </div>
                        <div class="mb-3">
                            <strong>الحالة:</strong>
                            <span id="job-status" class="status-badge ms-2">—</span>
                        </div>
                        <div>
                            <strong>النص المنسوخ:</strong>
                            <div id="transcript-text" class="mt-2">—</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>
@endsection

@push('scripts')
<script>
let authToken = localStorage.getItem('auth_token');

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.remove('d-none');
}

function hideError(elementId) {
    document.getElementById(elementId).classList.add('d-none');
}

// Check if already logged in
if (authToken) {
    document.getElementById('login-section').classList.add('d-none');
    document.getElementById('upload-section').classList.remove('d-none');
}

// Login form
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('login-error');

    const btn = document.getElementById('login-btn');
    const btnText = document.getElementById('login-btn-text');
    const spinner = document.getElementById('login-btn-spinner');

    btn.disabled = true;
    btnText.classList.add('d-none');
    spinner.classList.remove('d-none');

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                device_name: 'web-transcribe'
            })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'فشل تسجيل الدخول');
        }

        authToken = data.token;
        localStorage.setItem('auth_token', authToken);

        document.getElementById('login-section').classList.add('d-none');
        document.getElementById('upload-section').classList.remove('d-none');

    } catch (err) {
        showError('login-error', err.message);
    } finally {
        btn.disabled = false;
        btnText.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', function() {
    authToken = null;
    localStorage.removeItem('auth_token');
    document.getElementById('upload-section').classList.add('d-none');
    document.getElementById('login-section').classList.remove('d-none');
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('upload-form').reset();
});

// Upload form
document.getElementById('upload-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('login-error');

    const fileInput = document.getElementById('audio-file');
    if (!fileInput.files.length) return;

    const btn = document.getElementById('upload-btn');
    const btnText = document.getElementById('upload-btn-text');
    const spinner = document.getElementById('upload-btn-spinner');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('upload-progress');
    const progressText = document.getElementById('progress-text');

    btn.disabled = true;
    btnText.classList.add('d-none');
    spinner.classList.remove('d-none');
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'جاري رفع الملف...';

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('language', document.getElementById('language').value);
    formData.append('model_type', document.getElementById('model-type').value);

    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = pct + '%';
                progressBar.textContent = pct + '%';
                progressText.textContent = 'جاري الرفع... ' + pct + '%';
            }
        });

        const result = await new Promise((resolve, reject) => {
            xhr.addEventListener('load', function() {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch {
                    reject(new Error('فشل تحليل الاستجابة'));
                }
            });
            xhr.addEventListener('error', function() {
                reject(new Error('فشل الاتصال بالخادم'));
            });
            xhr.addEventListener('abort', function() {
                reject(new Error('تم إلغاء الطلب'));
            });

            xhr.open('POST', '/api/audio/transcribe-oracle');
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
            xhr.send(formData);
        });

        progressBar.classList.remove('progress-bar-animated');
        progressBar.style.width = '100%';
        progressText.textContent = 'تم الرفع بنجاح';

        if (result.success) {
            document.getElementById('job-id').textContent = result.job_id;
            document.getElementById('job-status').textContent = 'processing';
            document.getElementById('job-status').className = 'status-badge status-processing';
            document.getElementById('transcript-text').textContent = '—';
            document.getElementById('result-container').style.display = 'block';

            // Auto-check after 5 seconds
            setTimeout(checkStatus, 5000);
        } else {
            throw new Error(result.message || 'فشل إنشاء مهمة النسخ');
        }

    } catch (err) {
        showError('login-error', err.message);
        progressBar.classList.add('bg-danger');
        progressText.textContent = 'فشل الرفع: ' + err.message;
    } finally {
        btn.disabled = false;
        btnText.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
});

// Check transcription status
async function checkStatus() {
    const jobId = document.getElementById('job-id').textContent;
    if (!jobId || jobId === '—') return;

    const statusBtn = document.getElementById('check-status-btn');
    const statusEl = document.getElementById('job-status');
    const transcriptEl = document.getElementById('transcript-text');

    statusBtn.disabled = true;
    statusBtn.textContent = 'جاري التحقق...';

    try {
        const res = await fetch('/api/audio/transcription-status/' + encodeURIComponent(jobId), {
            headers: {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + authToken
            }
        });

        const data = await res.json();

        if (data.success) {
            const state = data.job_status || 'processing';
            statusEl.textContent = state;

            if (state === 'succeeded') {
                statusEl.className = 'status-badge status-succeeded';
                transcriptEl.textContent = data.transcript || '—';
            } else if (state === 'failed') {
                statusEl.className = 'status-badge status-failed';
                transcriptEl.textContent = data.error || 'فشلت المهمة';
            } else {
                statusEl.className = 'status-badge status-processing';
                setTimeout(checkStatus, 10000);
            }
        } else {
            statusEl.textContent = 'خطأ في التحقق';
            statusEl.className = 'status-badge status-failed';
        }
    } catch (err) {
        statusEl.textContent = 'فشل الاتصال';
        statusEl.className = 'status-badge status-failed';
    } finally {
        statusBtn.disabled = false;
        statusBtn.textContent = 'التحقق من الحالة';
    }
}
</script>
@endpush
