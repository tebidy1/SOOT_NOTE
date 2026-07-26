<?php

namespace App\Observers;

use App\Models\InboxNote;

class InboxNoteObserver
{
    /**
     * Handle the InboxNote "created" event.
     */
    public function created(InboxNote $inboxNote): void
    {
        // التحليل الآن يتم في الـ controller مباشرة
        // No need to run analysis here to avoid duplication
    }

    /**
     * Handle the InboxNote "updated" event.
     */
    public function updated(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * Handle the InboxNote "deleted" event.
     */
    public function deleted(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * Handle the InboxNote "restored" event.
     */
    public function restored(InboxNote $inboxNote): void
    {
        //
    }

    /**
     * Handle the InboxNote "force deleted" event.
     */
    public function forceDeleted(InboxNote $inboxNote): void
    {
        //
    }

}
