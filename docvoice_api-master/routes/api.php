<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Load authentication routes
require __DIR__ . '/auth.php';

// Medical Departments Routes
Route::prefix('medical-departments')->group(function () {
    // Public routes - get all departments
    Route::get('/', [App\Http\Controllers\MedicalDepartmentController::class, 'index']);
    // Get single department
    Route::get('/{departmentId}', [App\Http\Controllers\MedicalDepartmentController::class, 'show']);
    
    // Protected routes - user department management
    Route::middleware('auth:sanctum')->group(function () {
        // Get current user's selected department
        Route::get('/user/me', [App\Http\Controllers\MedicalDepartmentController::class, 'getUserDepartment']);
        // Update current user's department
        Route::put('/user/me', [App\Http\Controllers\MedicalDepartmentController::class, 'updateUserDepartment']);
        // Remove user's department selection
        Route::delete('/user/me', [App\Http\Controllers\MedicalDepartmentController::class, 'removeUserDepartment']);
    });
});

// Enable broadcasting routes for API (using Sanctum)
Broadcast::routes(['middleware' => ['auth:sanctum']]);

// QR Pairing Routes
Route::get('/pairing/initiate', [App\Http\Controllers\PairingController::class, 'initiate']);
Route::get('/pairing/check/{id}', [App\Http\Controllers\PairingController::class, 'checkStatus']);
Route::middleware('auth:sanctum')->post('/pairing/authorize', [App\Http\Controllers\PairingController::class, 'authorize']);
Route::middleware('auth:sanctum')->get('/pairing/initiate-secure', [App\Http\Controllers\PairingController::class, 'initiateSecure']);
Route::post('/pairing/claim', [App\Http\Controllers\PairingController::class, 'claim']);

    // Company Settings Routes
    Route::middleware(['auth:sanctum','SaveApiResponses'])->group(function () {
        Route::prefix('company/settings')->group(function () {
            Route::get('/', [App\Http\Controllers\CompanySettingsController::class, 'show']);
            Route::put('/', [App\Http\Controllers\CompanySettingsController::class, 'update']);
        });

        // Company Dashboard Routes (company_manager role required)
        Route::prefix('company/dashboard')->middleware('role:company_manager')->group(function () {
            Route::get('/statistics', [App\Http\Controllers\CompanyDashboardController::class, 'index']);
        });
    });

// ============================================
// TESTING ROUTES - Authentication by User ID
// ============================================
// WARNING: These routes are for testing only!
// Usage: Add header "X-User-IID: 1" or query "?iid=1"
// Example: GET /api/test/profile?iid=1
// ============================================
Route::middleware('auth:sanctum')->prefix('test')->group(function () {
    Route::get('/profile', function (Request $request) {
        return response()->json([
            'success' => true,
            'message' => __('Profile retrieved successfully'),
            'user' => $request->user(),
        ]);
    });

    //     Route::get('/companies', [App\Http\Controllers\CompanyController::class, 'index']);
//     Route::get('/users', [App\Http\Controllers\UserController::class, 'index']);
//     Route::get('/channels', [App\Http\Controllers\ChannelController::class, 'index']);
});

// Protected routes (authentication required)
// Using auth:sanctum for testing - can switch back to auth:sanctum for production
Route::middleware(['auth:sanctum','SaveApiResponses'])->group(function () {

    // Company Routes
    Route::prefix('companies')->group(function () {
        Route::get('/', [App\Http\Controllers\CompanyController::class, 'index']);
        Route::post('/', [App\Http\Controllers\CompanyController::class, 'store']);
        Route::post('/find', [App\Http\Controllers\CompanyController::class, 'find']);

        // Company-scoped user management
        Route::prefix('users')->group(function () {
            Route::get('/', [App\Http\Controllers\UserController::class, 'index']);
            Route::post('/', [App\Http\Controllers\UserController::class, 'store']);
            Route::get('/online', [App\Http\Controllers\UserController::class, 'online']);
            Route::get('/{id}', [App\Http\Controllers\UserController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\UserController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\UserController::class, 'destroy']);
            Route::patch('/{id}/role', [App\Http\Controllers\UserController::class, 'updateRole']);
            Route::patch('/{id}/toggle-status', [App\Http\Controllers\UserController::class, 'toggleUserStatus']);
        });

        Route::get('/{id}', [App\Http\Controllers\CompanyController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\CompanyController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\CompanyController::class, 'destroy']);
    });

    /*
        // Workspace Routes
        Route::prefix('workspaces')->group(function () {
            Route::get('/', [App\Http\Controllers\WorkspaceController::class, 'index']);
            Route::post('/', [App\Http\Controllers\WorkspaceController::class, 'store']);
            Route::get('/{workspace}', [App\Http\Controllers\WorkspaceController::class, 'show']);
            Route::put('/{workspace}', [App\Http\Controllers\WorkspaceController::class, 'update']);
            Route::delete('/{workspace}', [App\Http\Controllers\WorkspaceController::class, 'destroy']);

            // Workspace Members
            Route::get('/{workspace}/members', [App\Http\Controllers\WorkspaceController::class, 'members']);
            Route::post('/{workspace}/members', [App\Http\Controllers\WorkspaceController::class, 'addMember']);
            Route::delete('/{workspace}/members/{userId}', [App\Http\Controllers\WorkspaceController::class, 'removeMember']);
            Route::patch('/{workspace}/members/{userId}', [App\Http\Controllers\WorkspaceController::class, 'updateMemberRole']);
        });

        // Channel Routes
        Route::prefix('channels')->group(function () {
            Route::get('/', [App\Http\Controllers\ChannelController::class, 'index']);
            Route::post('/', [App\Http\Controllers\ChannelController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\ChannelController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\ChannelController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\ChannelController::class, 'destroy']);
            Route::get('/{id}/members', [App\Http\Controllers\ChannelController::class, 'members']);
            Route::post('/{id}/members', [App\Http\Controllers\ChannelController::class, 'addMember']);
            Route::delete('/{id}/members/{userId}', [App\Http\Controllers\ChannelController::class, 'removeMember']);
            Route::patch('/{id}/mark-read', [App\Http\Controllers\ChannelNotificationController::class, 'markAsRead']);
            Route::get('/{id}/messages', [App\Http\Controllers\MessageController::class, 'byChannel']);
            Route::get('/{id}/search', [App\Http\Controllers\MessageController::class, 'search']);
        });

        // Message Routes
        Route::prefix('messages')->group(function () {
            Route::get('/', [App\Http\Controllers\MessageController::class, 'index']);
            Route::post('/', [App\Http\Controllers\MessageController::class, 'store']);
            Route::get('/starred', [App\Http\Controllers\MessageController::class, 'getStarredMessages']);
            Route::get('/starred/count', [App\Http\Controllers\MessageController::class, 'getStarredCount']);
            Route::get('/threads', [App\Http\Controllers\MessageController::class, 'getThreads']);
            Route::get('/{id}', [App\Http\Controllers\MessageController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\MessageController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\MessageController::class, 'destroy']);
            Route::get('/{id}/thread', [App\Http\Controllers\MessageController::class, 'thread']);
            Route::get('/{id}/replies', [App\Http\Controllers\MessageController::class, 'getReplies']);
            Route::post('/{id}/favorite', [App\Http\Controllers\MessageController::class, 'toggleFavorite']);
            Route::get('/{id}/starred', [App\Http\Controllers\MessageController::class, 'checkStarred']);
        });

        // Direct Message Routes
        Route::prefix('direct-messages')->group(function () {
            Route::get('/', [App\Http\Controllers\DirectMessageController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DirectMessageController::class, 'store']);
            Route::get('/conversation/{userId}', [App\Http\Controllers\DirectMessageController::class, 'conversation']);
            Route::get('/unread-count', [App\Http\Controllers\DirectMessageController::class, 'unreadCount']);
            Route::get('/{id}', [App\Http\Controllers\DirectMessageController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DirectMessageController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DirectMessageController::class, 'destroy']);
            Route::patch('/{id}/read', [App\Http\Controllers\DirectMessageController::class, 'markAsRead']);
        });

        // Reaction Routes
        Route::prefix('reactions')->group(function () {
            Route::post('/toggle', [App\Http\Controllers\ReactionController::class, 'toggle']);
            // Route::get('/message/{messageId}', [App\Http\Controllers\ReactionController::class, 'getMessageReactions']);
        });
    */

    // Notification Routes (Laravel Notifications)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [App\Http\Controllers\NotificationController::class, 'index']);
        Route::get('/unread', [App\Http\Controllers\NotificationController::class, 'unread']);
        Route::get('/unread-count', [App\Http\Controllers\NotificationController::class, 'unreadCount']);
        Route::get('/statistics', [App\Http\Controllers\NotificationController::class, 'statistics']);
        Route::patch('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::patch('/mark-all-read', [App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
        Route::patch('/channel/{channelId}/mark-read', [App\Http\Controllers\NotificationController::class, 'markChannelAsRead']);
        Route::delete('/{id}', [App\Http\Controllers\NotificationController::class, 'destroy']);
        Route::delete('/read/all', [App\Http\Controllers\NotificationController::class, 'deleteAllRead']);
    });

    /*
        // Channel Notification Routes
        Route::prefix('channel-notifications')->group(function () {
            Route::get('/channel/{channelId}/unread-count', [App\Http\Controllers\ChannelNotificationController::class, 'unreadCount']);
        });
    */

    /*
        // Drawing Routes
        Route::prefix('drawings')->group(function () {
            Route::get('/', [App\Http\Controllers\DrawingController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DrawingController::class, 'store']);
            Route::post('/upload', [App\Http\Controllers\DrawingController::class, 'upload']);
            Route::get('/{id}', [App\Http\Controllers\DrawingController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DrawingController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DrawingController::class, 'destroy']);

            // Drawing Revisions
            Route::get('/{id}/revisions', [App\Http\Controllers\RevisionController::class, 'index']);
            Route::post('/{id}/revisions', [App\Http\Controllers\RevisionController::class, 'store']);
            Route::patch('/revisions/{id}/status', [App\Http\Controllers\RevisionController::class, 'updateStatus']);

            // Drawing Layers
            Route::get('/{id}/layers', [App\Http\Controllers\LayerController::class, 'index']);
            Route::post('/{id}/layers', [App\Http\Controllers\LayerController::class, 'store']);
            Route::put('/layers/{id}', [App\Http\Controllers\LayerController::class, 'update']);
            Route::delete('/layers/{id}', [App\Http\Controllers\LayerController::class, 'destroy']);

            // Drawing Pins
            Route::get('/{id}/pins', [App\Http\Controllers\PinController::class, 'index']);
            Route::post('/{id}/pins', [App\Http\Controllers\PinController::class, 'store']);
            Route::put('/pins/{id}', [App\Http\Controllers\PinController::class, 'update']);
            Route::delete('/pins/{id}', [App\Http\Controllers\PinController::class, 'destroy']);
        });
    */

    /*
        // Topic Routes
        Route::prefix('topics')->group(function () {
            Route::get('/', [App\Http\Controllers\TopicController::class, 'index']);
            Route::post('/', [App\Http\Controllers\TopicController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\TopicController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\TopicController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\TopicController::class, 'destroy']);
        });
    */

    // Ticket Routes
    Route::prefix('tickets')->group(function () {
        Route::get('/', [App\Http\Controllers\TicketController::class, 'index']);
        Route::post('/', [App\Http\Controllers\TicketController::class, 'store']);
        Route::post('/bulk-update', [App\Http\Controllers\TicketController::class, 'bulkUpdate']);
        Route::get('/{id}', [App\Http\Controllers\TicketController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\TicketController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\TicketController::class, 'destroy']);
        Route::patch('/{id}/status', [App\Http\Controllers\TicketController::class, 'updateStatus']);
        Route::patch('/{id}/priority', [App\Http\Controllers\TicketController::class, 'updatePriority']);
    });

    /*
        // Discipline Routes
        Route::prefix('disciplines')->group(function () {
            Route::get('/', [App\Http\Controllers\DisciplineController::class, 'index']);
            Route::post('/', [App\Http\Controllers\DisciplineController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\DisciplineController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\DisciplineController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\DisciplineController::class, 'destroy']);
        });
    */

    /*
        // Floor Routes
        Route::prefix('floors')->group(function () {
            Route::get('/', [App\Http\Controllers\FloorController::class, 'index']);
            Route::post('/', [App\Http\Controllers\FloorController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\FloorController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\FloorController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\FloorController::class, 'destroy']);
        });
    */

    /*
        // Project Routes
        Route::prefix('projects')->group(function () {
            Route::get('/', [App\Http\Controllers\ProjectController::class, 'index']);
            Route::post('/', [App\Http\Controllers\ProjectController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\ProjectController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\ProjectController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\ProjectController::class, 'destroy']);
            Route::post('/{id}/members', [App\Http\Controllers\ProjectController::class, 'addMember']);
        });
    */

    /*
        // Saved View Routes
        Route::prefix('saved-views')->group(function () {
            Route::get('/', [App\Http\Controllers\SavedViewController::class, 'index']);
            Route::post('/', [App\Http\Controllers\SavedViewController::class, 'store']);
            Route::get('/{id}', [App\Http\Controllers\SavedViewController::class, 'show']);
            Route::put('/{id}', [App\Http\Controllers\SavedViewController::class, 'update']);
            Route::delete('/{id}', [App\Http\Controllers\SavedViewController::class, 'destroy']);
        });
    */

    // File Upload Routes
    Route::prefix('files')->group(function () {
        Route::post('/upload', [App\Http\Controllers\FileUploadController::class, 'upload']);
    });

    /*
        // Push Notification Routes
        Route::prefix('push')->group(function () {
            Route::post('/subscribe', [App\Http\Controllers\PushNotificationController::class, 'subscribe']);
            Route::post('/unsubscribe', [App\Http\Controllers\PushNotificationController::class, 'unsubscribe']);
            Route::post('/test', [App\Http\Controllers\PushNotificationController::class, 'sendTest']);
        });
    */

    /*
        // Mention Routes
        Route::prefix('mentions')->group(function () {
            Route::get('/', [App\Http\Controllers\MentionController::class, 'index']);
            Route::get('/unread-count', [App\Http\Controllers\MentionController::class, 'unreadCount']);
            Route::get('/channel/{channelId}', [App\Http\Controllers\MentionController::class, 'getChannelMentions']);
            Route::get('/message/{messageId}', [App\Http\Controllers\MentionController::class, 'getMessageMentions']);
        });
    */

    /*
        // Search Routes
        Route::prefix('search')->group(function () {
            Route::get('/', [App\Http\Controllers\SearchController::class, 'search']);
        });
    */

    /*
        // Link Preview Routes
        Route::get('/link-preview', [App\Http\Controllers\LinkPreviewController::class, 'preview']);
    */

    /*
        // PDF Routes
        Route::prefix('pdfs')->group(function () {
            Route::get('/', [App\Http\Controllers\PdfController::class, 'index']);
            Route::post('/upload', [App\Http\Controllers\PdfController::class, 'upload']);
            Route::get('/{id}', [App\Http\Controllers\PdfController::class, 'show']);
            Route::post('/{id}/save-edited', [App\Http\Controllers\PdfController::class, 'saveEdited']);
            Route::get('/{id}/download', [App\Http\Controllers\PdfController::class, 'download']);
            Route::delete('/{id}', [App\Http\Controllers\PdfController::class, 'destroy']);
        });
    */

    // Inbox Notes Routes
    Route::prefix('inbox-notes')->group(function () {
        Route::get('/', [App\Http\Controllers\InboxNoteController::class, 'index']);
        Route::post('/', [App\Http\Controllers\InboxNoteController::class, 'store']);
        Route::get('/pending', [App\Http\Controllers\InboxNoteController::class, 'getPending']);
        Route::get('/archived', [App\Http\Controllers\InboxNoteController::class, 'getArchived']);
        Route::get('/{id}', [App\Http\Controllers\InboxNoteController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\InboxNoteController::class, 'update']);
        Route::patch('/{id}/status', [App\Http\Controllers\InboxNoteController::class, 'updateStatus']);
        Route::patch('/{id}/archive', [App\Http\Controllers\InboxNoteController::class, 'archive']);
        Route::delete('/{id}', [App\Http\Controllers\InboxNoteController::class, 'destroy']);
        Route::post('/{id}/apply-macro', [App\Http\Controllers\InboxNoteController::class, 'applyMacro']);
    });

    // Macros Routes
    Route::prefix('macros')->group(function () {
        Route::get('/', [App\Http\Controllers\MacroController::class, 'index']);
        Route::post('/', [App\Http\Controllers\MacroController::class, 'store']);
        Route::get('/department/{departmentId}', [App\Http\Controllers\MacroController::class, 'getByDepartment']);
        Route::get('/favorites', [App\Http\Controllers\MacroController::class, 'getFavorites']);
        Route::get('/most-used', [App\Http\Controllers\MacroController::class, 'getMostUsed']);
        Route::get('/{id}', [App\Http\Controllers\MacroController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\MacroController::class, 'update']);
        Route::patch('/{id}/toggle-favorite', [App\Http\Controllers\MacroController::class, 'toggleFavorite']);
        Route::patch('/{id}/increment-usage', [App\Http\Controllers\MacroController::class, 'incrementUsage']);
        Route::put('/{id}/assign-departments', [App\Http\Controllers\MacroController::class, 'assignDepartments']);
        Route::delete('/{id}', [App\Http\Controllers\MacroController::class, 'destroy']);
    });

    // Admin Routes (Admin only - requires role=admin)
    Route::prefix('admin')->middleware('admin')->group(function () {
        // Dashboard Statistics
        Route::get('/dashboard/statistics', [App\Http\Controllers\Admin\AdminDashboardController::class, 'dashboardStatistics']);
        Route::get('/dashboard/companies-statistics', [App\Http\Controllers\Admin\AdminDashboardController::class, 'dashboardCompaniesStatistics']);
        Route::get('/dashboard/users-statistics', [App\Http\Controllers\Admin\AdminDashboardController::class, 'dashboardUsersStatistics']);

        // Companies Management
        Route::apiResource('companies', App\Http\Controllers\Admin\AdminCompanyController::class);
        Route::patch('companies/{company}/toggle-status', [App\Http\Controllers\Admin\AdminCompanyController::class, 'toggleStatus']);
        Route::get('companies/{company}/users', [App\Http\Controllers\Admin\AdminCompanyController::class, 'users']);
        
        // Company Settings (Admin)
        Route::get('companies/{company}/settings', [App\Http\Controllers\Admin\AdminCompanyController::class, 'settings']);
        Route::put('companies/{company}/settings', [App\Http\Controllers\Admin\AdminCompanyController::class, 'updateSettings']);
        Route::patch('companies/{company}/settings', [App\Http\Controllers\Admin\AdminCompanyController::class, 'updateSettings']);

        // Users Management
        Route::apiResource('users', App\Http\Controllers\Admin\AdminUserController::class);
        Route::patch('users/{user}/role', [App\Http\Controllers\Admin\AdminUserController::class, 'updateRole']);
        Route::post('users/{user}/reset-password', [App\Http\Controllers\Admin\AdminUserController::class, 'resetPassword']);
        Route::patch('users/{user}/toggle-status', [App\Http\Controllers\Admin\AdminUserController::class, 'toggleUserStatus']);
    });
    // Audio Processing Routes — Oracle OCI ONLY (data sovereignty policy)
    Route::prefix('audio')->group(function () {
        Route::post('/transcribe-oracle', [App\Http\Controllers\AudioController::class, 'transcribeOracle']);
        Route::get('/transcription-status/{jobId}', [App\Http\Controllers\AudioController::class, 'transcriptionStatus']);
        Route::get('/oracle-token', [App\Http\Controllers\AudioController::class, 'oracleToken']);
    });

    // User Settings Routes
    Route::prefix('user-settings')->group(function () {
        Route::get('/', [App\Http\Controllers\UserSettingsController::class, 'index']);
        Route::put('/', [App\Http\Controllers\UserSettingsController::class, 'update']);
    });
});

// Public/Manual Auth Routes
// Route::get('/pdfs/{id}/view', [App\Http\Controllers\PdfController::class, 'view']);

// Public Company Routes (for invitation code verification before registration)
Route::get('/companies/verify-code/{code}', [App\Http\Controllers\CompanyController::class, 'verifyCode']);
