<?php
/**
 * MotoMaster Google Sign-In configuration.
 *
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create an "OAuth 2.0 Client ID" of type "Web application".
 * 3. Add http://localhost to "Authorized JavaScript origins".
 * 4. Paste the Client ID below.
 */

define('GOOGLE_CLIENT_ID', '185505003646-p5eqg6or5qevfd0d327abqboj9vvldta.apps.googleusercontent.com');

/**
 * When true, a Google account with no existing record gets an account
 * created automatically on first sign-in (acts as "Sign up with Google").
 * Set GOOGLE_AUTH_AUTO_PROVISION_ADMINS to false to only allow Google
 * sign-in for admin emails that are already registered.
 */
define('GOOGLE_AUTH_AUTO_PROVISION_STUDENTS', true);
define('GOOGLE_AUTH_AUTO_PROVISION_TEACHERS', true);
define('GOOGLE_AUTH_AUTO_PROVISION_ADMINS', true);
