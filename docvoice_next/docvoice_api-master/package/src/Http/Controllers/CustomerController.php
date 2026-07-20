<?php

declare(strict_types=1);

namespace LaraCore\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Requests\CustomerRequest as EntityRequest;
use LaraCore\Models\Customer as EntityModel;
use LaraCore\Traits\ControllerOperationsTrait;

class CustomerController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['name', 'email', 'phone', 'company', 'address'], // حقول البحث
        'default_relations' => ['orders', 'invoices'],                       // العلاقات الافتراضية
        'model_class' => EntityModel::class,                                 // فئة النموذج
        'request_class' => EntityRequest::class,                             // فئة الطلب
    ];




    /**
     * معالجة البيانات والملفات
     *
     * @param array<string, mixed> $data
     * @param EntityModel|null $entity
     * @param Request|null $request
     * @return EntityModel
     */
    protected function attach(array $data, ?EntityModel $entity = null, ?Request $request = null): EntityModel
    {
        if (is_null($entity)) {
            $entity = new EntityModel();
        }

        // ملء البيانات الأساسية
        $entity->fill($data);

        // إضافة معرف المستخدم الحالي إذا لم يكن موجوداً
        if (!$entity->user_id && auth()->check()) {
            $entity->user_id = auth()->id();
        }

        // تعيين رقم العميل التلقائي للعملاء الجدد
        if (!$entity->exists && !$entity->customer_number) {
            $entity->customer_number = 'CUST-' . str_pad((string)(EntityModel::max('id') + 1), 6, '0', STR_PAD_LEFT);
        }

        // حفظ النموذج
        $entity->save();

        // معالجة رفع الملفات إذا وجدت
        if ($request && $request->hasFile('avatar')) {
            // استخدام FileHandlerTrait إذا كان متوفراً
            // $this->uploadFile($request->file('avatar'), $entity, 'avatar');
        }

        // معالجة العلاقات - ربط العميل بالمجموعات
        if (isset($data['groups']) && is_array($data['groups'])) {
            // $entity->groups()->sync($data['groups']);
        }

        // معالجة العناوين المتعددة
        if (isset($data['addresses']) && is_array($data['addresses'])) {
            // $entity->addresses()->delete(); // حذف العناوين القديمة
            // foreach ($data['addresses'] as $address) {
            //     $entity->addresses()->create($address);
            // }
        }

        // تحديث حالة VIP بناءً على إجمالي الطلبات
        if ($entity->exists) {
            $totalOrders = $entity->orders()->sum('total');
            $entity->is_vip = $totalOrders > 10000; // العميل مميز إذا تجاوزت طلباته 10,000
            $entity->save();
        }

        // تحميل العلاقات للاستجابة
        $entity->load(static::CONFIG['default_relations']);

        return $entity;
    }
}
