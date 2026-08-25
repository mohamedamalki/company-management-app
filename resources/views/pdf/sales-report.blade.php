<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 11px;
        }

        h1 {
            margin-bottom: 5px;
        }

        .muted {
            color: #64748b;
        }

        .summary {
            width: 100%;
            margin: 22px 0;
            border-collapse: separate;
            border-spacing: 8px;
        }

        .summary td {
            padding: 12px;
            background: #f1f5f9;
            border-radius: 6px;
        }

        .summary strong {
            display: block;
            margin-top: 5px;
            font-size: 14px;
        }

        .sales {
            width: 100%;
            border-collapse: collapse;
        }

        .sales th {
            padding: 9px;
            background: #e2e8f0;
            text-align: left;
        }

        .sales td {
            padding: 9px;
            border-bottom: 1px solid #e2e8f0;
        }

        .right {
            text-align: right;
        }
    </style>
</head>

<body>
    <h1>Sales report</h1>

    <p class="muted">
        Period:
        {{ $dateFrom ?: 'Beginning' }}
        —
        {{ $dateTo ?: 'Today' }}
    </p>

    <p class="muted">
        Generated:
        {{ $generatedAt->format('d/m/Y H:i') }}
    </p>

    <table class="summary">
        <tr>
            <td>
                Sales
                <strong>{{ $summary['sales_count'] }}</strong>
            </td>

            <td>
                Total HT
                <strong>
                    {{ number_format($summary['subtotal_ht'], 2, ',', ' ') }}
                    MAD
                </strong>
            </td>

            <td>
                TVA
                <strong>
                    {{ number_format($summary['tax_total'], 2, ',', ' ') }}
                    MAD
                </strong>
            </td>

            <td>
                Total TTC
                <strong>
                    {{ number_format($summary['total_ttc'], 2, ',', ' ') }}
                    MAD
                </strong>
            </td>

            <td>
                Remaining
                <strong>
                    {{ number_format($summary['remaining_amount'], 2, ',', ' ') }}
                    MAD
                </strong>
            </td>
        </tr>
    </table>

    <table class="sales">
        <thead>
            <tr>
                <th>Sale</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Location</th>
                <th class="right">HT</th>
                <th class="right">TVA</th>
                <th class="right">TTC</th>
                <th class="right">Paid</th>
                <th class="right">Remaining</th>
                <th>Status</th>
            </tr>
        </thead>

        <tbody>
            @forelse ($sales as $sale)
                @php
                    $remaining = max(
                        (float) $sale->total_ttc -
                        (float) $sale->paid_amount,
                        0
                    );
                @endphp

                <tr>
                    <td>{{ $sale->sale_number }}</td>

                    <td>
                        {{ date('d/m/Y H:i', strtotime($sale->sale_date)) }}
                    </td>

                    <td>
                        {{ $sale->customer?->name ?? 'Walk-in customer' }}
                    </td>

                    <td>
                        {{ $sale->location?->name ?? '-' }}
                    </td>

                    <td class="right">
                        {{ number_format($sale->subtotal_ht, 2, ',', ' ') }}
                    </td>

                    <td class="right">
                        {{ number_format($sale->tax_total, 2, ',', ' ') }}
                    </td>

                    <td class="right">
                        {{ number_format($sale->total_ttc, 2, ',', ' ') }}
                    </td>

                    <td class="right">
                        {{ number_format($sale->paid_amount, 2, ',', ' ') }}
                    </td>

                    <td class="right">
                        {{ number_format($remaining, 2, ',', ' ') }}
                    </td>

                    <td>
                        {{ ucfirst(str_replace('_', ' ', $sale->status)) }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="10">
                        No sales found for this period.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
