<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class SaleReportController extends Controller
{
    public function __invoke(Request $request)
    {
        $filters = $request->validate([
            'status' => [
                'nullable',
                'in:draft,confirmed,cancelled',
            ],

            'payment_status' => [
                'nullable',
                'in:unpaid,partially_paid,paid',
            ],

            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'date_from' => [
                'nullable',
                'date_format:Y-m-d',
            ],

            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:date_from',
            ],
        ]);

        $query = Sale::query()
            ->with([
                'customer:id,name,category',
                'location:id,name,code',
            ])
            ->withCount('items');

        $this->applyLocationScope(
            $query,
            $request->user()
        );

        $sales = $query
            ->when(
                $filters['status'] ?? null,
                fn (Builder $query, string $status) =>
                    $query->where('status', $status)
            )
            ->when(
                $filters['payment_status'] ?? null,
                fn (
                    Builder $query,
                    string $paymentStatus
                ) => $query->where(
                    'payment_status',
                    $paymentStatus
                )
            )
            ->when(
                $filters['date_from'] ?? null,
                fn (
                    Builder $query,
                    string $dateFrom
                ) => $query->whereDate(
                    'sale_date',
                    '>=',
                    $dateFrom
                )
            )
            ->when(
                $filters['date_to'] ?? null,
                fn (
                    Builder $query,
                    string $dateTo
                ) => $query->whereDate(
                    'sale_date',
                    '<=',
                    $dateTo
                )
            )
            ->when(
                $filters['search'] ?? null,
                function (
                    Builder $query,
                    string $search
                ) {
                    $query->where(function (
                        Builder $query
                    ) use ($search) {
                        $query
                            ->where(
                                'sale_number',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhereHas(
                                'customer',
                                fn (Builder $customerQuery) =>
                                    $customerQuery->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    )
                            );
                    });
                }
            )
            ->latest('sale_date')
            ->get();

        $summary = [
            'sales_count' => $sales->count(),

            'subtotal_ht' => round(
                $sales->sum('subtotal_ht'),
                2
            ),

            'tax_total' => round(
                $sales->sum('tax_total'),
                2
            ),

            'total_ttc' => round(
                $sales->sum('total_ttc'),
                2
            ),

            'paid_amount' => round(
                $sales->sum('paid_amount'),
                2
            ),

            'remaining_amount' => round(
                $sales->sum(
                    fn (Sale $sale) => max(
                        (float) $sale->total_ttc -
                            (float) $sale->paid_amount,
                        0
                    )
                ),
                2
            ),
        ];

        $pdf = Pdf::loadView(
            'pdf.sales-report',
            [
                'sales' => $sales,
                'summary' => $summary,
                'dateFrom' =>
                    $filters['date_from'] ?? null,
                'dateTo' =>
                    $filters['date_to'] ?? null,
                'generatedAt' => now(),
            ]
        )->setPaper('a4', 'landscape');

        $filename = sprintf(
            'sales-report-%s-%s.pdf',
            $filters['date_from'] ?? 'all',
            $filters['date_to'] ?? 'all'
        );

        return $pdf->download($filename);
    }

    private function applyLocationScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->role === 'admin' ||
            $user->hasRole('admin')
        ) {
            return;
        }

        $locationIds = $user
            ->assignedLocations()
            ->pluck('locations.id');

        $query->whereIn(
            'location_id',
            $locationIds
        );
    }
}
