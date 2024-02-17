import { useQuery } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import "./App.css";
import Profile from "./Components/Profile";
import NavBar from "./Components/NavBar";
import Login from "./Components/Login";
import Listings from "./Components/Listings";
import SingleListing from "./Components/SingleListing";
import Payment from "./Components/Payment";

export default function App() {
  const [userId, setUserId] = useState("");
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const { data: accessToken } = useQuery({
    queryKey: ["accessToken"],
    queryFn: async () =>
      await getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUDIENCE },
      }),
    enabled: isAuthenticated,
  });

  const axiosAuth = axios.create({
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />,
    },
    {
      path: "/listings",
      element: (
        <>
          <Outlet />
          <Listings userId={userId} axiosAuth={axiosAuth} />
          <NavBar userId={userId} axiosAuth={axiosAuth} />
        </>
      ),
      children: [
        {
          path: ":listingId",
          element: (
            <>
              <SingleListing userId={userId} axiosAuth={axiosAuth} />
            </>
          ),
        },
      ],
    },
    {
      path: "/profile",
      element: (
        <>
          <Profile
            userId={userId}
            setUserId={setUserId}
            axiosAuth={axiosAuth}
          />
          <NavBar userId={userId} axiosAuth={axiosAuth} />
        </>
      ),
    },
    {
      path: "/payment",
      element: (
        <>
          <Payment />
          <NavBar userId={userId} axiosAuth={axiosAuth} />
        </>
      ),
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
