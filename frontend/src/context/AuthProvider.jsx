import {
    useEffect,
    useState,
} from "react";
import api from "../api/axios";
import AuthContext from "./AuthContext";

function getStoredToken() {
    return (
        sessionStorage.getItem("token") ??
        localStorage.getItem("token")
    );
}

function clearStoredAuthentication() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
}

export default function AuthProvider({ children }) {
    const initialToken = getStoredToken();

    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(
        Boolean(initialToken)
    );

    useEffect(() => {
        if (!token) {
            return undefined;
        }

        let cancelled = false;

        const loadCurrentUser = async () => {
            try {
                const response = await api.get("/me");

                const currentUser =
                    response.data.data ??
                    response.data.user ??
                    response.data;

                if (!cancelled) {
                    setUser(currentUser);
                }
            } catch (error) {
                console.error(error);

                clearStoredAuthentication();

                if (!cancelled) {
                    setToken(null);
                    setUser(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadCurrentUser();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const saveAuthentication = ({
        token: newToken,
        user: authenticatedUser,
        remember = false,
    }) => {
        clearStoredAuthentication();

        const storage = remember
            ? localStorage
            : sessionStorage;

        storage.setItem("token", newToken);
        storage.setItem(
            "user",
            JSON.stringify(authenticatedUser)
        );

        setToken(newToken);
        setUser(authenticatedUser);
        setLoading(false);
    };

    const logout = async () => {
        try {
            await api.post("/logout");
        } catch (error) {
            console.error(error);
        } finally {
            clearStoredAuthentication();
            setToken(null);
            setUser(null);
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                loading,
                isAuthenticated: Boolean(token && user),
                saveAuthentication,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
