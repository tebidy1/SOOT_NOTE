<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'domain' => $this->domain,
            'invitation_code' => $this->invitation_code,
            'code' => $this->code, // كود الدعوة (hash لرقم الشركة)
            'plan_type' => $this->plan_type,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'users' => $this->whenLoaded('users'),
            'workspaces' => $this->whenLoaded('workspaces'),
        ];
    }
}
