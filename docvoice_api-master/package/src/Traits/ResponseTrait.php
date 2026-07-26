<?php

declare(strict_types=1);

namespace LaraCore\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

trait ResponseTrait
{
    /**
     * Return a success JSON response.
     *
     * @param array|JsonResource|ResourceCollection|string $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function success($data = [], string $message = 'Operation successful', int $code = 200): JsonResponse
    {
        // Ensure code is a valid integer HTTP status code
        $code = (int) $code;
        // If code is 0 or invalid, default to 200
        if ($code <= 0 || $code >= 600) {
            $code = 200;
        }

        $responseData = [
            'status' => true,
            'code' => $code,
            'message' => $message,
            'payload' => $data
        ];

        return response()->json($responseData, $code);
    }

    /**
     * Return an error JSON response.
     *
     * @param array $errors
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function error(array $errors = [], string $message = 'Operation failed', int $code = 400): JsonResponse
    {
        $code = (int) $code;
        // If code is 0 or invalid, default to 400
        if ($code <= 0 || $code >= 600) {
            $code = 400;
        }

        return response()->json([
            'status' => false,
            'code' => $code,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }

    /**
     * Return a paginated JSON response.
     *
     * @param LengthAwarePaginator $paginator
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function paginatedResponse(LengthAwarePaginator $paginator, string $message = 'Data retrieved successfully', int $code = 200): JsonResponse
    {
        // Ensure code is a valid integer HTTP status code
        $code = (int) $code;
        // If code is 0 or invalid, default to 200
        if ($code <= 0 || $code >= 600) {
            $code = 200;
        }

        $responseData = [
            'status' => true,
            'code' => $code,
            'message' => $message,
            'payload' => [
                'data' => $paginator->items(),
                'meta' => [
                    'total' => $paginator->total(),
                    'per_page' => $paginator->perPage(),
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'from' => $paginator->firstItem(),
                    'to' => $paginator->lastItem(),
                ],
            ],
        ];

        return response()->json($responseData, $code);
    }

    /**
     * Return a validation error JSON response.
     *
     * @param array $errors
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function validationErrorResponse(array $errors, string $message = 'Validation failed', int $code = 422): JsonResponse
    {
        return $this->error($errors, $message, $code);
    }

    /**
     * Return a not found JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function notFoundResponse(string $message = 'Resource not found'): JsonResponse
    {
        return $this->error([], $message, 404);
    }

    /**
     * Return an unauthorized JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized'): JsonResponse
    {
        return $this->error([], $message, 401);
    }

    /**
     * Return a forbidden JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function forbiddenResponse(string $message = 'Forbidden'): JsonResponse
    {
        return $this->error([], $message, 403);
    }

    /**
     * Return a server error JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function serverErrorResponse(string $message = 'Internal server error'): JsonResponse
    {
        return $this->error([], $message, 500);
    }

    /**
     * Alias for success to maintain compatibility with existing code.
     *
     * @param mixed $data
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function sendResponse($data = [], string $message = 'Operation successful', int $code = 200): JsonResponse
    {
        return $this->success($data, $message, $code);
    }

    /**
     * Alias for error to maintain compatibility with existing code.
     *
     * @param array $errors
     * @param string $message
     * @param int $code
     * @return JsonResponse
     */
    protected function sendError(array $errors = [], string $message = 'Operation failed', int $code = 400): JsonResponse
    {
        return $this->error($errors, $message, $code);
    }

    /**
     * Return a created resource JSON response.
     *
     * @param mixed $data
     * @param string $message
     * @return JsonResponse
     */
    protected function createdResponse($data = [], string $message = 'Resource created successfully'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    /**
     * Return an updated resource JSON response.
     *
     * @param mixed $data
     * @param string $message
     * @return JsonResponse
     */
    protected function updatedResponse($data = [], string $message = 'Resource updated successfully'): JsonResponse
    {
        return $this->success($data, $message, 200);
    }

    /**
     * Return a deleted resource JSON response.
     *
     * @param string $message
     * @return JsonResponse
     */
    protected function deletedResponse(string $message = 'Resource deleted successfully'): JsonResponse
    {
        return $this->success([], $message, 200);
    }

    /**
     * Return a no content JSON response.
     *
     * @return JsonResponse
     */
    protected function noContentResponse(): JsonResponse
    {
        return response()->json(null, 204);
    }
}
