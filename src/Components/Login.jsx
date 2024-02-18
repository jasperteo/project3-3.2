import Button from "@mui/material/Button";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [isAuthenticated, navigate]);

  const LoginButton = () => (
    <Button
      variant="contained"
      sx={{
        flex: 1,
        bgcolor: "#A6D9F7",
        color: "inherit",
        fontFamily: "inherit",
        fontWeight: "550",
      }}
      onClick={() => loginWithRedirect()}>
      Log In
    </Button>
  );

  return (
    <>
      <div>
        <img
          width="200"
          height="200"
          src="https://img.icons8.com/bubbles/200/watches-front-view--v2.png"
          alt="watches-front-view--v2"
        />
      </div>
      <h1>Watch Out</h1>
      <LoginButton />
    </>
  );
}
