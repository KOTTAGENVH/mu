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

//update verification status after 1FA setup
export async function verifyAuthToken(token: string) {
  const response = await fetch("/api/services/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token }),
  });
  return await response.json();
}

//Verify cookie on protected routes
export async function verifyCookie() {
  const response = await fetch("/api/services/cookieChecker", {
    method: "POST",
    credentials: "include", 
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to verify cookie");
  }
}

//logout user by clearing cookie
export async function logout(all: boolean = false) {
  const response = await fetch(
    `/api/services/logout${all ? "?all=true" : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
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

//get all authentication insights
export async function getAuthInsights() {
  const response = await fetch("/api/services/authInsights", {
    method: "GET",
    credentials: "include",   
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) return await response.json();
  throw new Error("Failed to fetch auth insights");
}

// revoke a single session by id
export async function revokeSession(sessionId: string) {
  const response = await fetch("/api/services/authInsights", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  return await response.json();
}
