/* eslint-disable no-undef */
import axios from "axios";
//Api Client
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5050/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export { apiClient };