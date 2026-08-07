<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Purchase Order {{ $purchaseOrder->order_number }}</title>

    <style>
        @page {
            margin: 30px 34px 55px;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "DejaVu Sans", sans-serif;
            font-size: 11px;
            line-height: 1.45;
            color: #1e293b;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table {
            margin-bottom: 24px;
        }

        .header-table td {
            vertical-align: top;
        }

        .company-cell {
            width: 58%;
        }

        .document-cell {
            width: 42%;
            text-align: right;
        }

        .logo {
            max-width: 115px;
            max-height: 55px;
            margin-bottom: 8px;
        }

        .company-name {
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
        }

        .company-details {
            margin-top: 4px;
            color: #64748b;
        }

        .document-title {
            margin: 0;
            font-size: 23px;
            font-weight: bold;
            letter-spacing: 0.5px;
            color: #0f172a;
        }

        .order-number {
            margin-top: 5px;
            font-size: 13px;
            font-weight: bold;
            color: #2563eb;
        }

        .status {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-draft {
            background: #fef3c7;
            color: #92400e;
        }

        .status-ordered {
            background: #dbeafe;
            color: #1d4ed8;
        }

        .status-partially_received {
            background: #ede9fe;
            color: #6d28d9;
        }

        .status-received {
            background: #dcfce7;
            color: #166534;
        }

        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }

        .information-table {
            margin-bottom: 24px;
        }

        .information-table td {
            width: 50%;
            padding: 13px;
            vertical-align: top;
            border: 1px solid #cbd5e1;
        }

        .information-table td:first-child {
            border-right: 0;
        }

        .section-label {
            margin-bottom: 7px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #64748b;
        }

        .primary-value {
            margin-bottom: 3px;
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
        }

        .detail-line {
            margin-top: 2px;
            color: #475569;
        }

        .meta-table {
            margin-bottom: 24px;
            border: 1px solid #cbd5e1;
        }

        .meta-table td {
            width: 33.333%;
            padding: 10px 12px;
            vertical-align: top;
            border-right: 1px solid #cbd5e1;
        }

        .meta-table td:last-child {
            border-right: 0;
        }

        .meta-label {
            margin-bottom: 3px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
        }

        .meta-value {
            font-weight: bold;
            color: #0f172a;
        }

        .items-table {
            margin-bottom: 18px;
        }

        .items-table thead {
            display: table-header-group;
        }

        .items-table tr {
            page-break-inside: avoid;
        }

        .items-table th {
            padding: 9px 7px;
            background: #0f172a;
            border: 1px solid #0f172a;
            font-size: 8px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #ffffff;
        }

        .items-table td {
            padding: 9px 7px;
            border: 1px solid #cbd5e1;
            vertical-align: top;
        }

        .items-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        .number {
            text-align: right !important;
            white-space: nowrap;
        }

        .center {
            text-align: center !important;
        }

        .product-name {
            font-weight: bold;
            color: #0f172a;
        }

        .product-reference {
            margin-top: 2px;
            font-size: 9px;
            color: #64748b;
        }

        .summary-table {
            width: 43%;
            margin-left: 57%;
            margin-bottom: 22px;
        }

        .summary-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #cbd5e1;
        }

        .summary-label {
            color: #475569;
        }

        .summary-value {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
            color: #0f172a;
        }

        .grand-total td {
            padding-top: 11px;
            padding-bottom: 11px;
            background: #eff6ff;
            border-top: 2px solid #2563eb;
            border-bottom: 2px solid #2563eb;
            font-size: 13px;
            font-weight: bold;
            color: #1d4ed8;
        }

        .notes {
            margin-top: 4px;
            margin-bottom: 25px;
            padding: 12px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            page-break-inside: avoid;
        }

        .notes-title {
            margin-bottom: 5px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            color: #64748b;
        }

        .signature-table {
            margin-top: 34px;
            page-break-inside: avoid;
        }

        .signature-table td {
            width: 33.333%;
            padding: 0 14px;
            text-align: center;
            vertical-align: bottom;
        }

        .signature-line {
            height: 52px;
            border-bottom: 1px solid #64748b;
        }

        .signature-label {
            padding-top: 6px;
            font-size: 9px;
            color: #64748b;
        }

        .footer {
            position: fixed;
            right: 0;
            bottom: -35px;
            left: 0;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            font-size: 8px;
            text-align: center;
            color: #64748b;
        }
    </style>
</head>

<body>
    @php
        $statusLabels = [
            'draft' => 'Draft',
            'ordered' => 'Ordered',
            'partially_received' => 'Partially received',
            'received' => 'Received',
            'cancelled' => 'Cancelled',
        ];

        $orderDate = $purchaseOrder->order_date
            ? \Illuminate\Support\Carbon::parse($purchaseOrder->order_date)->format('d/m/Y')
            : '-';

        $expectedDate = $purchaseOrder->expected_date
            ? \Illuminate\Support\Carbon::parse($purchaseOrder->expected_date)->format('d/m/Y')
            : '-';
    @endphp

    <div class="footer">
        Generated on {{ now()->format('d/m/Y H:i') }}
        &nbsp;—&nbsp;
        {{ config('app.name', 'Company Management') }}
        &nbsp;—&nbsp;
        Purchase order {{ $purchaseOrder->order_number }}
    </div>

    <table class="header-table">
        <tr>
            <td class="company-cell">
                @if (file_exists(public_path('images/company-logo.png')))
                    <img
                        class="logo"
                        src="{{ public_path('images/company-logo.png') }}"
                        alt="Company logo"
                    >
                @endif

                <h1 class="company-name">
                    {{ config('app.name', 'Company Management') }}
                </h1>

                <div class="company-details">
                    @if (config('company.address'))
                        <div>{{ config('company.address') }}</div>
                    @endif

                    @if (config('company.phone'))
                        <div>Phone: {{ config('company.phone') }}</div>
                    @endif

                    @if (config('company.email'))
                        <div>Email: {{ config('company.email') }}</div>
                    @endif

                    @if (config('company.ice'))
                        <div>ICE: {{ config('company.ice') }}</div>
                    @endif
                </div>
            </td>

            <td class="document-cell">
                <h2 class="document-title">PURCHASE ORDER</h2>

                <div class="order-number">
                    {{ $purchaseOrder->order_number }}
                </div>

                <span class="status status-{{ $purchaseOrder->status }}">
                    {{ $statusLabels[$purchaseOrder->status] ?? ucfirst($purchaseOrder->status) }}
                </span>
            </td>
        </tr>
    </table>

    <table class="information-table">
        <tr>
            <td>
                <div class="section-label">Supplier</div>

                <div class="primary-value">
                    {{ $purchaseOrder->supplier?->name ?? 'Supplier unavailable' }}
                </div>

                @if ($purchaseOrder->supplier?->code)
                    <div class="detail-line">
                        Code: {{ $purchaseOrder->supplier->code }}
                    </div>
                @endif

                @if ($purchaseOrder->supplier?->contact_name)
                    <div class="detail-line">
                        Contact: {{ $purchaseOrder->supplier->contact_name }}
                    </div>
                @endif

                @if ($purchaseOrder->supplier?->phone)
                    <div class="detail-line">
                        Phone: {{ $purchaseOrder->supplier->phone }}
                    </div>
                @endif

                @if ($purchaseOrder->supplier?->email)
                    <div class="detail-line">
                        Email: {{ $purchaseOrder->supplier->email }}
                    </div>
                @endif

                @if ($purchaseOrder->supplier?->address)
                    <div class="detail-line">
                        Address: {{ $purchaseOrder->supplier->address }}
                    </div>
                @endif

                @if ($purchaseOrder->supplier?->ice)
                    <div class="detail-line">
                        ICE: {{ $purchaseOrder->supplier->ice }}
                    </div>
                @endif
            </td>

            <td>
                <div class="section-label">Delivery location</div>

                <div class="primary-value">
                    {{ $purchaseOrder->location?->name ?? 'Location unavailable' }}
                </div>

                @if ($purchaseOrder->location?->code)
                    <div class="detail-line">
                        Code: {{ $purchaseOrder->location->code }}
                    </div>
                @endif

                @if ($purchaseOrder->location?->type)
                    <div class="detail-line">
                        Type: {{ ucfirst($purchaseOrder->location->type) }}
                    </div>
                @endif

                @if ($purchaseOrder->location?->address)
                    <div class="detail-line">
                        Address: {{ $purchaseOrder->location->address }}
                    </div>
                @endif

                @if ($purchaseOrder->location?->phone)
                    <div class="detail-line">
                        Phone: {{ $purchaseOrder->location->phone }}
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td>
                <div class="meta-label">Order date</div>
                <div class="meta-value">{{ $orderDate }}</div>
            </td>

            <td>
                <div class="meta-label">Expected delivery</div>
                <div class="meta-value">{{ $expectedDate }}</div>
            </td>

            <td>
                <div class="meta-label">Created by</div>
                <div class="meta-value">
                    {{ $purchaseOrder->createdBy?->name ?? '-' }}
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;" class="center">#</th>
                <th style="width: 28%;">Product</th>
                <th style="width: 10%;" class="center">Unit</th>
                <th style="width: 11%;" class="number">Quantity</th>
                <th style="width: 15%;" class="number">Unit price HT</th>
                <th style="width: 9%;" class="number">TVA</th>
                <th style="width: 22%;" class="number">Total TTC</th>
            </tr>
        </thead>

        <tbody>
            @forelse ($purchaseOrder->items as $item)
                @php
                    $quantity = rtrim(
                        rtrim(
                            number_format((float) $item->quantity, 3, '.', ''),
                            '0'
                        ),
                        '.'
                    );
                @endphp

                <tr>
                    <td class="center">{{ $loop->iteration }}</td>

                    <td>
                        <div class="product-name">
                            {{ $item->product?->name ?? 'Product unavailable' }}
                        </div>

                        <div class="product-reference">
                            Ref: {{ $item->product?->reference ?? '-' }}
                        </div>
                    </td>

                    <td class="center">
                        {{ $item->product?->unit ?? '-' }}
                    </td>

                    <td class="number">{{ $quantity }}</td>

                    <td class="number">
                        {{ number_format((float) $item->unit_price_ht, 2, ',', ' ') }}
                        MAD
                    </td>

                    <td class="number">
                        {{ number_format((float) $item->tax_rate, 2, ',', ' ') }}%
                    </td>

                    <td class="number">
                        {{ number_format((float) $item->line_total_ttc, 2, ',', ' ') }}
                        MAD
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="center">
                        No products in this purchase order.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="summary-table">
        <tr>
            <td class="summary-label">Subtotal HT</td>
            <td class="summary-value">
                {{ number_format((float) $purchaseOrder->subtotal_ht, 2, ',', ' ') }}
                MAD
            </td>
        </tr>

        <tr>
            <td class="summary-label">TVA</td>
            <td class="summary-value">
                {{ number_format((float) $purchaseOrder->tax_amount, 2, ',', ' ') }}
                MAD
            </td>
        </tr>

        <tr class="grand-total">
            <td>Total TTC</td>
            <td class="summary-value">
                {{ number_format((float) $purchaseOrder->total_ttc, 2, ',', ' ') }}
                MAD
            </td>
        </tr>
    </table>

    @if ($purchaseOrder->notes)
        <div class="notes">
            <div class="notes-title">Notes</div>
            <div>{{ $purchaseOrder->notes }}</div>
        </div>
    @endif

    <table class="signature-table">
        <tr>
            <td>
                <div class="signature-line"></div>
                <div class="signature-label">Prepared by</div>
            </td>

            <td>
                <div class="signature-line"></div>
                <div class="signature-label">Approved by</div>
            </td>

            <td>
                <div class="signature-line"></div>
                <div class="signature-label">Supplier confirmation</div>
            </td>
        </tr>
    </table>
</body>
</html>
