document.querySelector('#loginForm').addEventListener('submit', attemptLogin);
document.querySelector('#createAccount').addEventListener('click', beginAccountCreation);

const loginDialog = document.querySelector('#loginDialog');
const usernameDialog = document.querySelector('#usernameDialog');
const passwordDialog = document.querySelector('#passwordDialog');

async function attemptLogin(event) {

    event.preventDefault();

    let response;
    let result;
    let loginData = getLoginDataFromForm();

    if (loginData) {
        try {
            response = await fetch('index.php?c=user&a=login', {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            })

            if (!response.ok) throw new Error(`Response status: ${response.status}`)
        }
        catch (error) {
            console.log(error.message);
        }

        result = await response.json();

        if (result.message === 'Successfully logged in') {
            window.location = 'index.php';
        } else {
            document.querySelector('#errorMessageDisplay').innerText = result.message;
            alertLogin();
        }
    }
}

function getLoginDataFromForm() {
    let username = document.querySelector('#username').value;
    let password = document.querySelector('#password').value;

    if (username == '') {
        alertUsername();
        return false;
    }

    if (password == '') {
        alertPassword();
        return false;
    }

    return {
        'username': username,
        'password': password
    };
}

function beginAccountCreation(event) {
    event.preventDefault();

    loginDialog.removeAttribute('open');
    usernameDialog.setAttribute('open', '');
}

function alertUsername() {
    let alertRing = document.querySelector('#username').parentElement;

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertPassword() {
    let alertRing = document.querySelector('#password').parentElement;

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}

function alertLogin() {
    let alertRing = document.querySelector('dialog');

    alertRing.classList.add('validationError');
    setTimeout(() => {
        alertRing.classList.remove('validationError');
    }, 300);
}