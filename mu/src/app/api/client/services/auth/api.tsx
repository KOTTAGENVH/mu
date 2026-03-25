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
  return await response.json();
}

//validate url token and generate cookie
export async function validateGenCookie(ip: string, token: string) {
  const response = await fetch("/api/services/validateURLToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token, ip: ip }),
  });
  return await response.json();
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

//logout user by clearing cookie
export async function logout() {
  const response = await fetch("/api/services/logout", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to logout");
  }
}

//delete user account and clear cookie
export async function deleteAccount() {
  const response = await fetch("/api/services/auth", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    const responseLogout = await logout();
    if (responseLogout.success) {
      return { success: true };
    } else {
      throw new Error("Failed to logout after account deletion");
    }
  } else {
    throw new Error("Failed to delete account and reset authenticator");
  }
}

export async function getIPAddress() {
  const response = await fetch("/api/services/ipChecker", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    const data = await response.json();
    return data.ip;
  } else {
    const errorData = await response.json().catch((err) => {
      // console.error("JSON Parsing Error:", err);
      return {};
    });
    throw new Error(errorData.message || "Failed to fetch IP address");
  }
}
