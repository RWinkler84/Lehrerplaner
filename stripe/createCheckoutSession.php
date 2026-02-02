<?php
require_once './vendor/autoload.php';

function createStripeSession($purchasedItem)
{

  $priceKeys = [
    'oneMonth' => 'price_1SvDkKLpFn8RdIowhOQVULIS',
    'oneYear' => 'price_1SvDnALpFn8RdIowJKqUrDCu'
  ];

  $stripe = new \Stripe\StripeClient([
    "api_key" => STRIPE_SECRET_KEY,
    "stripe_version" => "2025-12-15.clover"
  ]);
  header('Content-Type: application/json');

  $checkout_session = $stripe->checkout->sessions->create([
    'ui_mode' => 'custom',
    'invoice_creation' => ['enabled' => true],
    'line_items' => [[
      # Provide the exact Price ID (for example, price_1234) of the product you want to sell
      'price' => $priceKeys[$purchasedItem],
      'quantity' => 1,
    ]],
    'mode' => 'payment',
    'return_url' => YOUR_DOMAIN . 'stripe/complete.html?session_id={CHECKOUT_SESSION_ID}',
    'automatic_tax' => ['enabled' => true],
    'expires_at' => time() + (3600 * 2), // Configured to expire after 2 hours
    'metadata' => ['purchasedItem' => $purchasedItem]
  ]);

  storePurchaseAttempt($checkout_session->id, $purchasedItem);

  return $checkout_session;
}

function storePurchaseAttempt($checkoutSessionId, $purchasedItem)
{
  global $user;

  if (!is_null($checkoutSessionId) && !is_null($user)) {
    $user->storePurchaseAttempt($checkoutSessionId, $purchasedItem);
  }
}
