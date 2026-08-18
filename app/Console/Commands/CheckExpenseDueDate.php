<?php

namespace App\Console\Commands;

use App\Models\ExpenseCategory;
use App\Models\User;
use App\Notifications\ExpenseDueNotification;
use Illuminate\Console\Command;

class CheckExpenseDueDate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-expense-due-date';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
public function handle()
{
    $today = now()->day;

    $categories = ExpenseCategory::where('is_active', true)
        ->where('due_date', $today)
        ->get();

    $admins = User::where('role', 'admin')->get();

    $this->info("Today: {$today}");
    $this->info("Categories found: {$categories->count()}");
    $this->info("Admins found: {$admins->count()}");

    foreach ($categories as $category) {

        $this->info(
            "Category: {$category->name} - due date: {$category->due_date}"
        );

        foreach ($admins as $admin) {

            $alreadyNotified = $admin->notifications()
                ->where('type', ExpenseDueNotification::class)
                ->whereJsonContains(
                    'data->category_id',
                    $category->id
                )
                ->whereDate(
                    'created_at',
                    now()->toDateString()
                )
                ->exists();

            if (!$alreadyNotified) {

                $this->info(
                    "Sending notification: {$category->name} → {$admin->email}"
                );

                $admin->notify(
                    new ExpenseDueNotification($category)
                );

                $this->info("Notification sent.");
            } else {

                $this->info(
                    "Already notified: {$category->name} → {$admin->email}"
                );
            }
        }
    }

    $this->info('Finished.');
}
}
