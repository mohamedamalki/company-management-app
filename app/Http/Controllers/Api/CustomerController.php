<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Str;

class CustomerController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:customers.view',
                only: [
                    'index',
                    'show',
                    'active',
                ]
            ),

            new Middleware(
                'can:customers.manage',
                only: [
                    'store',
                    'update',
                ]
            ),
        ];
    }

    public function index(
        Request $request
    ): JsonResponse {
        $perPage = min(
            max(
                $request->integer(
                    'per_page',
                    15
                ),
                1
            ),
            100
        );

        $customers = Customer::query()
            ->with([
                'user:id,name,email,role,status',
            ])
            ->when(
                $request->filled('status'),
                fn (Builder $query) =>
                    $query->where(
                        'status',
                        $request->input('status')
                    )
            )
            ->when(
                $request->filled('category'),
                fn (Builder $query) =>
                    $query->where(
                        'category',
                        $request->input(
                            'category'
                        )
                    )
            )
            ->when(
                $request->filled('search'),
                function (
                    Builder $query
                ) use ($request) {
                    $search = trim(
                        $request->input(
                            'search'
                        )
                    );

                    $query->where(
                        function (
                            Builder $query
                        ) use ($search) {
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
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
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
            ->paginate($perPage)
            ->withQueryString();

        return response()->json(
            $customers
        );
    }

    public function active(): JsonResponse
    {
        $customers = Customer::query()
            ->select([
                'id',
                'code',
                'name',
                'category',
                'entity_type',
            ])
            ->where(
                'status',
                Customer::STATUS_ACTIVE
            )
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $customers,
        ]);
    }

    public function store(
        StoreCustomerRequest $request
    ): JsonResponse {
        $data = $request->validated();

        if (
            $data['category'] !==
            Customer::CATEGORY_FOURNISSEUR
        ) {
            $data['user_id'] = null;
        }

        $data['code'] =
            $this->generateCustomerCode();

        $data['status'] =
            $data['status']
            ?? Customer::STATUS_ACTIVE;

        $customer =
            Customer::create($data);

        return response()->json([
            'message' =>
                'Customer created successfully.',

            'data' => $customer->load(
                'user:id,name,email,role,status'
            ),
        ], 201);
    }

    public function show(
        Customer $customer
    ): JsonResponse {
        return response()->json([
            'data' => $customer->load([
                'user:id,name,email,role,status',
            ]),
        ]);
    }

    public function update(
        UpdateCustomerRequest $request,
        Customer $customer
    ): JsonResponse {
        $data = $request->validated();

        if (
            $data['category'] !==
            Customer::CATEGORY_FOURNISSEUR
        ) {
            $data['user_id'] = null;
        }

        $customer->update($data);

        return response()->json([
            'message' =>
                'Customer updated successfully.',

            'data' => $customer
                ->fresh()
                ->load(
                    'user:id,name,email,role,status'
                ),
        ]);
    }

    private function generateCustomerCode(): string
    {
        do {
            $code =
                'CUS-' .
                now()->format('Ymd') .
                '-' .
                Str::upper(
                    Str::random(6)
                );
        } while (
            Customer::query()
                ->where('code', $code)
                ->exists()
        );

        return $code;
    }
}
