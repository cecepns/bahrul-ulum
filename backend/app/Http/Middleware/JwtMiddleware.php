<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use App\Models\User;

class JwtMiddleware
{
    public function handle($request, Closure $next)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            $token = $request->input('token');
        }

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Token not provided.'
            ], 401);
        }

        // Bearer token check
        if (strpos($token, 'Bearer ') === 0) {
            $token = substr($token, 7);
        }

        try {
            $secret = env('JWT_SECRET');
            $credentials = JWT::decode($token, new Key($secret, 'HS256'));
            
            // Check if user exists
            $user = User::find($credentials->sub);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 401);
            }

            // Attach user to request
            $request->auth = $user;
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired token: ' . $e->getMessage()
            ], 401);
        }

        return $next($request);
    }
}
