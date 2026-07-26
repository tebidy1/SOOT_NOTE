<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\InboxStatus;
use App\Http\Requests\InboxNote\StoreInboxNoteRequest;
use App\Http\Requests\InboxNote\UpdateInboxNoteRequest;
use App\Models\InboxNote;
use App\Models\InboxNoteOutput;
use App\Models\Macro;
use App\Services\TextAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Controllers\BaseController;
use LaraCore\Traits\ControllerOperationsTrait;

class InboxNoteController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['raw_text', 'patient_name', 'summary'],
        'default_relations' => ['user', 'company', 'suggestedMacro', 'appliedMacro', 'outputs', 'outputs.macro', 'textAnalyses'],
        'model_class' => InboxNote::class,
        'request_class' => StoreInboxNoteRequest::class,
    ];

    /**
     * Display a listing of the resource.
     * Auto-filter by authenticated user's company.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];
            $query = $modelClass::query()
                ->with(static::CONFIG['default_relations']);

            // Auto-filter by authenticated user's company
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }

            // Apply search if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('raw_text', 'like', "%{$searchTerm}%")
                        ->orWhere('patient_name', 'like', "%{$searchTerm}%")
                        ->orWhere('summary', 'like', "%{$searchTerm}%");
                });
            }

            // Apply filters
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Allow explicit company_id override for admins
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            $notes = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

            return $this->paginatedResponse($notes, __('Notes retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get pending inbox notes
     * Auto-filter by authenticated user's company.
     */
    public function getPending(Request $request): JsonResponse
    {
        try {
            $query = InboxNote::query()
                ->where('status', InboxStatus::PENDING->value)
                ->with(static::CONFIG['default_relations']);

            // Auto-filter by authenticated user's company
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }

            // Apply search if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('raw_text', 'like', "%{$searchTerm}%")
                        ->orWhere('patient_name', 'like', "%{$searchTerm}%")
                        ->orWhere('summary', 'like', "%{$searchTerm}%");
                });
            }

            // Apply filters
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Allow explicit company_id override for admins
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            $notes = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

            return $this->paginatedResponse($notes, __('Pending notes retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];
            $relations = array_merge(
                static::CONFIG['default_relations'],
                static::CONFIG['show_relations'] ?? []
            );

            $note = $modelClass::with($relations)->findOrFail($id);

            if (auth()->check() && auth()->user()->company_id && $note->company_id !== auth()->user()->company_id) {
                return $this->error([], __('Note not found'), 404);
            }

            $fieldMappings = [];
            foreach ($note->textAnalyses as $analysis) {
                $mappings = $analysis->analysis_data['field_mappings'] ?? [];
                if (is_array($mappings)) {
                    $fieldMappings = array_merge($fieldMappings, $mappings);
                }
            }

            $noteData = $note->toArray();
            $noteData['field_mappings'] = $fieldMappings;
            $noteData['field_review'] = $this->aggregateInjectionReview($note);

            return $this->success($noteData, __('Note retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 404);
        }
    }

    /**
     * Update inbox note status
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'status' => ['required', 'string', 'in:pending,processed,archived'],
            ]);

            $note = InboxNote::findOrFail($id);
            $note->status = InboxStatus::from($request->status);
            $note->save();

            $note->load(static::CONFIG['default_relations']);

            return $this->success($note, __('Note status updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get archived inbox notes
     * Auto-filter by authenticated user's company.
     */
    public function getArchived(Request $request): JsonResponse
    {
        try {
            $query = InboxNote::query()
                ->where('status', InboxStatus::ARCHIVED->value)
                ->with(static::CONFIG['default_relations']);

            // Auto-filter by authenticated user's company
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }

            // Apply search if provided
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('raw_text', 'like', "%{$searchTerm}%")
                        ->orWhere('patient_name', 'like', "%{$searchTerm}%")
                        ->orWhere('summary', 'like', "%{$searchTerm}%");
                });
            }

            // Apply filters
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Allow explicit company_id override for admins
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            $notes = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

            return $this->paginatedResponse($notes, __('Archived notes retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Archive inbox note
     */
    public function archive($id): JsonResponse
    {
        try {
            $note = InboxNote::findOrFail($id);
            $note->status = InboxStatus::ARCHIVED;
            $note->save();

            $note->load(static::CONFIG['default_relations']);

            return $this->success($note, __('Note archived successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Apply a macro to an inbox note and generate the output
     */
    public function applyMacro(Request $request, $id): JsonResponse
    {
        try {
            $request->validate([
                'macro_id' => 'required|exists:macros,id',
                'mode' => 'sometimes|in:fast,precise',
            ]);

            $note = InboxNote::findOrFail($id);
            $macro = Macro::findOrFail($request->macro_id);

            // Save the applied macro id
            $note->applied_macro_id = $macro->id;
            $note->save();

            // Processing mode chosen by the doctor in settings (default: fast).
            $mode = $request->input('mode', 'fast');

            // Run generation using text analysis service
            $service = app(TextAnalysisService::class);
            $generatedContent = $service->generateNoteFromMacro($note, $macro, $mode);

            if (isset($generatedContent['error'])) {
                return $this->error([], $generatedContent['error'], 500);
            }

            // Derive form-field extractions from the SAME envelope that produced
            // the display note — no second AI call. This is what the extension
            // injects into the external patient form. Skipped for non-AI macros
            // (which don't produce an envelope) and when generation fell back
            // to raw text (envelope malformed).
            if ($macro->is_ai_macro && !empty($generatedContent['envelope_fields'])) {
                $service->saveInjectionAnalysis(
                    $note,
                    $generatedContent['envelope_fields'],
                    $generatedContent['patient_info'] ?? null,
                    (string) ($note->raw_text ?? '')
                );
            }

            // Fetch existing outputs to preserve them
            $existingOutputs = $note->outputs()->get()->map(function ($output) {
                return [
                    'macro_id' => $output->macro_id,
                    'title' => $output->title,
                    'content' => $output->content,
                ];
            })->filter(function ($output) use ($macro) {
                // Remove the current macro if it exists so we can replace it
                return $output['macro_id'] !== $macro->id;
            })->values()->toArray();

            // Append the newly generated output
            $existingOutputs[] = [
                'macro_id' => $macro->id,
                'title' => $macro->trigger ?? 'Generated Note',
                'content' => $generatedContent['content'],
            ];

            // USING THE EXISTING FUNCTION LOGIC WITHOUT CHANGING IT
            $this->saveGeneratedOutputs($note, $existingOutputs);

            // Load relations for response
            $note->load(static::CONFIG['default_relations']);

            // Flatten field_mappings into the payload (same shape as show())
            // so the extension gets injection data without an extra round-trip.
            $fieldMappings = [];
            foreach ($note->textAnalyses as $analysis) {
                $mappings = $analysis->analysis_data['field_mappings'] ?? [];
                if (is_array($mappings)) {
                    $fieldMappings = array_merge($fieldMappings, $mappings);
                }
            }
            $noteData = $note->toArray();
            $noteData['field_mappings'] = $fieldMappings;
            // Generation-time advisories for the review banner (not persisted;
            // the [?] markers themselves live inside the note content).
            $noteData['review'] = $generatedContent['review'] ?? null;
            // Separate injection-path verification, shown on the injection tab.
            $noteData['field_review'] = $this->aggregateInjectionReview($note);
            $noteData['ai_flags'] = $generatedContent['flags'] ?? [];

            return $this->success($noteData, __('Macro applied successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Combine the deterministic injection-path reviews stored on each of a
     * note's textAnalyses into one review object (union of all flagged items).
     * saveInjectionAnalysis stores the same review on every form, but unioning
     * is defensive and keeps this correct if that ever changes. Returns null when
     * no analysis carries a review (e.g. legacy notes analyzed before this).
     */
    private function aggregateInjectionReview(InboxNote $note): ?array
    {
        $missing = [];
        $ranges = [];
        $entities = [];
        $terms = [];
        $found = false;

        foreach ($note->textAnalyses as $analysis) {
            $review = $analysis->analysis_data['review'] ?? null;
            if (!is_array($review)) {
                continue;
            }
            $found = true;
            $missing = array_merge($missing, $review['missing_numbers'] ?? []);
            $ranges = array_merge($ranges, $review['suspicious_ranges'] ?? []);
            $entities = array_merge($entities, $review['unverified_entities'] ?? []);
            $terms = array_merge($terms, $review['unverified_terms'] ?? []);
        }

        if (!$found) {
            return null;
        }

        $missing = array_values(array_unique($missing));
        $ranges = array_values(array_unique($ranges));
        $entities = array_values(array_unique($entities));
        $terms = array_values(array_unique($terms));

        return [
            'passed' => empty($missing) && empty($ranges) && empty($entities) && empty($terms),
            'missing_numbers' => $missing,
            'suspicious_ranges' => $ranges,
            'unverified_entities' => $entities,
            'unverified_terms' => $terms,
        ];
    }

    /**
     * Process data and files for the entity
     */
    protected function attach(array $data, ?InboxNote $entity = null, ?Request $request = null): InboxNote
    {
        $new = false;
        if (is_null($entity)) {
            $entity = new InboxNote();
            $new = true;
        }

        // Extract generated_outputs before filling (they need special handling)
        $generatedOutputs = null;
        if (isset($data['generated_outputs']) && is_array($data['generated_outputs'])) {
            $generatedOutputs = $data['generated_outputs'];
            unset($data['generated_outputs']);
        }

        // Fill basic data
        $entity->fill($data);

        // Add current user ID if not present and user is authenticated
        if (!$entity->user_id && auth()->check()) {
            $entity->user_id = auth()->id();
        }

        // Add company ID from user if not present
        if (!$entity->company_id && auth()->check() && auth()->user()->company_id) {
            $entity->company_id = auth()->user()->company_id;
        }

        // Set default status if not provided
        if (!isset($data['status'])) {
            $entity->status = InboxStatus::PENDING;
        }

        // Save the model
        $entity->save();

        // Save generated outputs if provided
        if ($generatedOutputs !== null) {
            $this->saveGeneratedOutputs($entity, $generatedOutputs);
        }

        // Note is saved. No background AI runs here anymore — field extraction
        // now happens inline the first time the doctor applies a template
        // (see applyMacro), reusing the SAME envelope that produces the
        // display note. One LLM call per note instead of two racing calls.

        // Load relationships for response
        $entity->load(static::CONFIG['default_relations']);

        return $entity;
    }

    /**
     * Save generated outputs for the note
     * Uses sync approach: update existing by macro_id, create new, delete removed
     */
    protected function saveGeneratedOutputs(InboxNote $note, array $outputs): void
    {
        // Get existing outputs for this note
        $existingOutputs = $note->outputs()->get();
        $existingMacroIds = $existingOutputs->pluck('macro_id')->filter()->toArray();
        $processedMacroIds = [];

        foreach ($outputs as $index => $output) {
            $macroId = $output['macro_id'] ?? null;

            // If macro_id exists, check if there's an existing output with the same macro_id
            if ($macroId !== null) {
                $existingOutput = $existingOutputs->firstWhere('macro_id', $macroId);

                if ($existingOutput) {
                    // Update existing output by macro_id
                    $existingOutput->update([
                        'title' => $output['title'] ?? null,
                        'content' => $output['content'] ?? null,
                        'order_index' => $index,
                    ]);
                    $processedMacroIds[] = $macroId;
                    continue;
                }
            }

            // Create new output (either no macro_id or macro_id doesn't exist)
            $outputModel = InboxNoteOutput::create([
                'inbox_note_id' => $note->id,
                'macro_id' => $macroId,
                'title' => $output['title'] ?? null,
                'content' => $output['content'] ?? null,
                'order_index' => $index,
            ]);

            if ($macroId !== null) {
                $processedMacroIds[] = $macroId;
            }
        }

        // Delete outputs that are no longer in the list (by macro_id)
        $macroIdsToDelete = array_diff($existingMacroIds, $processedMacroIds);
        if (!empty($macroIdsToDelete)) {
            InboxNoteOutput::where('inbox_note_id', $note->id)
                ->whereIn('macro_id', $macroIdsToDelete)
                ->delete();
        }
    }
}
