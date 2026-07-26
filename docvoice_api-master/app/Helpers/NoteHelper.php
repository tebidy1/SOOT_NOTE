<?php

namespace App\Helpers;

use App\Models\InboxNoteOutput;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use App\Services\TextAnalysisService;
use App\Models\Macro;
class NoteHelper
{
    /**
     * تأكد من وجود الجدول وإضافة الأعمدة الجديدة مع تحديد النوع المناسب
     */
    public static function analyzeByMacro($note, $macro_id)
    {

        $macro = Macro::findOrFail($macro_id);
        $o = InboxNoteOutput::where('macro_id', $macro_id)->where('inbox_note_id', $note->id)->first();
        if ($o) {
            return $o->content;
        }
        $service = app(TextAnalysisService::class);

        $generatedContent = $service->generateNoteFromMacro($note, $macro);
        return $generatedContent['content'];

    }

}