<?php
use Modules\School\Models\MMedia;
use  Modules\School\Models\School;
use Modules\School\Models\Subject;
use Modules\School\Models\Lesson;
use Modules\School\Models\Chapter;
use Illuminate\Support\Facades\Auth;


if (!function_exists('getSchool')) {
function getSchool()
{
    $user = Auth::user();
    $school = School::where('id', $user->school_id)->first();
    return $school;
}}


if (!function_exists('buildMeetingPayload')) {
function buildMeetingPayload()
{
  return [
        'topic' => 'topic',
        'description' => 'description',
        'start_time' => '2025-07-26T09:49:14.333Z',
        'duration' => 60,
        'is_recording' => true,
        'password' =>  substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 6),
        'settings' => [
            'auto_recording' => 'cloud',
            'host_video' => true,
            'participant_video' => true,
            'join_before_host' => false,
            'mute_upon_entry' => true,
            'use_pmi' => false,
            'waiting_room' => true,
            'watermark' => false,
        ],
        'teacher_id' => auth()->user()->id,
        'timezone' => 'Asia/Riyadh',
    ];

}
}
if (!function_exists('get_zoom_settings')) {

function get_zoom_settings($k)
{
   // Actualizado según la documentación de Zoom API v2
//    $keys = [
//        'zoom_client_id' => 'Dns5inPZTGOZ9Tr5DXGMrw',
//        'zoom_client_secret' => 'XpHchnPPRT6L7bWdRrjdgw',
//        'zoom_account_id' => '5018379320',
//        'zoom_account_email' => 'muhammed2020osman@gmail.com',
//        'zoom_api_key' => 'Dns5inPZTGOZ9Tr5DXGMrw', // Mismo que client_id para compatibilidad
//        'zoom_api_secret' => 'XpHchnPPRT6L7bWdRrjdgw' // Debe coincidir con client_secret para compatibilidad
//    ];
$keys = [
    'ACCOUNT_ID' => '90mnAcgsSKi901nuoywQAg',
    'CLIENT_ID' => 'pCr3o07SJ23p1Vl9l24rA',
    'CLIENT_SECRET' => 'Sqn70ISygGQBHabWbxNE9ZlJCve0NkRU',
    'REDIRECT_URI' => 'https://api.gumra-ai.com/api/zoom/callback'
];
   // Check if the key exists
   if (!isset($keys[$k])) {
       error_log('Zoom setting not found: ' . $k);
       return null;
   }

   return $keys[$k];
}
}


if (!function_exists('getSubjectFiles')) {
    function getSubjectFiles($subjectId)
    {
        $subject = Subject::findOrFail($subjectId);

    $files =   MMedia::where(function ($query) use ($subject) {
        $structure = getSubjectStructure($subject->id);

        // Log::info("message", $structure);
        $query->orWhere(function ($q) use ($subject) {
            $q->where('model_type', 'Modules\School\Models\Subject')
              ->where('model_id', $subject->id);
        });

        if (!empty($structure['chapters_ids'])) {
            $query->orWhere(function ($q) use ($structure) {
                $q->where('model_type', 'Modules\School\Models\Chapter')
                  ->whereIn('model_id', $structure['chapters_ids']);
            });
        }

        if (!empty($structure['lessons_ids'])) {
            $query->orWhere(function ($q) use ($structure) {
                $q->where('model_type', 'Modules\School\Models\Lesson')
                  ->whereIn('model_id', $structure['lessons_ids']);
            });
        }
    })->get();

    return $files;
    }}

if (!function_exists('getSubjectTree')) {
    function getSubjectTree($subjectId)
    {
        $subject = Subject::with(['chapters.lessons'])->findOrFail($subjectId);

        // Get subject files
        $subjectFiles = MMedia::where('model_type', 'Modules\School\Models\Subject')
            ->where('model_id', $subject->id)
            ->get();

        $tree = [
            'id' => $subject->id,
            'name' => $subject->name,
            'type' => 'subject',
            'files' => $subjectFiles,
            'chapters' => []
        ];

        // Get chapters with their files
        foreach ($subject->chapters as $chapter) {
            $chapterFiles = MMedia::where('model_type', 'Modules\School\Models\Chapter')
                ->where('model_id', $chapter->id)
                ->get();

            $chapterData = [
                'id' => $chapter->id,
                'name' => $chapter->title,
                'order' => $chapter->order,
                'type' => 'chapter',
                'files' => $chapterFiles,
                'lessons' => []
            ];

            // Get lessons with their files
            foreach ($chapter->lessons as $lesson) {
                $lessonFiles = MMedia::where('model_type', 'Modules\School\Models\Lesson')
                    ->where('model_id', $lesson->id)
                    ->get();

                $lessonData = [
                    'id' => $lesson->id,
                    'name' => $lesson->title,
                    'order' => $lesson->order,
                    'type' => 'lesson',
                    'files' => $lessonFiles
                ];

                $chapterData['lessons'][] = $lessonData;
            }

            $tree['chapters'][] = $chapterData;
        }

        return $tree;
    }
}
if (!function_exists('getSubjectStructure')) {
    function getSubjectStructure($subjectId)
    {
        $subject = Subject::find($subjectId);

        if (!$subject) {
            return null;
        }

        $chapterIds = Chapter::where('subject_id', $subjectId)->pluck('id')->toArray();

        $lessonIds = Lesson::whereIn('chapter_id', $chapterIds)->pluck('id')->toArray();

        return [
            'chapters_ids' => $chapterIds,
            'lessons_ids' => $lessonIds,
        ];
    }
}
