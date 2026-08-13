<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFournisseurRequest;
use App\Http\Requests\UpdateFournisseurRequest;
use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class FournisseurController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:fournisseurs.view',
                only: [
                    'index',
                    'show',
                    'myAccount',
                ]
            ),

            new Middleware(
                'can:fournisseurs.manage',
                only: [
                    'store',
                    'update',
                ]
            ),
        ];
    }

    /**
     * Return a paginated fournisseurs list.
     */
    public function index(
        Request $request
    ): JsonResponse {
        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    15
                ),
                1
            ),
            100
        );

        $fournisseurs = Customer::query()
            ->fournisseurs()
            ->with([
                'user:id,name,email,role,status',
            ])
            ->withCount([
                'sales as sales_count' =>
                    function ($query) {
                        $query->where(
                            'status',
                            Sale::STATUS_CONFIRMED
                        );
                    },
            ])
            ->withSum([
                'sales as total_sales' =>
                    function ($query) {
                        $query->where(
                            'status',
                            Sale::STATUS_CONFIRMED
                        );
                    },
            ], 'total_ttc')
            ->withSum([
                'sales as total_paid' =>
                    function ($query) {
                        $query->where(
                            'status',
                            Sale::STATUS_CONFIRMED
                        );
                    },
            ], 'paid_amount')
            ->when(
                $request->filled('status'),
                function ($query) use ($request) {
                    $query->where(
                        'status',
                        $request->input('status')
                    );
                }
            )
            ->when(
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = trim(
                        $request->input('search')
                    );

                    $query->where(
                        function ($query) use ($search) {
                            $query
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'code',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'ice',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->latest()
            ->paginate($perPage);

        $fournisseurs
            ->getCollection()
            ->transform(
                function (
                    Customer $fournisseur
                ) {
                    $totalSales = (float) (
                        $fournisseur->total_sales
                        ?? 0
                    );

                    $totalPaid = (float) (
                        $fournisseur->total_paid
                        ?? 0
                    );

                    $fournisseur
                        ->remaining_amount = round(
                            max(
                                $totalSales -
                                    $totalPaid,
                                0
                            ),
                            2
                        );

                    return $fournisseur;
                }
            );

        return response()->json(
            $fournisseurs
        );
    }

    /**
     * Create a fournisseur account.
     */
    public function store(
        StoreFournisseurRequest $request
    ): JsonResponse {
        $data = $request->validated();

        // The frontend cannot choose another category.
        $data['category'] =
            Customer::CATEGORY_FOURNISSEUR;

        $data['status'] =
            $data['status']
            ?? Customer::STATUS_ACTIVE;

        $data['credit_limit'] =
            $data['credit_limit'] ?? 0;

        $data['payment_terms_days'] =
            $data['payment_terms_days'] ?? 0;

        $fournisseur = Customer::create(
            $data
        );

        return response()->json([
            'message' =>
                'Fournisseur created successfully.',

            'data' => $fournisseur->load([
                'user:id,name,email,role,status',
            ]),
        ], 201);
    }

    /**
     * Return one fournisseur.
     */
    public function show(
        Customer $fournisseur
    ): JsonResponse {
        $this->ensureIsFournisseur(
            $fournisseur
        );

        return $this->detailsResponse(
            $fournisseur
        );
    }

    /**
     * Update one fournisseur.
     */
    public function update(
        UpdateFournisseurRequest $request,
        Customer $fournisseur
    ): JsonResponse {
        $this->ensureIsFournisseur(
            $fournisseur
        );

        $data = $request->validated();

        // Prevent changing the record to a normal customer.
        unset($data['category']);

        $fournisseur->update($data);

        return response()->json([
            'message' =>
                'Fournisseur updated successfully.',

            'data' => $fournisseur
                ->fresh()
                ->load([
                    'user:id,name,email,role,status',
                ]),
        ]);
    }

    /**
     * Return the authenticated fournisseur account.
     */
    public function myAccount(
        Request $request
    ): JsonResponse {
        $fournisseur = $request
            ->user()
            ->fournisseurAccount()
            ->firstOrFail();

        return $this->detailsResponse(
            $fournisseur
        );
    }

    /**
     * Return fournisseur details and account summary.
     */
    private function detailsResponse(
        Customer $fournisseur
    ): JsonResponse {
        $fournisseur->load([
            'user:id,name,email,role,status',

            'sales' => function ($query) {
                $query
                    ->with([
                        'location:id,name,code',
                    ])
                    ->latest()
                    ->limit(20);
            },
        ]);

        $confirmedSales = $fournisseur
            ->sales()
            ->where(
                'status',
                Sale::STATUS_CONFIRMED
            );

        $ordersCount = (
            clone $confirmedSales
        )->count();

        $totalSales = (float) (
            clone $confirmedSales
        )->sum('total_ttc');

        $totalPaid = (float) (
            clone $confirmedSales
        )->sum('paid_amount');

        $remainingAmount = round(
            max(
                $totalSales - $totalPaid,
                0
            ),
            2
        );

        $creditLimit = (float) (
            $fournisseur->credit_limit
            ?? 0
        );

        $availableCredit = round(
            max(
                $creditLimit -
                    $remainingAmount,
                0
            ),
            2
        );

        return response()->json([
            'data' => [
                'fournisseur' =>
                    $fournisseur,

                'summary' => [
                    'orders_count' =>
                        $ordersCount,

                    'total_sales' =>
                        round(
                            $totalSales,
                            2
                        ),

                    'total_paid' =>
                        round(
                            $totalPaid,
                            2
                        ),

                    'remaining_amount' =>
                        $remainingAmount,

                    'credit_limit' =>
                        $creditLimit,

                    'available_credit' =>
                        $availableCredit,
                ],
            ],
        ]);
    }

    /**
     * Ensure that the customer is a fournisseur.
     */
    private function ensureIsFournisseur(
        Customer $customer
    ): void {
        abort_unless(
            $customer->category ===
                Customer::CATEGORY_FOURNISSEUR,
            404,
            'Fournisseur not found.'
        );
    }
}
