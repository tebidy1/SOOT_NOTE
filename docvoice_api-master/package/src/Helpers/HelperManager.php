<?php

namespace LaraCore\Helpers;

class HelperManager
{
    protected $price;
    protected $file;
    protected $user;

    public function price(): PriceHelper
    {
        return $this->price ??= new PriceHelper();
    }

    public function file(): FileHelper
    {
        return $this->file ??= new FileHelper();
    }

    public function user(): UserHelper
    {
        return $this->user ??= new UserHelper();
    }
}
