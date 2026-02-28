//get all categories
export async function getAllCategories() {
  const response = await fetch("/api/services/category", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch categories");
  }
}

//Add new category
export async function addCategory(name: string) {
  const response = await fetch("/api/services/category", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to add category");
  }
}

//Delete category
export async function deleteCategory(id: string) {
  const response = await fetch(`/api/services/category`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete category");
  }
}

//edit category
export async function editCategory(id: string, name: string) {
  const response = await fetch(`/api/services/category`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update category");
  }
}
