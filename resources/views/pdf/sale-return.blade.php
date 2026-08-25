<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>
        Sale Return {{ $saleReturn->return_number }}
    </title>

    <style>
        @page {
            margin: 30px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1e293b;
            line-height: 1.5;
        }

        h1 {
            margin: 0 0 4px;
            font-size: 21px;
            color: #0f172a;
        }

        h3 {
            margin: 25px 0 8px;
            font-size: 15px;
            color: #0f172a;
        }

        .muted {
            margin: 0;
            color: #64748b;
            font-size: 11px;
        }

        .details-table,
        .products-table {
            width: 100%;
            border-collapse: collapse;
        }

        .details-table {
            margin-top: 22px;
        }

        .details-table td {
            padding: 7px 8px;
            border-bottom: 1px solid #e2e8f0;
        }

        .details-table td:first-child {
            width: 30%;
            font-weight: bold;
            color: #475569;
        }

        .products-table th,
        .products-table td {
            padding: 9px 8px;
            border: 1px solid #e2e8f0;
        }

        .products-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 11px;
            text-align: left;
        }

        .products-table .number {
            text-align: right;
        }

        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            background-color: #dcfce7;
            color: #166534;
            font-size: 10px;
            font-weight: bold;
            text-transform: capitalize;
        }

        .empty {
            padding: 15px;
            color: #64748b;
            text-align: center;
        }

        .total-container {
            margin-top: 20px;
            text-align: right;
        }

        .total {
            display: inline-block;
            padding: 10px 14px;
            background-color: #f1f5f9;
            color: #0f172a;
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>

<body>
    <h1>
        Sale Return {{ $saleReturn->return_number }}
    </h1>

    <p class="muted">
        Original sale:
        {{ $saleReturn->sale?->sale_number ?? '-' }}
    </p>

    <table class="details-table">
        <tbody>
            <tr>
                <td>Customer</td>

                <td>
                    {{ $saleReturn->sale?->customer?->name ?? 'Walk-in customer' }}
                </td>
            </tr>

            <tr>
                <td>Location</td>

                <td>
                    {{ $saleReturn->location?->name ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Date</td>

                <td>
                    {{ $saleReturn->created_at?->format('d M Y, H:i') ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Status</td>

                <td>
                    <span class="badge">
                        {{ str_replace('_', ' ', $saleReturn->status ?? '-') }}
                    </span>
                </td>
            </tr>

            <tr>
                <td>Refund</td>

                <td>
                    <span class="badge">
                        {{ str_replace('_', ' ', $saleReturn->refund_status ?? '-') }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>

    <h3>Returned products</h3>

    <table class="products-table">
        <thead>
            <tr>
                <th>Product</th>

                <th class="number">
                    Quantity
                </th>

                <th class="number">
                    Unit price
                </th>

                <th class="number">
                    Subtotal
                </th>
            </tr>
        </thead>

        <tbody>
            @forelse ($saleReturn->items as $item)
                <tr>
                    <td>
                        {{ $item->product?->name ?? $item->product_name ?? '-' }}
                    </td>

                    <td class="number">
                        {{ $item->quantity ?? 0 }}
                    </td>

                    <td class="number">
                        {{ number_format((float) ($item->unit_price ?? 0), 2) }}
                        MAD
                    </td>

                    <td class="number">
                        {{ number_format(
                            (float) (
                                $item->subtotal ??
                                (($item->quantity ?? 0) * ($item->unit_price ?? 0))
                            ),
                            2
                        ) }}
                        MAD
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" class="empty">
                        No returned products found.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="total-container">
        <span class="total">
            Total:
            {{ number_format((float) ($saleReturn->total_ttc ?? 0), 2) }}
            MAD
        </span>
    </div>
</body>
</html>
