<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Requests\Ticket\UpdateTicketRequest;
use App\Http\Requests\Ticket\BulkUpdateTicketRequest;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Enums\TicketStatus;
use App\Enums\TicketPriority;
use LaraCore\Http\Controllers\BaseController;
use LaraCore\Traits\ControllerOperationsTrait;

class TicketController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['title', 'description'],
        'default_relations' => ['company', 'drawing', 'discipline', 'assignedTo', 'createdBy', 'reporter', 'channel'],
        'model_class' => Ticket::class,
        'request_class' => StoreTicketRequest::class,
        'update_request_class' => UpdateTicketRequest::class,
    ];

    /**
     * Display a listing of tickets with optional channel_id filter.
     * Auto-filter by authenticated user's company.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Ticket::query()
                ->with(static::CONFIG['default_relations']);

            // Auto-filter by authenticated user's company
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }

            // Apply search
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    foreach (static::CONFIG['search_fields'] as $field) {
                        $q->orWhere($field, 'like', "%{$searchTerm}%");
                    }
                });
            }

            // Filter by status
            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }

            // Filter by priority
            if ($request->has('priority') && !empty($request->priority)) {
                $query->where('priority', $request->priority);
            }

            // Filter by type
            if ($request->has('type') && !empty($request->type)) {
                $query->where('type', $request->type);
            }

            // Filter by channel_id (nullable - accepts empty)
            // Only filter if channel_id is provided and not empty
            $channelIdParam = $request->input('channel_id');
            if ($channelIdParam !== null && $channelIdParam !== '') {
                // Convert to integer if it's a string or numeric
                if (is_numeric($channelIdParam)) {
                    $channelId = (int) $channelIdParam;
                    // Only apply filter if channelId is a valid integer > 0
                    if ($channelId > 0) {
                        \Log::info("TicketController: Filtering tickets by channel_id = {$channelId}");
                        $query->where('channel_id', $channelId);
                    }
                }
            }

            // Order by created_at desc
            $query->orderBy('created_at', 'desc');

            $perPage = $request->get('per_page', 15);
            $tickets = $query->paginate($perPage);

            return $this->paginatedResponse($tickets, __('Tickets retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Bulk update tickets (status, priority, etc.).
     */
    public function bulkUpdate(BulkUpdateTicketRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $ticketIds = $data['ticket_ids'];
            $updates = $data['updates'];

            Ticket::whereIn('id', $ticketIds)->update($updates);

            return $this->success([], __('Tickets updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Update only the status of a ticket.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', Rule::enum(TicketStatus::class)],
        ]);

        $query = Ticket::query();
        if (auth()->check() && auth()->user()->company_id) {
            $query->where('company_id', auth()->user()->company_id);
        }
        $ticket = $query->findOrFail($id);
        $ticket->status = $request->input('status');
        $ticket->save();
        $ticket->load(static::CONFIG['default_relations']);

        return $this->success($ticket, __('Ticket status updated'));
    }

    /**
     * Update only the priority of a ticket.
     */
    public function updatePriority(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'priority' => ['required', 'string', Rule::enum(TicketPriority::class)],
        ]);

        $query = Ticket::query();
        if (auth()->check() && auth()->user()->company_id) {
            $query->where('company_id', auth()->user()->company_id);
        }
        $ticket = $query->findOrFail($id);
        $ticket->priority = $request->input('priority');
        $ticket->save();
        $ticket->load(static::CONFIG['default_relations']);

        return $this->success($ticket, __('Ticket priority updated'));
    }

    /**
     * Attach (create or update) a ticket entity.
     */
    protected function attach(array $data, ?Ticket $entity = null, ?Request $request = null): Ticket
    {
        $isUpdate = !is_null($entity) && $entity->exists;

        if (is_null($entity)) {
            $entity = new Ticket();
        }

        // Get authenticated user
        $user = null;
        if ($request) {
            $user = $request->user();
        }
        if (!$user) {
            $user = auth()->user();
        }

        // Validate company ownership on update
        if ($isUpdate && $user && $user->company_id && $entity->company_id !== $user->company_id) {
            throw new \Exception(__('Ticket not found'));
        }

        // Auto-assign company_id from authenticated user if not provided
        if (!isset($data['company_id']) || empty($data['company_id'])) {
            if ($user && $user->company_id) {
                $data['company_id'] = $user->company_id;
            } else {
                throw new \Exception(__('Company ID is required. Unable to determine company from authenticated user. Please ensure your account is associated with a company.'));
            }
        }

        // Auto-assign created_by from authenticated user if not provided
        if (!isset($data['created_by']) && $user) {
            $data['created_by'] = $user->id;
        }

        // Auto-assign reporter from authenticated user if not provided
        if (!isset($data['reporter']) && $user) {
            $data['reporter'] = $user->id;
        }

        $entity->fill($data);
        $entity->save();
        $entity->load(static::CONFIG['default_relations']);

        return $entity;
    }
}
