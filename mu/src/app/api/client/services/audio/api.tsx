interface UpdateSongData {
  name?: string;
  artist?: string;
  categoryid?: string;
  favourite?: boolean;
}

//get r2 storage status
export async function storageStatus() {
  const response = await fetch("/api/services/storageStatus", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to get storage status");
  }
}

//get database status
export async function databaseStatus() {
  const response = await fetch("/api/services/databaseStatus", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to get database status");
  }
}

//get least streamed songs by percentage
export async function leastStreamedSongs(percentile: number) {
  const response = await fetch("/api/services/leastStream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ percentile: percentile }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to get least streamed songs");
  }
}

//delete least streamed songs
export async function deleteLeastStreamedSongs(percentile: number) {
  const response = await fetch("/api/services/leastStream", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ percentile: percentile }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error("Failed to delete least streamed songs");
  }
}

//post audio file
export async function uploadSong(
  file: File,
  name: string,
  artist: string,
  category: string,
) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("name", name);
  formData.append("artist", artist);
  formData.append("category", category);

  const response = await fetch("/api/services/upload", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to upload song");
  }
}

//get all songs
export async function getAllSongs(
  page: number,
  limit: number,
  search: string,
  category: string,
  useVector: boolean,
) {
  const response = await fetch("/api/services/audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page, limit, search, category, useVector }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch songs");
  }
}

//delete song
export async function deleteSong(id: string) {
  const response = await fetch("/api/services/audio", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete song");
  }
}

//update song
export async function updateSong(id: string, updates: UpdateSongData) {
  const response = await fetch("/api/services/audio", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update song");
  }
}

//get one song by id
export async function getSongById(id: string) {
  const response = await fetch(`/api/services/audio/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch song");
  }
}

//stream songs
export async function streamSongs(lastArtist = "", category = "All") {
  const params = new URLSearchParams();

  if (lastArtist) {
    params.append("previousArtist", lastArtist);
  }

  if (category && category !== "All") {
    params.append("categoryid", category);
  }

  const queryString = params.toString();
  const url = queryString ? `/api/services/listen?${queryString}` : "/api/services/listen";

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to stream songs");
  }
}

//stream song by id
export async function streamSongById(id: string) {
  const response = await fetch(`/api/services/audio/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    return response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to stream song");
  }
}

//Update skip count for a song
export async function updateSkipPlayCount(id: string, action: "skip" | "play") {
  const response = await fetch("/api/services/listen", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trackId: id, action }),
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update skip count");
  }
}
