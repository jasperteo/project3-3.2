import Button from "@mui/material/Button";
import { Link } from "react-router-dom";

export default function Payment() {
  return (
    <>
      <h2>Payment Successful!</h2>
      <Link to="/listings">
        <Button variant="contained">Go back to Home</Button>
      </Link>
    </>
  );
}
