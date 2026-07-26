<?php

namespace LaraCore\Traits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;

trait ApiResponseTrait
{
    /**
     * Return a success JSON response.
     */
    protected function successResponse($data = [], string $message = 'تمت العملية بنجاح', int $code = 200): JsonResponse
    {
        $code = (int) $code;
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
     */
    protected function errorResponse(array $errors = [], string $message = 'فشلت العملية', int $code = 400): JsonResponse
    {
        $code = (int) $code;
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
     */
    protected function paginatedResponse(LengthAwarePaginator $paginator, string $message = 'تم جلب البيانات بنجاح', int $code = 200): JsonResponse
    {
        $code = (int) $code;
        if ($code <= 0 || $code >= 600) {
            $code = 200;
        }

        $responseData = [
            'status' => true,
            'code' => $code,
            'message' => $message,
            'payload' => [
                'current_page' => $paginator->currentPage(),
                'data' => $paginator->items(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];

        return response()->json($responseData, $code);
    }

    /**
     * Return a resource response.
     */
    protected function resourceResponse(JsonResource $resource, string $message = 'تم جلب البيانات بنجاح', int $code = 200): JsonResponse
    {
        return $this->successResponse($resource, $message, $code);
    }

    /**
     * Return a collection resource response.
     */
    protected function collectionResponse(ResourceCollection $collection, string $message = 'تم جلب البيانات بنجاح', int $code = 200): JsonResponse
    {
        return $this->successResponse($collection, $message, $code);
    }
}
