//Check if user registered to an authenticator app
export async function checkAuthStatus() {
  const response = await fetch("/api/services/auth", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to fetch auth status");
  }
}

//update verification status after 2FA setup
export async function verifyAuthToken(ip: string, token: string) {
  const response = await fetch("/api/services/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, ip }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to update verification status");
  }
}


//validate url token and generate cookie
export async function validateGenCookie(ip: string, token: string) {
  const response = await fetch("/api/services/validateURLToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, ip: ip }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to validate URL token and generate cookie");
  }
}

//Verify cookie on protected routes
export async function verifyCookie() {
  const response = await fetch("/api/services/cookieChecker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to verify cookie");
  }
}