<?php

/**
 * Plugin Name: Extended User Info REST API
 * Description: Adds last login, joined date, role, and capabilities to the REST API user endpoint.
 * Version: 1.0.0
 * Author: WordPress Developer Pro
 */

// Track last login
add_action('wp_login', function ($user_login, $user) {
    update_user_meta($user->ID, 'last_login', current_time('mysql'));
}, 10, 2);

// Extend REST API user data
add_action('rest_api_init', function () {
    register_rest_field('user', 'last_login', [
        'get_callback' => function ($user) {
            return get_user_meta($user['id'], 'last_login', true);
        },
        'schema' => [
            'description' => 'Last login time',
            'type'        => 'string',
            'format'      => 'date-time',
            'context'     => ['view', 'edit'],
        ],
    ]);

    register_rest_field('user', 'joined', [
        'get_callback' => function ($user) {
            $userdata = get_userdata($user['id']);
            return $userdata ? $userdata->user_registered : null;
        },
        'schema' => [
            'description' => 'User registration time',
            'type'        => 'string',
            'format'      => 'date-time',
            'context'     => ['view', 'edit'],
        ],
    ]);

    register_rest_field('user', 'role', [
        'get_callback' => function ($user) {
            $userdata = get_userdata($user['id']);
            return $userdata ? array_values($userdata->roles)[0] : null;
        },
        'schema' => [
            'description' => 'Primary user role',
            'type'        => 'string',
            'context'     => ['view', 'edit'],
        ],
    ]);

    register_rest_field('user', 'capabilities', [
        'get_callback' => function ($user) {
            $current_user_id = get_current_user_id();
            if ($current_user_id !== intval($user['id'])) {
                return new WP_Error('rest_forbidden', 'Cannot view capabilities of other users.', ['status' => 403]);
            }
            $userdata = get_userdata($user['id']);
            return $userdata ? $userdata->allcaps : [];
        },
        'schema' => [
            'description' => 'User capabilities',
            'type'        => 'object',
            'context'     => ['view', 'edit'],
        ],
    ]);

    register_rest_field('user', 'email', [
        'get_callback' => function ($user) {
            $userdata = get_userdata($user['id']);
            return $userdata ? $userdata->user_email : null;
        },
        'schema' => [
            'description' => 'User email address',
            'type'        => 'string',
            'format'      => 'email',
            'context'     => ['view', 'edit'],
        ],
    ]);
});
