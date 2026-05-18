import { createContext, useContext, useReducer, useEffect } from "react";
const savedUser = localStorage.getItem("user");
const initialState = {
  token: localStorage.getItem("token"),
  user: savedUser ? JSON.parse(savedUser) : null,
  isAuthenticated: !!localStorage.getItem("token"),
  isLoading: true
  // Start true while we check if token is valid
};
function authReducer(state, action) {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false
      };
    case "LOGOUT":
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false
      };
    case "UPDATE_PROFILE":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload, isLoading: false, isAuthenticated: true };
    default:
      return state;
  }
}
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  useEffect(() => {
    if (state.token && !state.user) {
      dispatch({ type: "SET_LOADING", payload: false });
    } else {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.token]);
  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: "LOGIN_SUCCESS", payload: { token, user } });
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };
  const updateProfile = (user) => {
    dispatch({ type: "UPDATE_PROFILE", payload: user });
  };
  return <AuthContext.Provider value={{ ...state, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>;
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
export {
  AuthContext,
  AuthProvider,
  useAuth
};
