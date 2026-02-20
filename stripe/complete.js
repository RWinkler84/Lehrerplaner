// ------- UI Resources -------
const SuccessIcon = `
    <div class="icon checkIcon"></div>
`;

const ErrorIcon = `
    <div class="icon crossIcon"></div>
`;


// ------- UI helpers -------
function setSessionDetails(session) {
  let statusText = "Sorry, da ist etwas schiefgelaufen. Bitte versuche es noch einmal.";
  let additionalInfo = "Möglicherweise ein Marderschaden. Wir prüfen das."

  let iconColor = "var(--matteRed)";
  let icon = ErrorIcon;

  document.querySelector('#details-table').classList.remove('notDisplayed');

  if (!session) {
    console.log("No session found");
    setErrorState();
    return;
  }

  switch (session.status) {
    case "complete":
      statusText = "Zahlung erfolgreich!";
      additionalInfo = "Danke für den Kauf einer Eduplanio Plus-Lizenz und danke für die Unterstützung dieses Projekts. Deine Lizenz wird aktiviert, sobald die Zahlung in unserem System registriert wurde. Normalerweise dauert das nur wenige Augenblicke."
      iconColor = "var(--matteGreen)";
      textColor = "var(--matteGreen)";
      icon = SuccessIcon;
      break;
    case "open":
      statusText = "Zahlung fehlgeschlagen!";
      additionalInfo = "Deine Zahlung wurde vom Zahlanbieter abgelehnt oder aus einem anderen Grund unterbrochen. Stelle bitte sicher, dass du ausreichend Guthaben für den Kauf hast und versuche es später noch einmal."
      iconColor = "var(--matteRed)";
      textColor = "var(--matteRed)";
      icon = ErrorIcon;
      break;
    default:
      break;
  }

  document.querySelector("#status-icon").style.backgroundColor = iconColor;
  document.querySelector("#status-icon").innerHTML = icon;
  document.querySelector("#status-text").style.color = textColor;
  document.querySelector("#status-text").textContent = statusText;
  document.querySelector("#additionalInfo").textContent = additionalInfo;
  document.querySelector("#intent-id").textContent = session.payment_intent_id;
  document.querySelector("#session-status").textContent = session.payment_status;
}

function setErrorState() {
  document.querySelector("#status-icon").style.backgroundColor = "var(--matteRed)";
  document.querySelector("#status-icon").innerHTML = ErrorIcon;
  document.querySelector("#status-text").style.color = "var(--matteRed)";
  document.querySelector("#status-text").textContent = "Sorry, da ist etwas schiefgelaufen. Bitte versuche es noch einmal.";
  document.querySelector("#additionalInfo").textContent = "Möglicherweise ein Marderschaden. Wir prüfen das.";
  document.querySelector("#details-table").classList.add("hidden");
  document.querySelector("#view-details").classList.add("hidden");
}

initialize();

async function initialize() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const sessionId = urlParams.get("session_id");
  if (!sessionId) {
    console.log("No session ID found");
    setErrorState();
    return;
  }
  const response = await fetch("../stripe/checkPaymentStatus.php", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ session_id: sessionId }),
  });
  const session = await response.json();

  setSessionDetails(session);
}

document.querySelector('#closeCheckoutDialogButton').addEventListener('click', () => window.close());