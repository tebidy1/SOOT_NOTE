<?php

namespace App\Http\Controllers;

use App\Events\PairingSuccessful;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class PairingController extends Controller
{
    /**
     * Check the status of a pairing session (Polling for Web/Desktop)
     */
    public function checkStatus($id): JsonResponse
    {
        $session = Cache::get('pairing:' . $id);
        
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found or expired',
            ], 404);
        }

        if ($session['status'] === 'authorized') {
            return response()->json([
                'success' => true,
                'status' => 'authorized',
                'token' => $session['token'],
                'user' => $session['user'],
            ]);
        }

        return response()->json([
            'success' => true,
            'status' => 'pending',
        ]);
    }

    /**
     * Initiate a pairing session (Desktop/Web)
     */
    public function initiate(): JsonResponse
    {
        $pairingId = (string) Str::uuid();
        $pairingCode = (string) rand(100000, 999999);
        $ttl = 300; // 5 minutes
        
        \Log::info('Pairing initiated', ['pairing_id' => $pairingId, 'code' => $pairingCode]);

        // Store UUID session with metadata
        Cache::put('pairing:' . $pairingId, [
            'status' => 'pending',
            'created_at' => now()->timestamp,
        ], now()->addMinutes(10)); // Increased to 10 mins for safety
        
        // Map short code to UUID
        Cache::put('pairing_code:' . $pairingCode, $pairingId, now()->addMinutes(10));

        return response()->json([
            'success' => true,
            'pairing_id' => $pairingId,
            'short_code' => $pairingCode,
            'expires_in' => $ttl,
        ]);
    }

    /**
     * Authorize a pairing session (Mobile)
     */
    public function authorize(Request $request): JsonResponse
    {
        $request->validate([
            'pairing_id' => ['required', 'string'], // Can be UUID or Short Code
            'device_name' => ['nullable', 'string'],
        ]);

        $input = $request->pairing_id;
        $pairingId = $input;

        \Log::info('Pairing authorization attempt', ['input' => $input]);

        // Check if input is a short code
        if (strlen($input) === 6 && is_numeric($input)) {
            $pairingId = Cache::get('pairing_code:' . $input);
            \Log::info('Resolved short code', ['code' => $input, 'pairing_id' => $pairingId]);
            if (!$pairingId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired pairing code (300s timeout)',
                ], 404);
            }
        }

        if (!Cache::has('pairing:' . $pairingId)) {
            \Log::warning('Pairing ID not found in cache', ['pairing_id' => $pairingId]);
            return response()->json([
                'success' => false,
                'message' => 'Pairing session expired or invalid (300s timeout)',
            ], 404);
        }

        $user = $request->user();
        $deviceName = $request->input('device_name', 'paired-device');
        
        // Generate a fresh token for the new device
        $token = $user->createToken($deviceName)->plainTextToken;

        // Update cache for polling
        Cache::put('pairing:' . $pairingId, [
            'status' => 'authorized',
            'token' => $token,
            'user' => $user->load('company'),
            'authorized_at' => now()->timestamp,
        ], now()->addMinutes(5));

        // Broadcast the success event with the token (Keep for backward compatibility)
        try {
            broadcast(new PairingSuccessful($pairingId, $user->load('company'), $token))->toOthers();
        } catch (\Exception $e) {
            \Log::error('Broadcast failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Device authorized successfully',
        ]);
    }

    /**
     * Initiate a secure pairing session from an AUTHORIZED device
     */
    public function initiateSecure(Request $request): JsonResponse
    {
        $user = $request->user();
        $pairingId = (string) Str::uuid();
        $pairingCode = (string) rand(100000, 999999);
        
        // Store session with the user ID attached
        Cache::put('secure_pairing:' . $pairingId, $user->id, 60);
        Cache::put('secure_pairing_code:' . $pairingCode, $pairingId, 60);

        \Log::info('Secure pairing initiated', [
            'user_id' => $user->id,
            'pairing_id' => $pairingId,
            'pairing_code' => $pairingCode,
        ]);

        return response()->json([
            'success' => true,
            'pairing_id' => $pairingId,
            'pairing_code' => $pairingCode,
        ]);
    }

    /**
     * Claim a secure pairing session from an UNAUTHORIZED device
     */
    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'pairing_id' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $input = $request->pairing_id;
        $pairingId = $input;

        \Log::info('Claim attempt', ['input' => $input]);

        // Check if short code
        if (strlen($input) === 6 && is_numeric($input)) {
            $pairingId = Cache::get('secure_pairing_code:' . $input);
            \Log::info('Short code detected', ['code' => $input, 'resolved_id' => $pairingId]);
            
            if (!$pairingId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid code. Please check the 6-digit code and try again.',
                ], 404);
            }
        }

        $userId = Cache::get('secure_pairing:' . $pairingId);
        \Log::info('Cache lookup', ['pairing_id' => $pairingId, 'user_id' => $userId]);

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Code expired. Please generate a new code and try again.',
            ], 404);
        }

        $user = \App\Models\User::findOrFail($userId);
        $deviceName = $request->input('device_name', 'claimed-device');
        
        // Generate token for the user
        $token = $user->createToken($deviceName)->plainTextToken;

        // Cleanup
        Cache::forget('secure_pairing:' . $pairingId);

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user->load('company'),
        ]);
    }
}
