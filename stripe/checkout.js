let params = new URLSearchParams(document.location.search);
let item = params.get('item');

const stripe = Stripe("pk_test_51SvDUXLpFn8RdIowYge53BQiMwxmZR6uMRpioveD7GepmHOVARNCcqrUHk2ewOwDcvdyZI3SzvPc1H0v72dhcZZb00HrwYy4P1");

let checkout;
let actions;
initialize();


const emailErrors = document.getElementById("email-errors");

const validateEmail = async (email) => {
    const updateResult = await actions.updateEmail(email);
    const isValid = updateResult.type !== "error";

    return { isValid, message: !isValid ? updateResult.error.message : null };
};

document.querySelector("#payment-form").addEventListener("submit", handleSubmit);
document.querySelector("#closeCheckoutDialogButton").addEventListener("click", () => window.close());


// Fetches a Checkout Session and captures the client secret
async function initialize() {
    const promise = fetch(`../index.php?c=abstract&a=createStripeSession&item=${item}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((r) => r.json())
        .then((r) => r.clientSecret);

    const appearance = {
        theme: 'stripe',
    };
    checkout = stripe.initCheckout({
        clientSecret: promise,
        elementsOptions: { appearance },
    });


    const loadActionsResult = await checkout.loadActions();
    if (loadActionsResult.type === 'success') {
        actions = loadActionsResult.actions;
        const session = loadActionsResult.actions.getSession();
        document.querySelector("#button-text").textContent = `Jetzt ${session.total.total.amount
            } zahlen`;
    }

    const paymentElement = checkout.createPaymentElement();
    paymentElement.mount("#payment-element");
}

async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const email = await getEmail();

    if (!email) {
        showMessage('Sorry! Der Server ist nicht erreichbar. Bitte versuche es später noch einmal.');
        document.querySelector('#submit').disabled = false;

        return;
        }

    const { isValid, message } = await validateEmail(email);
    if (!isValid) {
        emailErrors.textContent = message;
        showMessage(message);
        setLoading(false);
        return;
    }

    const { error } = await actions.confirm();

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    showMessage(error.message);

    setLoading(false);
}

async function getEmail() {
    try {
        let response = await fetch('../index.php?c=user&a=getUserInfo');

        if (!response.ok) {
            throw new Error('Sorry! Der Server ist nicht erreichbar. Bitte versuche es später noch einmal.');
        }

        let result = await response.json();

        return result.email;
    }
    catch (error) {
        showMessage(error.message);
    }
}

// ------- UI helpers -------

function showMessage(messageText) {
    const messageContainer = document.querySelector("#payment-message");

    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(function () {
        messageContainer.classList.add("hidden");
        messageContainer.textContent = "";
    }, 4000);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
    if (isLoading) {
        // Disable the button and show a spinner
        document.querySelector("#submit").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
    } else {
        document.querySelector("#submit").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
    }
}