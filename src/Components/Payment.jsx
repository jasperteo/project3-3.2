import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { BASE_URL } from "./Constants";

export default function Payment({ userId, axiosAuth }) {
  const params = useParams();

  const putRequest = async (url, data) => await axiosAuth.put(url, data);
  const { mutate } = useMutation({
    mutationFn: (data) =>
      putRequest(`${BASE_URL}/listings/${params.listingId}`, data),
  });

  useEffect(() => {
    mutate({ buyerId: userId });
  }, [mutate, userId]);

  return (
    <>
      <h2>Payment Successful!</h2>
      <Link to="/listings">
        <Button variant="contained">Go back to Home</Button>
      </Link>
    </>
  );
}
