<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelExpenseRequest;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Location;
use App\Models\PaymentMethod;
use App\Models\Salary;
use App\Models\Supplier;
use App\Models\TaxRate;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class ExpenseController extends Controller implements HasMiddleware
{
    /*
    |--------------------------------------------------------------------------
    | Salary expense category code
    |--------------------------------------------------------------------------
    */

    private const SALARY_CATEGORY_CODE = 'SALARIES';

    /*
    |--------------------------------------------------------------------------
    | Middleware
    |--------------------------------------------------------------------------
    */

    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:expenses.view',
                only: ['index', 'show', 'options'],
            ),

            new Middleware(
                'can:expenses.manage',
                only: ['store', 'update'],
            ),

            new Middleware(
                'can:expenses.approve',
                only: ['approve', 'cancel'],
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Index
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max($request->integer('per_page', 15), 1),
            100
        );

        $query = Expense::query()->with([
            'category:id,name,code',
            'location:id,name,code,type',
            'supplier:id,name,code',
            'taxRate:id,name,code,rate',
            'salary.employee:id,first_name,last_name',
            'creator:id,name',
            'approver:id,name',
        ]);

        $this->applyLocationScope(
            $query,
            $request->user()
        );

        $expenses = $query
            ->when(
                $request->filled('status'),
                fn (Builder $query) =>
                    $query->where(
                        'status',
                        $request->input('status')
                    )
            )
            ->when(
                $request->filled('payment_status'),
                fn (Builder $query) =>
                    $query->where(
                        'payment_status',
                        $request->input('payment_status')
                    )
            )
            ->when(
                $request->filled('expense_category_id'),
                fn (Builder $query) =>
                    $query->where(
                        'expense_category_id',
                        $request->integer('expense_category_id')
                    )
            )
            ->when(
                $request->filled('location_id'),
                fn (Builder $query) =>
                    $query->where(
                        'location_id',
                        $request->integer('location_id')
                    )
            )
            ->when(
                $request->boolean('overdue'),
                fn (Builder $query) =>
                    $query->overdue()
            )
            ->when(
                $request->filled('date_from'),
                fn (Builder $query) =>
                    $query->whereDate(
                        'issue_date',
                        '>=',
                        $request->input('date_from')
                    )
            )
            ->when(
                $request->filled('date_to'),
                fn (Builder $query) =>
                    $query->whereDate(
                        'issue_date',
                        '<=',
                        $request->input('date_to')
                    )
            )
            ->when(
                $request->filled('search'),
                function (Builder $query) use ($request) {
                    $search = trim(
                        $request->input('search')
                    );

                    $query->where(function (Builder $query) use ($search) {
                        $query
                            ->where(
                                'expense_number',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'title',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhere(
                                'bill_reference',
                                'like',
                                "%{$search}%"
                            );
                    });
                }
            )
            ->latest('issue_date')
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($expenses);
    }

    /*
    |--------------------------------------------------------------------------
    | Options
    |--------------------------------------------------------------------------
    */

    public function options(Request $request): JsonResponse
    {
        $user = $request->user();

        $locations = $this->isAdmin($user)
            ? Location::query()
                ->where('status', 'active')
                ->select([
                    'id',
                    'name',
                    'code',
                    'type',
                ])
                ->orderBy('name')
                ->get()
            : $user
                ->assignedLocations()
                ->where(
                    'locations.status',
                    'active'
                )
                ->select([
                    'locations.id',
                    'locations.name',
                    'locations.code',
                    'locations.type',
                ])
                ->orderBy('locations.name')
                ->get();

        return response()->json([
            'data' => [

                'locations' => $locations,

                'categories' => ExpenseCategory::query()
                    ->active()
                    ->select([
                        'id',
                        'name',
                        'code',
                    ])
                    ->orderBy('name')
                    ->get(),

                'suppliers' => Supplier::query()
                    ->where('is_active', true)
                    ->select([
                        'id',
                        'name',
                        'code',
                    ])
                    ->orderBy('name')
                    ->get(),

                'tax_rates' => TaxRate::query()
                    ->where('status', 'active')
                    ->select([
                        'id',
                        'name',
                        'code',
                        'rate',
                    ])
                    ->orderBy('rate')
                    ->get(),

                'payment_methods' => PaymentMethod::query()
                    ->where('status', 'active')
                    ->select([
                        'id',
                        'name',
                        'code',
                        'requires_reference',
                    ])
                    ->orderBy('name')
                    ->get(),

                /*
                |--------------------------------------------------------------------------
                | Pending salaries
                |--------------------------------------------------------------------------
                */

                'salaries' => Salary::query()
                    ->with([
                        'employee:id,first_name,last_name',
                    ])
                    ->where('status', 'pending')
                    ->latest('salary_month')
                    ->get([
                        'id',
                        'employee_id',
                        'salary_month',
                        'base_salary',
                        'bonuses',
                        'deductions',
                        'net_salary',
                        'status',
                    ]),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Store
    |--------------------------------------------------------------------------
    */

    public function store(
        StoreExpenseRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $user = $request->user();

        $documentPath = null;

        if ($request->hasFile('document')) {
            $documentPath = $request
                ->file('document')
                ->store(
                    'expenses',
                    'public'
                );
        }

        try {
            $expense = DB::transaction(
                function () use (
                    $data,
                    $user,
                    $documentPath
                ) {
                    $locationId =
                        $data['location_id'] ?? null;

                    $this->ensureLocationAccess(
                        $user,
                        $locationId
                    );

                    $category =
                        $this->ensureCategoryIsActive(
                            (int) $data[
                                'expense_category_id'
                            ]
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | Salary validation
                    |--------------------------------------------------------------------------
                    */

                    $salary = $this->resolveSalary(
                        $category,
                        $data['salary_id'] ?? null
                    );

                    $taxRate = $this->resolveTaxRate(
                        $data['tax_rate_id'] ?? null
                    );

                    $totals = $this->calculateTotals(
                        (float) $data['amount_ht'],
                        $taxRate
                    );

                    return Expense::create([
                        'expense_number' =>
                            $this->generateExpenseNumber(),

                        'expense_category_id' =>
                            $data[
                                'expense_category_id'
                            ],

                        'salary_id' =>
                            $salary?->id,

                        'location_id' =>
                            $locationId,

                        'supplier_id' =>
                            $data['supplier_id'] ?? null,

                        'tax_rate_id' =>
                            $data['tax_rate_id'] ?? null,

                        'created_by' =>
                            $user->id,

                        'title' =>
                            $data['title'],

                        'bill_reference' =>
                            $data[
                                'bill_reference'
                            ] ?? null,

                        'issue_date' =>
                            $data['issue_date'],

                        ...$totals,

                        'paid_amount' => 0,

                        'payment_status' =>
                            Expense::PAYMENT_UNPAID,

                        'status' =>
                            Expense::STATUS_DRAFT,

                        'notes' =>
                            $data['notes'] ?? null,

                        'document_path' =>
                            $documentPath,
                    ]);
                }
            );
        } catch (Throwable $exception) {

            if ($documentPath) {
                Storage::disk('public')
                    ->delete($documentPath);
            }

            throw $exception;
        }

        return response()->json(
            [
                'message' =>
                    'Expense created successfully.',

                'data' =>
                    $this->loadExpense($expense),
            ],
            201
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Show
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        Expense $expense
    ): JsonResponse {
        $this->ensureLocationAccess(
            $request->user(),
            $expense->location_id
        );

        return response()->json([
            'data' =>
                $this->loadExpense($expense),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdateExpenseRequest $request,
        Expense $expense
    ): JsonResponse {

        $data = $request->validated();

        $user = $request->user();

        $newDocumentPath = null;

        if ($request->hasFile('document')) {
            $newDocumentPath = $request
                ->file('document')
                ->store(
                    'expenses',
                    'public'
                );
        }

        $oldDocumentPath =
            $expense->document_path;

        try {

            $expense = DB::transaction(
                function () use (
                    $data,
                    $user,
                    $expense,
                    $request,
                    $newDocumentPath
                ) {

                    $expense = Expense::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $expense->id
                        );

                    $this->ensureLocationAccess(
                        $user,
                        $expense->location_id
                    );

                    if (
                        $expense->status !==
                        Expense::STATUS_DRAFT
                    ) {
                        throw ValidationException::withMessages([
                            'status' =>
                                'Only draft expenses can be updated.',
                        ]);
                    }

                    $locationId =
                        array_key_exists(
                            'location_id',
                            $data
                        )
                            ? $data['location_id']
                            : $expense->location_id;

                    $this->ensureLocationAccess(
                        $user,
                        $locationId
                    );

                    $categoryId =
                        (int) (
                            $data[
                                'expense_category_id'
                            ] ??
                            $expense->expense_category_id
                        );

                    $category =
                        $this->ensureCategoryIsActive(
                            $categoryId
                        );

                    /*
                    |--------------------------------------------------------------------------
                    | Resolve salary
                    |--------------------------------------------------------------------------
                    */

                    $salaryId =
                        array_key_exists(
                            'salary_id',
                            $data
                        )
                            ? $data['salary_id']
                            : $expense->salary_id;

                    $salary =
                        $this->resolveSalary(
                            $category,
                            $salaryId
                        );

                    $taxRateId =
                        array_key_exists(
                            'tax_rate_id',
                            $data
                        )
                            ? $data['tax_rate_id']
                            : $expense->tax_rate_id;

                    $taxRate =
                        $this->resolveTaxRate(
                            $taxRateId
                        );

                    $amountHt =
                        (float) (
                            $data['amount_ht']
                            ?? $expense->amount_ht
                        );

                    $totals =
                        $this->calculateTotals(
                            $amountHt,
                            $taxRate
                        );

                    $documentPath =
                        $expense->document_path;

                    if (
                        $request->boolean(
                            'remove_document'
                        )
                    ) {
                        $documentPath = null;
                    }

                    if ($newDocumentPath) {
                        $documentPath =
                            $newDocumentPath;
                    }

                    $expense->update([

                        'expense_category_id' =>
                            $categoryId,

                        'salary_id' =>
                            $salary?->id,

                        'location_id' =>
                            $locationId,

                        'supplier_id' =>
                            array_key_exists(
                                'supplier_id',
                                $data
                            )
                                ? $data[
                                    'supplier_id'
                                ]
                                : $expense->supplier_id,

                        'tax_rate_id' =>
                            $taxRateId,

                        'title' =>
                            $data['title']
                            ?? $expense->title,

                        'bill_reference' =>
                            array_key_exists(
                                'bill_reference',
                                $data
                            )
                                ? $data[
                                    'bill_reference'
                                ]
                                : $expense->bill_reference,

                        'issue_date' =>
                            $data['issue_date']
                            ?? $expense->issue_date,

                        ...$totals,

                        'notes' =>
                            array_key_exists(
                                'notes',
                                $data
                            )
                                ? $data['notes']
                                : $expense->notes,

                        'document_path' =>
                            $documentPath,
                    ]);

                    return $expense;
                }
            );

        } catch (Throwable $exception) {

            if ($newDocumentPath) {
                Storage::disk('public')
                    ->delete(
                        $newDocumentPath
                    );
            }

            throw $exception;
        }

        if (
            $oldDocumentPath &&
            $oldDocumentPath !==
                $expense->document_path
        ) {
            Storage::disk('public')
                ->delete($oldDocumentPath);
        }

        return response()->json([
            'message' =>
                'Expense updated successfully.',

            'data' =>
                $this->loadExpense($expense),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Approve
    |--------------------------------------------------------------------------
    */

    public function approve(
        Request $request,
        Expense $expense
    ): JsonResponse {

        $expense = DB::transaction(
            function () use (
                $request,
                $expense
            ) {

                $expense = Expense::query()
                    ->lockForUpdate()
                    ->findOrFail(
                        $expense->id
                    );

                $this->ensureLocationAccess(
                    $request->user(),
                    $expense->location_id
                );

                if (
                    $expense->status !==
                    Expense::STATUS_DRAFT
                ) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Only draft expenses can be approved.',
                    ]);
                }

                $expense->update([
                    'status' =>
                        Expense::STATUS_APPROVED,

                    'approved_by' =>
                        $request->user()->id,

                    'approved_at' =>
                        now(),
                ]);

                return $expense;
            }
        );

        return response()->json([
            'message' =>
                'Expense approved successfully.',

            'data' =>
                $this->loadExpense($expense),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Cancel
    |--------------------------------------------------------------------------
    */

    public function cancel(
        CancelExpenseRequest $request,
        Expense $expense
    ): JsonResponse {

        $data = $request->validated();

        $expense = DB::transaction(
            function () use (
                $request,
                $expense,
                $data
            ) {

                $expense = Expense::query()
                    ->lockForUpdate()
                    ->findOrFail(
                        $expense->id
                    );

                $this->ensureLocationAccess(
                    $request->user(),
                    $expense->location_id
                );

                if (
                    $expense->status ===
                    Expense::STATUS_CANCELLED
                ) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'This expense is already cancelled.',
                    ]);
                }

                if (
                    $expense->payments()->exists()
                ) {
                    throw ValidationException::withMessages([
                        'payments' =>
                            'An expense with payments cannot be cancelled.',
                    ]);
                }

                $expense->update([
                    'status' =>
                        Expense::STATUS_CANCELLED,

                    'cancelled_by' =>
                        $request->user()->id,

                    'cancelled_at' =>
                        now(),

                    'cancellation_reason' =>
                        $data[
                            'cancellation_reason'
                        ],
                ]);

                return $expense;
            }
        );

        return response()->json([
            'message' =>
                'Expense cancelled successfully.',

            'data' =>
                $this->loadExpense($expense),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Mark Paid
    |--------------------------------------------------------------------------
    */

    public function markPaid(
        Expense $expense
    ): JsonResponse {

        $expense->update([
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        /*
        |--------------------------------------------------------------------------
        | Important:
        | If this expense belongs to a salary,
        | mark the salary as paid too.
        |--------------------------------------------------------------------------
        */

        if ($expense->salary_id) {
            Salary::whereKey(
                $expense->salary_id
            )->update([
                'status' => 'paid',
                'payment_date' => now(),
            ]);
        }

        return response()->json(
            $this->loadExpense($expense)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function calculateTotals(
        float $amountHt,
        float $taxRate
    ): array {

        $amountHt = round(
            $amountHt,
            2
        );

        $taxAmount = round(
            ($amountHt * $taxRate) / 100,
            2
        );

        return [
            'amount_ht' =>
                $amountHt,

            'tax_rate' =>
                $taxRate,

            'tax_amount' =>
                $taxAmount,

            'total_ttc' =>
                round(
                    $amountHt + $taxAmount,
                    2
                ),
        ];
    }

    private function resolveTaxRate(
        int|string|null $taxRateId
    ): float {

        if (!$taxRateId) {
            return 0;
        }

        $taxRate = TaxRate::query()
            ->where(
                'status',
                'active'
            )
            ->find($taxRateId);

        if (!$taxRate) {
            throw ValidationException::withMessages([
                'tax_rate_id' =>
                    'The selected TVA rate is invalid or inactive.',
            ]);
        }

        return round(
            (float) $taxRate->rate,
            4
        );
    }

    private function ensureCategoryIsActive(
        int $categoryId
    ): ExpenseCategory {

        $category =
            ExpenseCategory::query()
                ->active()
                ->whereKey($categoryId)
                ->first();

        if (!$category) {
            throw ValidationException::withMessages([
                'expense_category_id' =>
                    'The selected expense category is invalid or inactive.',
            ]);
        }

        return $category;
    }

    /**
     * Resolve the salary associated with this expense.
     */
    private function resolveSalary(
        ExpenseCategory $category,
        int|string|null $salaryId
    ): ?Salary {

        $isSalaryCategory =
            strtoupper(
                (string) $category->code
            ) === self::SALARY_CATEGORY_CODE;

        /*
        |--------------------------------------------------------------------------
        | Not a salary expense
        |--------------------------------------------------------------------------
        */

        if (!$isSalaryCategory) {

            if ($salaryId) {
                throw ValidationException::withMessages([
                    'salary_id' =>
                        'A salary can only be selected for a salary expense category.',
                ]);
            }

            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Salary category requires salary_id
        |--------------------------------------------------------------------------
        */

        if (!$salaryId) {
            throw ValidationException::withMessages([
                'salary_id' =>
                    'Please select a salary.',
            ]);
        }

        $salary = Salary::query()
            ->whereKey($salaryId)
            ->where(
                'status',
                'pending'
            )
            ->lockForUpdate()
            ->first();

        if (!$salary) {
            throw ValidationException::withMessages([
                'salary_id' =>
                    'The selected salary does not exist or is no longer pending.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent the same salary from being attached
        | to multiple expenses.
        |--------------------------------------------------------------------------
        */

        $alreadyUsed =
            Expense::query()
                ->where(
                    'salary_id',
                    $salary->id
                )
                ->where(
                    'status',
                    '!=',
                    Expense::STATUS_CANCELLED
                )
                ->exists();

        if ($alreadyUsed) {
            throw ValidationException::withMessages([
                'salary_id' =>
                    'This salary is already linked to an expense.',
            ]);
        }

        return $salary;
    }

    private function ensureLocationAccess(
        User $user,
        int|string|null $locationId
    ): void {

        if ($this->isAdmin($user)) {
            return;
        }

        if (!$locationId) {
            abort(
                403,
                'Only administrators can manage company-wide expenses.'
            );
        }

        $hasAccess =
            $user
                ->assignedLocations()
                ->whereKey(
                    (int) $locationId
                )
                ->exists();

        abort_unless(
            $hasAccess,
            403,
            'You are not assigned to this location.'
        );
    }

    private function applyLocationScope(
        Builder $query,
        User $user
    ): void {

        if ($this->isAdmin($user)) {
            return;
        }

        $query
            ->whereNotNull(
                'location_id'
            )
            ->whereIn(
                'location_id',
                $user
                    ->assignedLocations()
                    ->select(
                        'locations.id'
                    )
            );
    }

    private function isAdmin(
        User $user
    ): bool {

        return $user->role === 'admin'
            || $user->hasRole('admin');
    }

    private function generateExpenseNumber(): string
    {
        do {
            $number =
                'EXP-' .
                now()->format(
                    'Ymd-His'
                ) .
                '-' .
                Str::upper(
                    Str::random(6)
                );

        } while (
            Expense::query()
                ->where(
                    'expense_number',
                    $number
                )
                ->exists()
        );

        return $number;
    }

    private function loadExpense(
        Expense $expense
    ): Expense {

        return $expense->load([
            'category:id,name,code',

            'salary:id,employee_id,salary_month,base_salary,bonuses,deductions,net_salary,status',

            'salary.employee:id,first_name,last_name',

            'location:id,name,code,type',

            'supplier:id,name,code',

            'taxRate:id,name,code,rate',

            'creator:id,name',

            'approver:id,name',

            'canceller:id,name',

            'payments.paymentMethod:id,name,code',

            'payments.payer:id,name',
        ]);
    }
}
