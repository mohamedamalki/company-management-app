<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salary extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'salary_month',
        'base_salary',
        'bonuses',
        'deductions',
        'net_salary',
        'payment_date',
        'status',
    ];

    protected $casts = [
        'salary_month' => 'date',
        'payment_date' => 'date',
        'base_salary' => 'decimal:2',
        'bonuses' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_salary' => 'decimal:2',
    ];

    /**
     * A salary belongs to an employee.
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function expense()
    {
        return $this->hasOne(Expense::class);
    }
}
