<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <title>Salary Payslip</title>

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
            font-size: 24px;
            color: #0f172a;
        }

        .subtitle {
            margin: 4px 0 0;
            color: #64748b;
        }

        .section-title {
            margin: 24px 0 8px;
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
        }

        .details-table td:first-child {
            width: 35%;
            font-weight: bold;
            color: #475569;
        }

        .salary-table {
            margin-top: 10px;
        }

        .salary-table th,
        .salary-table td {
            padding: 10px;
            border: 1px solid #e2e8f0;
        }

        .salary-table th {
            background-color: #f1f5f9;
            color: #334155;
            text-align: left;
        }

        .salary-table td:last-child,
        .salary-table th:last-child {
            text-align: right;
        }

        .positive {
            color: #047857;
        }

        .negative {
            color: #dc2626;
        }

        .net-salary {
            margin-top: 18px;
            padding: 14px;
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            text-align: right;
            font-size: 17px;
            font-weight: bold;
            color: #1d4ed8;
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
        <h1>Salary Payslip</h1>

        <p class="subtitle">
            Salary period:
            {{ $salary->salary_month?->format('F Y') ?? '-' }}
        </p>
    </div>

    <h2 class="section-title">
        Employee information
    </h2>

    <table class="details-table">
        <tbody>
            <tr>
                <td>Employee</td>

                <td>
                    {{ $salary->employee?->first_name ?? '' }}
                    {{ $salary->employee?->last_name ?? '' }}
                </td>
            </tr>

            <tr>
                <td>Position</td>

                <td>
                    {{ $salary->employee?->position ?? '-' }}
                </td>
            </tr>

            <tr>
                <td>Payment date</td>

                <td>
                    {{ $salary->payment_date?->format('d F Y') ?? 'Not paid yet' }}
                </td>
            </tr>

            <tr>
                <td>Status</td>

                <td>
                    <span class="badge">
                        {{ str_replace('_', ' ', $salary->status ?? '-') }}
                    </span>
                </td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">
        Salary details
    </h2>

    <table class="salary-table">
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>

        <tbody>
            <tr>
                <td>Base salary</td>

                <td>
                    {{ number_format((float) $salary->base_salary, 2) }}
                    MAD
                </td>
            </tr>

            <tr>
                <td>Bonuses</td>

                <td class="positive">
                    +
                    {{ number_format((float) $salary->bonuses, 2) }}
                    MAD
                </td>
            </tr>

            <tr>
                <td>Deductions</td>

                <td class="negative">
                    -
                    {{ number_format((float) $salary->deductions, 2) }}
                    MAD
                </td>
            </tr>
        </tbody>
    </table>

    <div class="net-salary">
        Net salary:
        {{ number_format((float) $salary->net_salary, 2) }}
        MAD
    </div>

    <div class="footer">
        Generated on {{ now()->format('d F Y, H:i') }}
    </div>
</body>
</html>
