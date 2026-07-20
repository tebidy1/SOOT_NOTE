<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\InboxNote;
use App\Models\InboxNoteOutput;
use App\Services\TextAnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use LaraCore\Http\Controllers\BaseController;

class TextAnalysisController extends BaseController
{
    public function analyzeByNoteId(Request $request, int $noteId): JsonResponse
    {
        try {
            $note = InboxNote::where('id', $noteId)
                ->when(auth()->check() && auth()->user()->company_id, function ($q) {
                    $q->where('company_id', auth()->user()->company_id);
                })
                ->first();

            if (!$note) {
                return $this->error([], __('Note not found'), 404);
            }

            $text = $note->raw_text ?? $note->original_text ?? $note->formatted_text ?? '';

            if (empty(trim($text))) {
                return $this->error([], __('Note has no text content to analyze'), 422);
            }

            // $language = $request->input('language', 'en');
            $language = 'en';
            $method = $request->input('method', 'oci');

            $service = app(TextAnalysisService::class);
            $result = $service->analyzeByNote($note, $language, $method);

            $existingOutputs = $note->outputs()->get()->map(function ($output) {
                return [
                    'macro_id' => $output->macro_id,
                    'title' => $output->title,
                    'content' => $output->content,
                ];
            })->values()->toArray();

            $existingOutputs[] = [
                'macro_id' => 85,
                'title' => 'AI Analysis',
                'content' => json_encode($result['extracted_fields'] ?? $result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            ];

            $this->saveGeneratedOutputs($note, $existingOutputs);

            return $this->success($result, __('Text analysis completed successfully'));
        } catch (\Exception $e) {
            Log::error('Text Analysis Failed', [
                'note_id' => $noteId,
                'error' => $e->getMessage(),
            ]);
            return $this->error([], $e->getMessage(), 500);
        }
    }

    protected function saveGeneratedOutputs(InboxNote $note, array $outputs): void
    {
        $existingOutputs = $note->outputs()->get();
        $existingMacroIds = $existingOutputs->pluck('macro_id')->filter()->toArray();
        $processedMacroIds = [];

        foreach ($outputs as $index => $output) {
            $macroId = $output['macro_id'] ?? null;

            if ($macroId !== null) {
                $existingOutput = $existingOutputs->firstWhere('macro_id', $macroId);

                if ($existingOutput) {
                    $existingOutput->update([
                        'title' => $output['title'] ?? null,
                        'content' => $output['content'] ?? null,
                        'order_index' => $index,
                    ]);
                    $processedMacroIds[] = $macroId;
                    continue;
                }
            }

            InboxNoteOutput::create([
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

        $macroIdsToDelete = array_diff($existingMacroIds, $processedMacroIds);
        if (!empty($macroIdsToDelete)) {
            InboxNoteOutput::where('inbox_note_id', $note->id)
                ->whereIn('macro_id', $macroIdsToDelete)
                ->delete();
        }
    }

    public function analyzeText(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'text' => 'required|string|min:1',
                'language' => 'nullable|string|in:ar,en,fr,de,es,it,pt,nl,hi,ja,ko,zh',
                'method' => 'nullable|string|in:all,pattern,gemini,oci',
            ]);

            $text = $request->input('text');
$language = $request->input('language', 'en');
            $method = $request->input('method', 'oci');

            $service = app(TextAnalysisService::class);
            $result = $service->analyzeText($text, $language, $method);

            return $this->success($result, __('Text analysis completed successfully'));
        } catch (\Exception $e) {
            Log::error('Text Analysis Failed', ['error' => $e->getMessage()]);
            return $this->error([], $e->getMessage(), 500);
        }
    }
}
