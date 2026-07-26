<?php

namespace Database\Factories;

use App\Models\PayrollRun;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollRunFactory extends Factory
{
    protected $model = PayrollRun::class;

    public function definition(): array
    {
        $year = $this->faker->numberBetween(2024, 2026);
        $month = $this->faker->numberBetween(1, 12);
        $period = sprintf('%d-%02d', $year, $month);

        $monthNames = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
        ];

        $periodName = 'رواتب شهر ' . $monthNames[$month] . ' ' . $year;

        return [
            'period' => $period,
            'period_name' => $periodName,
            'working_days' => $this->faker->numberBetween(20, 31),
            'status' => $this->faker->randomElement(['draft', 'approved', 'paid', 'cancelled']),
            'summary' => [
                'total_drivers' => $this->faker->numberBetween(5, 20),
                'total_net_salaries' => $this->faker->randomFloat(2, 50000, 200000),
                'total_working_days' => $this->faker->numberBetween(100, 500),
                'total_absence_days' => $this->faker->numberBetween(0, 50)
            ]
        ];
    }
}
