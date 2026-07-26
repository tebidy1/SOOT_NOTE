<?php

namespace LaraCore\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use Illuminate\Http\JsonResponse;

use LaraCore\Http\Requests\BaseRequest;
use LaraCore\Traits\ResponseTrait;
use LaraCore\Traits\FileHandlerTrait;
use LaraCore\Traits\QueryFilterTrait;
use LaraCore\Traits\NotificationTrait;
use LaraCore\Traits\ControllerOperationsTrait;
class BaseController extends Controller
{
    use ControllerOperationsTrait,ResponseTrait, FileHandlerTrait, QueryFilterTrait, NotificationTrait;






    }
