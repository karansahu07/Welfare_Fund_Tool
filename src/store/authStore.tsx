"use client";

import axios from "axios";
import CryptoJS from "crypto-js";
import { makeAutoObservable, toJS } from "mobx";
import {
  action,
  autorun,
  computed,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import { useRouter } from "next/navigation";

axios.defaults.baseURL = "/";
axios.defaults.withCredentials = true;

const SECRET_KEY = "your-secret-key";

const initialUser = {
  role: "",
  username: "",
  useremail: "",
  email: "",
  homeRoute: "/",
  avatar: "",
};

type Auth = {
  user: typeof initialUser,
  isInitialized: boolean,
  isAuthenticated: boolean,
  isSubmitting: boolean,
  error: null | string,
  message: null | string,
}

class AuthStore {
  auth: Auth = {
    user: { ...initialUser },
    isInitialized: false,
    isAuthenticated: false,
    isSubmitting: false,
    error: null,
    message: null,
  };
   logoutRedirecting = false; //  Add this line here
  // lastRole: any;

  constructor() {
   makeAutoObservable(this)

    if (typeof window !== "undefined") {
      this.loadFromLocalStorage();

      autorun(() => {
        if (this.auth.isInitialized) {
          this.saveToLocalStorage();
        }
      });
    }
  }

  encryptData(data: any) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  }

  decryptData(cipherText: string | CryptoJS.lib.CipherParams) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  }

  saveToLocalStorage() {
    try {
      const encryptedData = this.encryptData({ auth: { ...this.auth, error: "", message: "" } });
      localStorage.setItem("user", encryptedData);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  loadFromLocalStorage() {
    try {
      const encryptedData = localStorage.getItem("user");
      if (encryptedData) {
        const parsedData = this.decryptData(encryptedData);
        if (parsedData?.auth) {
          runInAction(() => {
            this.auth = parsedData.auth;
          });
          console.log("Loaded auth from storage:", this.auth);
        }
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }

  async initialize() {
    runInAction(() => {
      this.auth.isSubmitting = true;
      this.auth.isAuthenticated = false;
      this.auth.error = null;
      this.auth.message = null;
    });

    try {
      if (typeof window !== "undefined") {
        const encryptedData = localStorage.getItem("user");
        if (encryptedData) {
          const parsedData = this.decryptData(encryptedData);
          if (parsedData?.auth?.isAuthenticated && parsedData.auth.user?.email) {
            runInAction(() => {
              this.auth = {
                ...parsedData.auth,
                user: {
                  ...initialUser,
                  ...parsedData.auth.user,
                  username: parsedData.auth.user.username || parsedData.auth.user.email?.split("@")[0] || "",
                },
              };
                  this.auth.isAuthenticated = true; // ✅ forcefully set again
              this.auth.message = "Session restored from storage.";
            });
          } else {
            runInAction(() => {
              this.auth.user = { ...initialUser };
              this.auth.isAuthenticated = false;
              this.auth.message = "No valid session found.";
            });
          }
        }
      }
    } catch (err) {
      console.error("Initialization error:", err);
      runInAction(() => {
        this.auth.error = "Failed to initialize authentication.";
        this.auth.user = { ...initialUser };
        this.auth.isAuthenticated = false;
      });
    } finally {
      runInAction(() => {
        this.auth.isInitialized = true;
        this.auth.isSubmitting = false;
      });
    }

    console.log("Initializing...", typeof window, { ...this.auth });
  }

  async login(email: any, password: any) {
    // const router = useRouter();
    runInAction(() => {
      this.auth.isSubmitting = true;
      this.auth.error = null;
      this.auth.message = null;
    });

    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { data } = response;

      console.log("From server", data.user);

      runInAction(() => {
        this.auth.isAuthenticated = true;
        this.auth.user = {
          ...initialUser,
          ...data.user,
          username: data.user.username || data.user.email?.split("@")[0] || "",
          useremail: data.user.email || "",
        };
        this.auth.isInitialized = true;
        this.auth.message = "Logged in successfully";
        this.auth.error = null;
        // router.push("/admin/dashboard");
      });

        // ✅ Save auth state to localStorage after successful login
    // this.saveToLocalStorage(); // <--- ADD THIS LINE

    } catch (error: any) {
      runInAction(() => {
        this.auth.error = error.response?.data?.message || "Login failed.";
      });
    } finally {
      runInAction(() => {
        this.auth.isSubmitting = false;
      });
    }
  }
async logout() {
  try {
    runInAction(() => {
      this.logoutRedirecting = true; // 👈 Redirecting started
    });

    await axios.get("/api/auth/logout");

    runInAction(() => {
      this.auth.isAuthenticated = false;
      this.auth.user = { ...initialUser };
      this.auth.message = "Logged Out Successfully";
      this.auth.error = null;

      console.log("auth state after runInAction:", toJS(this.auth));
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }

  } catch (error) {
    console.error("Logout failed:", error);
    runInAction(() => {
      this.auth.error = "Logout Failed.";
    });
  } finally {
    setTimeout(() => {
      runInAction(() => {
        this.logoutRedirecting = false; // 👈 Redirecting ended after delay
      });
    }, 1000); // Delay (optional): adjust if needed
  }
}


  setAuthError(err: any) {
    runInAction(() => {
      this.auth.error = err;
    });
  }

  get getRole() {
    return this.auth.user.role || "";
  }

  get getUser() {
    return this.auth.user;
  }
}

export default AuthStore;