//get activity
export async function getAllActivity(page: number = 1, limit: number = 10) {
  const response = await fetch(`/api/services/acitivity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, limit }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch activity");
  }
}

//delete activity
export async function deleteActivity(id: string, ip: string) {
  const response = await fetch(`/api/services/acitivity`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ip }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete activity");
  }
}
