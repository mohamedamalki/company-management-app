<?php

namespace App\Notifications;

use App\Models\ExpenseCategory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExpenseDueNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public ExpenseCategory $category)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
        'title' => 'Expense due today',

        'message' => "{$this->category->name} expense is due today.",

        'category_id' => $this->category->id,

        'category_name' => $this->category->name,

        'due_date' => $this->category->due_date,

        'url' => '/app/expenses/create?category=' . $this->category->id,
        ];
    }
}
