<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

// app/Http/Controllers/NotificationController.php
class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'data' => $request->user()->notifications()->latest()->limit(20)->get(),
        ]);
    }

    public function markAsRead(String $id, Request $request)
    {
        $request->user()->notifications()->where('id', $id)->first()?->markAsRead();
        return response()->noContent();
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->noContent();
    }
}
