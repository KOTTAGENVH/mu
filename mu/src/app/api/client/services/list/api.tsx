//add wishlist
export async function addWishlist(name: string) {
  const response = await fetch(`/api/services/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to add wishlist");
  }
}

//get wishlists
export async function getWishlists() {
  const response = await fetch(`/api/services/list`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch wishlists");
  }
}

//delete wishlist
export async function deleteWishlist(id: string) {
  const response = await fetch(`/api/services/list`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete wishlist");
  }
}

//update wishlist
export async function updateWishlist(id: string, name: string) {
  const response = await fetch(`/api/services/list`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update wishlist");
  }
}
