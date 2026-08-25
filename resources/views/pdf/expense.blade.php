<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>
        Expense {{ $expense->expense_number }}
    </title>

    <style>
        @page {
            margin: 35px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #1e293b;
            line-height: 1.5;
        }

        .header {
            padding-bottom: 18px;
            border-bottom: 2px solid #2563eb;
        }

        h1 {
            margin: 0;
            font-size: 23px;
            color: #0f172a;
        }

        .expense-number {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 11px;
        }

        .section-title {
            margin: 23px 0 8px;
            font-size: 15px;
            color: #0f172a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        .details-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }

        .details-table td:first-child {
            width: 32%;
            font-weight: bold;
            color: #475569;
        }

        .amount-table th,
        .amount-table td {
            padding: 10px;
            border: 1px solid #e2e8f0;
        }

        .amount-table th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
        }

        .amount-table th:last-child,
        .amount-table td:last-child {
            text-align: right;
        }

        .badge {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 4px;
            background-color: #dcfce7;
            color: #166534;
            font-size: 10px;
            font-weight: bold;
            text-transform: capitalize;
        }

        .payment-badge {
            background-color: #dbeafe;
            color: #1d4ed8;
        }

        .notes {
            padding: 12px;
            border: 1px solid #e2e8f0;
            background-color: #f8fafc;
            white-space: pre-line;
        }

        .total-box {
            margin-top: 18px;
            padding: 12px 14px;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            text-align: right;
        }

        .total {
            font-size: 17px;
            font-weight: bold;
            color: #1d4ed8;
        }

        .balance {
            margin-top: 3px;
            color: #475569;
            font-size: 12px;
        }

        .footer {
            position: fixed;
            right: 0;
            bottom: 0;
            left: 0;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 10px;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>
            {{ $expense->title }}
        </h1>

        <p class="expense-number">
            Expense number:
            {{ $expense->expense_number }}
        </p>
    </div>

    <h2 class="section-title">
        Expense information
    </h2>

    <table class="details-table">
        <tbody>
            <tr>
                <td>Category</td>

                <td>
                    {{ $expense->category?->name ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Location</td>

                <td>
                    {{ $expense->location?->name ?? 'Company-wide' }}
                </td>
            </tr>

            <tr>
                <td>Supplier</td>

                <td>
                    {{ $expense->supplier?->name ?? 'No supplier' }}
                </td>
            </tr>

            @if ($expense->salary)
                <tr>
                    <td>Employee</td>

                    <td>
                        {{ $expense->salary?->employee?->first_name ?? '' }}
                        {{ $expense->salary?->employee?->last_name ?? '' }}
                    </td>
                </tr>

                <tr>
                    <td>Salary month</td>

                    <td>
                        {{ $expense->salary?->salary_month?->format('F Y') ?? '-' }}
                    </td>
                </tr>
            @endif

            <tr>
                <td>Bill reference</td>

                <td>
                    {{ $expense->bill_reference ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Issue date</td>

                <td>
                    {{ $expense->issue_date?->format('d F Y') ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Approval status</td>

                <td>
                    <span class="badge">
                        {{ str_replace('_', ' ', $expense->status ?? '-') }}
                    </span>
                </td>
            </tr>

            <tr>
                <td>Payment status</td>

                <td>
                    <span class="badge payment-badge">
                        {{ str_replace('_', ' ', $expense->payment_status ?? '-') }}
                    </span>
                </td>
            </tr>

            <tr>
                <td>Created by</td>

                <td>
                    {{ $expense->creator?->name ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Approved by</td>

                <td>
                    {{ $expense->approver?->name ?? '-' }}
                </td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">
        Amount details
    </h2>

    <table class="amount-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td>Amount excluding tax</td>

                <td>
                    {{ number_format((float) $expense->amount_ht, 2) }}
                    MAD
                </td>
            </tr>

            <tr>
                <td>
                    Tax
                    ({{ number_format((float) $expense->tax_rate, 2) }}%)
                </td>

                <td>
                    {{ number_format((float) $expense->tax_amount, 2) }}
                    MAD
                </td>
            </tr>

            <tr>
                <td>Paid amount</td>

                <td>
                    {{ number_format((float) $expense->paid_amount, 2) }}
                    MAD
                </td>
            </tr>

            <tr>
                <td>Remaining amount</td>

                <td>
                    {{ number_format((float) $expense->remaining_amount, 2) }}
                    MAD
                </td>
            </tr>
        </tbody>
    </table>

    <div class="total-box">
        <div class="total">
            Total:
            {{ number_format((float) $expense->total_ttc, 2) }}
            MAD
        </div>

        <div class="balance">
            Balance:
            {{ number_format((float) $expense->remaining_amount, 2) }}
            MAD
        </div>
    </div>

    @if ($expense->notes)
        <h2 class="section-title">
            Notes
        </h2>

        <div class="notes">
            {{ $expense->notes }}
        </div>
    @endif

    <div class="footer">
        Generated on
        {{ now()->format('d F Y, H:i') }}
    </div>
</body>
</html>
