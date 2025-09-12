/* eslint-disable no-undef */
import axios from "axios";
//Api Client
const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export { apiClient };