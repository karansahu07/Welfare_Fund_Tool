import { toast } from "react-toastify";
import useStore from "./useAuth";
import { useState } from "react";

// Define the shape of API call state
interface ApiCallState {
  isLoading: boolean;
  isSuccess: string | null;
  isError: string | null;
}

// Allowed HTTP methods
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Success status mapping based on method
const successStatus = (method: HttpMethod): number => {
  switch (method) {
    case "GET":
      return 200;
    case "POST":
      return 201;
    default:
      return 200;
  }
};

const useApiCall = <TResponse = any>(
  endpoint = "",
  method: HttpMethod = "GET"
): [ApiCallState, (queryParams?: Record<string, any>, body?: any) => Promise<TResponse | void>] => {
  const store = useStore();
  const [state, setState] = useState<ApiCallState>({
    isLoading: false,
    isSuccess: null,
    isError: null
  });

  const fetchData = async (
    queryParams: Record<string, any> = {},
    body: any = null
  ): Promise<TResponse | void> => {
    setState({ isLoading: true, isSuccess: null, isError: null });

    // Build query string
    const queryString = Object.keys(queryParams)
      .filter(
        (key) =>
          queryParams[key] !== "" &&
          queryParams[key] !== " " &&
          queryParams[key] !== null &&
          queryParams[key] !== undefined
      )
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .join("&");

    try {
      const res = await fetch(`${endpoint}?${queryString}`, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        ...(body && { body: JSON.stringify(body) })
      });

      const json = await res.json();

      if (res.status === 401) {
        store.setAuthError("Session Expired! Please login again");
        store.logout();
        return;
      }

      if (res.status === successStatus(method)) {
        setState((s) => ({ ...s, isSuccess: "Data fetched successfully" }));
        return json as TResponse;
      } else {
        const message = json?.msg || "Unknown error";
        setState((s) => ({ ...s, isError: message }));
        toast.error(`Error: ${message}`);
      }
    } catch (error: any) {
      const message = error.message || "Request failed";
      toast.error(`Error: ${message}`);
      setState((s) => ({ ...s, isError: message }));
    } finally {
      setState((p) => ({ ...p, isLoading: false }));
    }
  };

  return [state, fetchData];
};

export default useApiCall;
