<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalaryRequest;
use App\Http\Requests\UpdateSalaryRequest;
use App\Models\Salary;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class SalaryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $salaries = Salary::with('employee')->latest()->get();
        return response()->json($salaries);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSalaryRequest $request)
    {
        $salary = Salary::create($request->validated());
        return response()->json([
            'message' => 'salary created successfully',
            'data' => $salary
        ],201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Salary $salary)
    {
        return response()->json([
            'data' => $salary->load('employee')
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSalaryRequest $request, Salary $salary)
    {
        $salary->update($request->validated());
        return response()->json([
            'message' => 'salary updated successfully',
            'data' => $salary
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Salary $salary)
    {
        $salary->delete();
        return response()->json([
            'message' => 'salary deleted successfully'
        ]);
    }

        public function downloadPdf(Salary $salary)
    {
        $salary->load('employee');

        $pdf = Pdf::loadView(
            'pdf.salary',
            [
                'salary' => $salary,
            ]
        )->setPaper('a4', 'portrait');

        $employeeName = $salary->employee
            ? "{$salary->employee->first_name}-{$salary->employee->last_name}"
            : 'employee';

        $month = $salary->salary_month
            ? $salary->salary_month->format('Y-m')
            : 'salary';

        return $pdf->download(
            "salary-{$employeeName}-{$month}.pdf"
        );
    }
}
